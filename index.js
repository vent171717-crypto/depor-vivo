const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
let MOVIES = [];

try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.DATA_FILE || 'data.json'), 'utf8'));
    MOVIES = data.map((m, i) => ({ id: i, title: m.title || 'Sin título', poster: m.logo || '', url: m.url || '', description: m.description || '' }));
    console.log(`✓ ${MOVIES.length} películas`);
} catch (e) { console.error('Error:', e.message); }

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range,Accept-Ranges,Content-Length');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.get('/api/movies', (req, res) => {
    const { page = 0, limit = 50, q = '', random } = req.query;
    let list = q ? MOVIES.filter(m => m.title.toLowerCase().includes(q.toLowerCase())) : [...MOVIES];
    if (random === 'true') list.sort(() => Math.random() - 0.5);
    const start = page * limit;
    res.json({ total: list.length, hasMore: start + +limit < list.length, data: list.slice(start, start + +limit) });
});

app.get('/video-proxy', (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).end();
    let parsed;
    try { parsed = new URL(decodeURIComponent(url)); } catch { return res.status(400).end(); }
    const client = parsed.protocol === 'https:' ? https : http;
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Accept-Encoding': 'identity', 'Referer': parsed.origin + '/' };
    if (req.headers.range) headers['Range'] = req.headers.range;
    const proxyReq = client.request({ hostname: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80), path: parsed.pathname + parsed.search, headers, timeout: 30000 }, proxyRes => {
        if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
            proxyRes.destroy();
            return res.redirect(307, '/video-proxy?url=' + encodeURIComponent(proxyRes.headers.location));
        }
        const h = { 'Content-Type': proxyRes.headers['content-type'] || 'video/mp4', 'Accept-Ranges': 'bytes' };
        if (proxyRes.headers['content-length']) h['Content-Length'] = proxyRes.headers['content-length'];
        if (proxyRes.headers['content-range']) h['Content-Range'] = proxyRes.headers['content-range'];
        res.writeHead(proxyRes.statusCode, h);
        proxyRes.pipe(res);
        proxyRes.on('error', () => res.end());
    });
    proxyReq.on('error', () => !res.headersSent && res.status(502).end());
    proxyReq.on('timeout', () => { proxyReq.destroy(); !res.headersSent && res.status(504).end(); });
    req.on('close', () => proxyReq.destroy());
    proxyReq.end();
});

app.get('/', (req, res) => res.send(`<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>FILMAX - TV MODE</title><style>
*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
:root{--primary:#e50914;--dark:#0f0f0f;--dark2:#1a1a1a;--dark3:#2a2a2a;--light:#fff;--light2:#b3b3b3}
html,body{background:var(--dark);color:var(--light);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;height:100%;overflow:hidden}
#app{height:100%;display:flex;flex-direction:column}
.header{background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);padding:20px 30px;border-bottom:2px solid var(--primary);display:flex;justify-content:space-between;align-items:center;z-index:100}
.logo{color:var(--primary);font-weight:900;font-size:32px;letter-spacing:-1px;text-transform:uppercase}
.search-container{flex:1;margin:0 40px;max-width:500px;position:relative}
.search-input{width:100%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);color:var(--light);padding:12px 20px;border-radius:6px;font-size:16px;transition:all 0.2s;outline:none}
.search-input:focus{border-color:var(--primary);background:rgba(255,255,255,0.15);box-shadow:0 0 15px rgba(229,9,20,0.3)}
.search-input.focused{border-color:var(--primary);background:rgba(255,255,255,0.15)}
.search-input::placeholder{color:var(--light2)}
.info-bar{display:flex;gap:20px;align-items:center;color:var(--light2);font-size:14px}
.content-wrapper{flex:1;overflow:hidden;display:flex}
.main-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.hero{position:relative;height:280px;background-size:cover;background-position:center;overflow:hidden;display:flex;align-items:flex-end;padding:40px;background:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.8))}
.hero-content{z-index:10;max-width:600px}
.hero-title{font-size:52px;font-weight:900;margin-bottom:15px;text-transform:uppercase;letter-spacing:-1px;text-shadow:2px 2px 4px rgba(0,0,0,0.8)}
.hero-info{display:flex;gap:20px;margin-bottom:20px;font-size:15px}
.badge{background:var(--primary);padding:6px 14px;border-radius:4px;font-weight:700}
.rating{color:#41d854}
.hero-desc{color:var(--light2);font-size:16px;line-height:1.6;margin-bottom:25px;max-width:500px}
.hero-buttons{display:flex;gap:15px}
.btn-play,.btn-more{padding:14px 32px;border:none;border-radius:6px;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:10px}
.btn-play{background:var(--light);color:#000}
.btn-play:focus,.btn-play.focused{background:#ff1a1a;color:var(--light);box-shadow:0 0 20px rgba(229,9,20,0.8)}
.btn-more{background:rgba(109,109,110,0.7);color:var(--light)}
.btn-more:focus,.btn-more.focused{background:var(--primary);color:#000;box-shadow:0 0 20px rgba(229,9,20,0.8)}
.scroll-area{flex:1;overflow-y:auto;padding:40px 30px;-webkit-overflow-scrolling:touch}
.section{margin-bottom:60px}
.section-title{font-size:28px;font-weight:700;margin-bottom:25px;color:var(--light);text-shadow:1px 1px 2px rgba(0,0,0,0.5)}
.carousel{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;padding:10px 0}
.card{position:relative;aspect-ratio:2/3;background:var(--dark2);border-radius:8px;overflow:hidden;cursor:pointer;transition:all 0.3s;border:3px solid transparent;flex-shrink:0}
.card img{width:100%;height:100%;object-fit:cover;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);opacity:0;transition:opacity 0.3s}
.card img.loaded{opacity:1}
.card-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:20px 15px 15px;opacity:0;transition:opacity 0.2s}
.card-title{font-size:13px;font-weight:600;line-height:1.4}
.card:focus{outline:none;border-color:var(--primary);transform:scale(1.12);box-shadow:0 0 30px rgba(229,9,20,0.6);z-index:20}
.card:focus .card-overlay{opacity:1}
.card:focus .card-title{color:var(--primary)}
.focus-indicator{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;pointer-events:none}
.card:focus .focus-indicator{opacity:1}
.nav-hint{position:fixed;bottom:20px;left:30px;color:var(--light2);font-size:12px;background:rgba(0,0,0,0.7);padding:10px 15px;border-radius:4px;z-index:50}
.player{position:fixed;inset:0;background:#000;z-index:200;display:none;flex-direction:column}
.player.open{display:flex}
video{flex:1;width:100%;height:100%;background:#000}
.p-ui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;opacity:1;transition:.2s;background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 30%,transparent 70%,rgba(0,0,0,0.6) 100%);pointer-events:none}
.p-ui>*{pointer-events:auto}
.p-ui.hide{opacity:0}
.p-ui.hide>*{pointer-events:none}
.p-top{padding:30px;display:flex;justify-content:space-between;align-items:flex-start}
.p-back{background:rgba(0,0,0,0.6);border:2px solid rgba(255,255,255,0.3);color:var(--light);font-size:28px;cursor:pointer;width:50px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s}
.p-back:hover,.p-back:focus{background:var(--primary);color:#000;border-color:var(--primary);outline:none}
.p-title{font-size:22px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.8)}
.p-bottom{padding:30px}
.p-prog{display:flex;align-items:center;gap:15px;margin-bottom:20px}
.p-time{font-size:13px;min-width:60px;font-weight:600}
.p-bar{flex:1;height:10px;background:rgba(255,255,255,0.2);border-radius:5px;position:relative;cursor:pointer}
.p-bar-fill{position:absolute;left:0;top:0;height:100%;background:var(--primary);border-radius:5px;box-shadow:0 0 15px rgba(229,9,20,0.8)}
.p-bar-buf{position:absolute;left:0;top:0;height:100%;background:rgba(255,255,255,0.4);border-radius:5px;z-index:-1}
.p-ctrl{display:flex;justify-content:center;gap:20px;align-items:center}
.p-btn{width:60px;height:60px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);border-radius:8px;color:var(--light);font-size:16px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);font-weight:700}
.p-btn:hover,.p-btn:focus{background:rgba(229,9,20,0.5);border-color:var(--primary);transform:scale(1.15);outline:none;box-shadow:0 0 20px rgba(229,9,20,0.6)}
.p-btn.main{width:80px;height:80px;font-size:24px;background:var(--primary);color:#000;border:none}
.p-btn.main:hover,.p-btn.main:focus{background:#ff1a1a;transform:scale(1.2);box-shadow:0 0 30px rgba(229,9,20,0.8)}
.p-status{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:var(--light);display:none;pointer-events:none;z-index:10}
.p-status.show{display:block}
.p-spin{width:50px;height:50px;border:4px solid rgba(255,255,255,0.2);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 20px}
.msg{text-align:center;padding:60px 20px;color:var(--light2);font-size:18px}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1024px){
    .header{padding:15px 20px}
    .search-container{max-width:300px;margin:0 20px}
    .hero{height:220px;padding:30px}
    .hero-title{font-size:40px}
    .carousel{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
}
</style></head><body>
<div id="app">
    <div class="header">
        <div class="logo">► Filmax</div>
        <div class="search-container">
            <input class="search-input" id="srch" placeholder="Buscar con las flechas..." autocomplete="off">
        </div>
        <div class="info-bar">
            <span id="totalMovies">0 películas</span>
            <span id="currentMovie">-</span>
        </div>
    </div>

    <div class="content-wrapper">
        <div class="main-area">
            <div class="hero" id="hero">
                <div class="hero-content">
                    <div class="hero-title" id="heroTitle">Bienvenido</div>
                    <div class="hero-info">
                        <span class="badge">HD</span>
                        <span class="rating" id="heroMatch">97% Match</span>
                    </div>
                    <div class="hero-desc" id="heroDesc">Usa las flechas del control para navegar. Presiona OK o Enter para reproducir.</div>
                    <div class="hero-buttons">
                        <button class="btn-play" id="heroPlay" tabindex="0">▶ REPRODUCIR</button>
                        <button class="btn-more" id="heroInfo" tabindex="0">ℹ️ INFO</button>
                    </div>
                </div>
            </div>

            <div class="scroll-area" id="scrollArea">
                <div id="content">
                    <div class="section">
                        <div class="section-title">Popular Ahora</div>
                        <div class="carousel" id="grid"></div>
                    </div>
                </div>
                <div class="msg" id="loading" style="display:none">
                    <div style="font-size:24px;animation:spin 0.8s linear infinite;display:inline-block">⟳</div>
                    <div>Cargando más contenido...</div>
                </div>
            </div>
        </div>
    </div>

    <div class="player" id="player">
        <div class="p-ui" id="pUi">
            <div class="p-top">
                <button class="p-back" id="pBack" tabindex="0">✕</button>
                <div class="p-title" id="pTitle"></div>
                <div></div>
            </div>
            <div class="p-status" id="pStatus">
                <div class="p-spin"></div>
                <div id="pStatusTxt" style="font-size:18px">Conectando...</div>
            </div>
            <div class="p-bottom">
                <div class="p-prog">
                    <span class="p-time" id="pCur">0:00</span>
                    <div class="p-bar" id="pBar">
                        <div class="p-bar-buf" id="pBuf"></div>
                        <div class="p-bar-fill" id="pFill"></div>
                    </div>
                    <span class="p-time" id="pDur">0:00</span>
                </div>
                <div class="p-ctrl">
                    <button class="p-btn" id="pRw" tabindex="0">⏪ -10s</button>
                    <button class="p-btn main" id="pPp" tabindex="0">▶</button>
                    <button class="p-btn" id="pFw" tabindex="0">⏩ +10s</button>
                </div>
            </div>
        </div>
        <video id="vid" playsinline webkit-playsinline></video>
    </div>

    <div class="nav-hint" id="navHint">↑↓←→ Navega | OK/Enter Selecciona | ESC Atrás</div>
</div>

<script>
(function(){
const $ = id => document.getElementById(id);
const el = {
    grid: $('grid'), srch: $('srch'), scrollArea: $('scrollArea'),
    player: $('player'), vid: $('vid'), pUi: $('pUi'), pTitle: $('pTitle'),
    pStatus: $('pStatus'), pStatusTxt: $('pStatusTxt'), pBar: $('pBar'),
    pFill: $('pFill'), pBuf: $('pBuf'), pCur: $('pCur'), pDur: $('pDur'),
    pRw: $('pRw'), pPp: $('pPp'), pFw: $('pFw'), pBack: $('pBack'),
    hero: $('hero'), heroPlay: $('heroPlay'), heroTitle: $('heroTitle'),
    heroInfo: $('heroInfo'), totalMovies: $('totalMovies'), currentMovie: $('currentMovie'),
    loading: $('loading'), navHint: $('navHint')
};

const S = {
    view: 'home',
    movies: [],
    allMovies: [],
    playing: false,
    currentPage: 0,
    isLoading: false,
    hasMore: true,
    searching: false,
    focusedElement: null,
    focusableElements: [],
    currentFocusIndex: -1,
    inSearchMode: false
};

function esc(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
}

function getFocusableElements() {
    if (S.view === 'player') {
        return [el.pBack, el.pRw, el.pPp, el.pFw];
    }
    
    const elements = [el.heroPlay, el.heroInfo];
    const cards = [...el.grid.querySelectorAll('.card')];
    return elements.concat(cards);
}

function setFocus(element) {
    if (!element) return;
    
    if (S.focusedElement) {
        S.focusedElement.classList.remove('focused');
    }
    
    S.focusedElement = element;
    element.classList.add('focused');
    element.focus();
    
    if (element.classList.contains('card')) {
        const rect = element.getBoundingClientRect();
        const scrollArea = el.scrollArea;
        if (rect.top < 100) {
            scrollArea.scrollTop -= 100 - rect.top;
        } else if (rect.bottom > scrollArea.clientHeight - 100) {
            scrollArea.scrollTop += rect.bottom - scrollArea.clientHeight + 100;
        }
    }
}

function focusNext() {
    S.focusableElements = getFocusableElements();
    if (S.focusableElements.length === 0) return;
    
    S.currentFocusIndex++;
    if (S.currentFocusIndex >= S.focusableElements.length) {
        S.currentFocusIndex = 0;
    }
    
    setFocus(S.focusableElements[S.currentFocusIndex]);
}

function focusPrev() {
    S.focusableElements = getFocusableElements();
    if (S.focusableElements.length === 0) return;
    
    S.currentFocusIndex--;
    if (S.currentFocusIndex < 0) {
        S.currentFocusIndex = S.focusableElements.length - 1;
    }
    
    setFocus(S.focusableElements[S.currentFocusIndex]);
}

function loadMovies(page = 0, query = '', random = false) {
    if (S.isLoading) return;
    S.isLoading = true;
    el.loading.style.display = 'block';

    const url = '/api/movies?page=' + page + '&limit=50' + (query ? '&q=' + encodeURIComponent(query) : '') + (random ? '&random=true' : '');

    fetch(url)
        .then(r => r.json())
        .then(d => {
            S.isLoading = false;
            el.loading.style.display = 'none';

            if (page === 0) {
                el.grid.innerHTML = '';
                S.movies = [];
            }

            S.hasMore = d.hasMore;
            S.movies = S.movies.concat(d.data);
            S.allMovies = d.data;

            el.totalMovies.textContent = d.total + ' películas';

            d.data.forEach(m => {
                el.grid.appendChild(mkCard(m));
            });

            if (d.data.length > 0 && page === 0) {
                updateHero(d.data[0]);
                S.currentPage = 0;
                S.currentFocusIndex = -1;
                setFocus(el.heroPlay);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            S.isLoading = false;
            el.loading.style.display = 'none';
        });
}

function updateHero(m) {
    el.heroTitle.textContent = m.title;
    el.currentMovie.textContent = m.title;
    if (m.poster) {
        el.hero.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.8)),url(' + esc(m.poster) + ')';
    }
}

function mkCard(m) {
    const d = document.createElement('div');
    d.className = 'card';
    d.tabIndex = -1;
    
    const imgHtml = m.poster ? '<img data-src="' + esc(m.poster) + '" alt="' + esc(m.title) + '">' : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);display:flex;align-items:center;justify-content:center">Sin imagen</div>';
    
    d.innerHTML = imgHtml + '<div class="card-overlay"><div class="card-title">' + esc(m.title) + '</div></div><div class="focus-indicator" style="font-size:40px">▶</div>';
    d.onclick = () => play(m);

    if (m.poster) {
        lazyLoadImage(d.querySelector('img'));
    }

    return d;
}

function lazyLoadImage(img) {
    if (!img || !img.dataset.src) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !img.classList.contains('loaded')) {
                const imgEl = new Image();
                imgEl.onload = () => {
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                };
                imgEl.onerror = () => {
                    img.classList.add('loaded');
                };
                setTimeout(() => {
                    imgEl.src = img.dataset.src;
                }, 50);
                io.unobserve(img);
            }
        });
    }, { rootMargin: '200px' });

    io.observe(img);
}

function play(m) {
    console.log('▶ Reproduciendo:', m.title);
    S.view = 'player';
    el.pTitle.textContent = m.title;
    el.player.classList.add('open');
    el.vid.pause();

    el.pStatus.classList.add('show');
    el.pStatusTxt.textContent = 'Conectando...';

    setTimeout(() => {
        let u = m.url;
        if (u.includes('http://') || u.includes('https://')) {
            u = '/video-proxy?url=' + encodeURIComponent(u);
        }

        el.vid.src = u;
        el.vid.load();

        el.vid.play().then(() => {
            console.log('✓ Reproducción iniciada');
            el.pStatus.classList.remove('show');
        }).catch(err => {
            console.error('Error al reproducir:', err);
            el.pStatusTxt.textContent = 'Error: ' + err.message;
        });

        showUI();
        S.currentFocusIndex = -1;
        setFocus(el.pPp);
    }, 300);
}

function closeP() {
    el.vid.pause();
    el.vid.src = '';
    el.player.classList.remove('open');
    S.view = 'home';
    el.pStatus.classList.remove('show');
    S.currentFocusIndex = -1;
    setFocus(el.heroPlay);
}

el.vid.onloadstart = () => {
    el.pStatusTxt.textContent = 'Conectando...';
    el.pStatus.classList.add('show');
};

el.vid.oncanplay = () => {
    el.pStatus.classList.remove('show');
};

el.vid.onwaiting = () => {
    el.pStatusTxt.textContent = 'Buffering...';
    el.pStatus.classList.add('show');
};

el.vid.onplaying = () => {
    el.pStatus.classList.remove('show');
    S.playing = true;
    el.pPp.textContent = '⏸';
};

el.vid.onpause = () => {
    S.playing = false;
    el.pPp.textContent = '▶';
};

el.vid.ontimeupdate = () => {
    if (!el.vid.duration || !isFinite(el.vid.duration)) return;
    const percent = (el.vid.currentTime / el.vid.duration) * 100;
    el.pFill.style.width = percent + '%';
    el.pCur.textContent = fmt(el.vid.currentTime);
};

el.vid.ondurationchange = () => {
    if (isFinite(el.vid.duration)) {
        el.pDur.textContent = fmt(el.vid.duration);
    }
};

el.vid.onprogress = () => {
    try {
        if (el.vid.buffered && el.vid.buffered.length > 0) {
            const bufferedEnd = el.vid.buffered.end(el.vid.buffered.length - 1);
            const percent = (bufferedEnd / el.vid.duration) * 100;
            el.pBuf.style.width = percent + '%';
        }
    } catch (e) {}
};

el.vid.onerror = () => {
    const err = el.vid.error;
    let msg = 'Error desconocido';
    if (err) {
        const codes = ['', 'Abortado', 'Error de red', 'Error de decodificación', 'Formato no soportado'];
        msg = codes[err.code] || 'Error';
    }
    console.error('Error de video:', msg);
    el.pStatusTxt.textContent = msg;
    el.pStatus.classList.add('show');
};

function toggle() {
    if (el.vid.paused) {
        el.vid.play().catch(e => console.error(e));
    } else {
        el.vid.pause();
    }
}

function seek(s) {
    if (!el.vid.duration || !isFinite(el.vid.duration)) return;
    el.vid.currentTime = Math.max(0, Math.min(el.vid.currentTime + s, el.vid.duration));
}

let hideT;
function showUI() {
    el.pUi.classList.remove('hide');
    clearTimeout(hideT);
    hideT = setTimeout(() => {
        if (S.playing) el.pUi.classList.add('hide');
    }, 4000);
}

function fmt(s) {
    if (!s || !isFinite(s)) return '0:00';
    const h = ~~(s / 3600);
    const m = ~~(s % 3600 / 60);
    const ss = ~~(s % 60);
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0') : m + ':' + String(ss).padStart(2, '0');
}

el.pPp.onclick = toggle;
el.pRw.onclick = () => seek(-10);
el.pFw.onclick = () => seek(10);
el.pBar.onclick = e => {
    const r = el.pBar.getBoundingClientRect();
    if (el.vid.duration) el.vid.currentTime = (e.clientX - r.left) / r.width * el.vid.duration;
};
el.pBack.onclick = closeP;
el.player.onclick = e => {
    if (e.target === el.vid) {
        toggle();
        showUI();
    }
};
el.player.onmousemove = showUI;

el.heroPlay.onclick = () => {
    if (S.allMovies.length > 0) play(S.allMovies[0]);
};

el.heroInfo.onclick = () => {
    alert('Película: ' + el.heroTitle.textContent);
};

el.srch.addEventListener('focus', () => {
    S.inSearchMode = true;
    el.srch.classList.add('focused');
});

el.srch.addEventListener('blur', () => {
    S.inSearchMode = false;
    el.srch.classList.remove('focused');
});

let searchTimer;
el.srch.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const q = el.srch.value.trim();
        if (q) {
            loadMovies(0, q);
        } else {
            loadMovies(0);
        }
    }, 600);
};

document.addEventListener('keydown', e => {
    const key = e.key.toUpperCase();
    
    if (S.view === 'player') {
        if (key === 'ARROWLEFT') seek(-10);
        else if (key === 'ARROWRIGHT') seek(10);
        else if (key === 'ARROWUP') { el.vid.volume = Math.min(1, el.vid.volume + 0.1); el.pStatusTxt.textContent = '🔊 ' + ~~(el.vid.volume * 100) + '%'; el.pStatus.classList.add('show'); setTimeout(() => el.pStatus.classList.remove('show'), 1000); }
        else if (key === 'ARROWDOWN') { el.vid.volume = Math.max(0, el.vid.volume - 0.1); el.pStatusTxt.textContent = '🔊 ' + ~~(el.vid.volume * 100) + '%'; el.pStatus.classList.add('show'); setTimeout(() => el.pStatus.classList.remove('show'), 1000); }
        else if (key === 'ENTER' || key === ' ') { e.preventDefault(); toggle(); }
        else if (key === 'ESCAPE') closeP();
        else if (key === 'ARROWDOWN') focusNext();
        else if (key === 'ARROWUP') focusPrev();
        return;
    }

    if (S.inSearchMode) {
        if (key === 'ESCAPE') {
            el.srch.blur();
            S.inSearchMode = false;
        }
        return;
    }

    if (key === 'ARROWDOWN') { e.preventDefault(); focusNext(); }
    else if (key === 'ARROWUP') { e.preventDefault(); focusPrev(); }
    else if (key === 'ARROWLEFT') { e.preventDefault(); if (S.focusedElement === el.heroInfo) setFocus(el.heroPlay); }
    else if (key === 'ARROWRIGHT') { e.preventDefault(); if (S.focusedElement === el.heroPlay) setFocus(el.heroInfo); }
    else if (key === 'ENTER' || key === ' ') { 
        e.preventDefault();
        if (S.focusedElement) S.focusedElement.click();
    }
    else if (key === 'ESCAPE') { 
        if (S.inSearchMode) {
            el.srch.blur();
            S.inSearchMode = false;
        }
    }
}, true);

el.scrollArea.addEventListener('scroll', () => {
    if (S.isLoading || !S.hasMore) return;
    const scrolled = el.scrollArea.scrollTop + el.scrollArea.clientHeight;
    const threshold = el.scrollArea.scrollHeight - 800;
    if (scrolled > threshold) {
        S.currentPage++;
        loadMovies(S.currentPage);
    }
});

loadMovies(0);
})();
</script></body></html>`));

app.listen(PORT, '0.0.0.0', () => console.log('🎬 Filmax TV Mode → Puerto ' + PORT + ' | ' + MOVIES.length + ' películas'));
