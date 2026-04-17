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
<title>FILMAX</title><style>
*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
:root{--primary:#e50914;--dark:#0f0f0f;--dark2:#1a1a1a;--dark3:#2a2a2a;--light:#fff;--light2:#b3b3b3}
html,body{background:var(--dark);color:var(--light);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;height:100%;overflow:hidden}
#app{height:100%;display:flex;flex-direction:row}
.sidebar{width:240px;background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);border-right:1px solid var(--dark3);overflow-y:auto;padding:20px 0;display:flex;flex-direction:column}
.logo-box{padding:0 20px 30px;border-bottom:1px solid var(--dark3)}
.logo{color:var(--primary);font-weight:900;font-size:28px;letter-spacing:-1px;text-transform:uppercase}
.nav-section{padding:20px 0;border-bottom:1px solid var(--dark3)}
.nav-section:last-child{border-bottom:none}
.nav-title{padding:0 20px;color:var(--light2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.nav-item{padding:10px 20px;color:var(--light2);font-size:14px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px}
.nav-item:hover,.nav-item.active{color:var(--light);background:rgba(229,9,20,0.1);border-left:3px solid var(--primary);padding-left:17px}
.nav-icon{width:20px;text-align:center}
.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden}
.top-bar{background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);padding:15px 30px;display:flex;align-items:center;gap:20px;border-bottom:1px solid var(--dark3);z-index:100}
.search-box{flex:1;max-width:400px}
.search-input{width:100%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:var(--light);padding:10px 15px;border-radius:4px;font-size:14px;transition:all 0.2s}
.search-input:focus{outline:none;background:rgba(255,255,255,0.15);border-color:var(--primary)}
.search-input::placeholder{color:var(--light2)}
.user-profile{width:40px;height:40px;background:var(--primary);border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer}
.hero{position:relative;height:350px;background-size:cover;background-position:center;overflow:hidden;display:flex;align-items:flex-end;padding:50px;background:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.8))}
.hero-content{z-index:10;max-width:500px}
.hero-title{font-size:48px;font-weight:900;margin-bottom:15px;text-transform:uppercase;letter-spacing:-1px}
.hero-rating{display:flex;align-items:center;gap:15px;margin-bottom:20px;font-size:14px}
.rating-badge{background:var(--primary);padding:4px 12px;border-radius:3px;font-weight:700}
.match-score{color:#41d854}
.hero-desc{color:var(--light2);font-size:15px;line-height:1.6;margin-bottom:25px;max-width:450px}
.hero-buttons{display:flex;gap:10px}
.btn-play,.btn-info{padding:12px 30px;border:none;border-radius:4px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:8px}
.btn-play{background:var(--light);color:#000;font-weight:700}
.btn-play:hover{background:#e0e0e0;transform:scale(1.05)}
.btn-info{background:rgba(109,109,110,0.7);color:var(--light)}
.btn-info:hover{background:rgba(109,109,110,0.9)}
.scroll-area{flex:1;overflow-y:auto;padding:40px 30px;-webkit-overflow-scrolling:touch}
.section{margin-bottom:50px}
.section-title{font-size:24px;font-weight:700;margin-bottom:20px;padding-left:0}
.carousel{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:10px 0}
.card{position:relative;aspect-ratio:2/3;background:var(--dark2);border-radius:6px;overflow:hidden;cursor:pointer;transition:all 0.3s;border:2px solid transparent;flex-shrink:0}
.card:hover{transform:scale(1.08);box-shadow:0 8px 20px rgba(229,9,20,0.4);border-color:var(--primary);z-index:20}
.card img{width:100%;height:100%;object-fit:cover;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);opacity:0;transition:opacity 0.3s}
.card img.loaded{opacity:1}
.card-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:15px 10px 10px;opacity:0;transition:opacity 0.2s}
.card:hover .card-overlay{opacity:1}
.card-title{font-size:12px;font-weight:600;line-height:1.4}
.loading{text-align:center;padding:30px;color:var(--light2);display:none}
.loading.show{display:block}
.loader{width:40px;height:40px;border:3px solid rgba(229,9,20,0.3);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px}
@keyframes spin{to{transform:rotate(360deg)}}
.player{position:fixed;inset:0;background:#000;z-index:200;display:none;flex-direction:column}
.player.open{display:flex}
video{flex:1;width:100%;height:100%;background:#000}
.p-ui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;opacity:1;transition:.2s;background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 30%,transparent 70%,rgba(0,0,0,0.6) 100%);pointer-events:none}
.p-ui>*{pointer-events:auto}
.p-ui.hide{opacity:0}
.p-ui.hide>*{pointer-events:none}
.p-top{padding:20px;padding-top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;align-items:flex-start}
.p-back{background:rgba(0,0,0,0.5);border:none;color:var(--light);font-size:24px;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all 0.2s}
.p-back:hover{background:var(--primary);color:#000}
.p-title{font-size:18px;font-weight:700}
.p-bottom{padding:20px;padding-bottom:max(20px,env(safe-area-inset-bottom))}
.p-prog{display:flex;align-items:center;gap:12px;margin-bottom:15px}
.p-time{font-size:12px;min-width:50px}
.p-bar{flex:1;height:8px;background:rgba(255,255,255,0.2);border-radius:4px;position:relative;cursor:pointer}
.p-bar-fill{position:absolute;left:0;top:0;height:100%;background:var(--primary);border-radius:4px;box-shadow:0 0 10px rgba(229,9,20,0.6)}
.p-bar-buf{position:absolute;left:0;top:0;height:100%;background:rgba(255,255,255,0.4);border-radius:4px;z-index:-1}
.p-ctrl{display:flex;justify-content:center;gap:15px;align-items:center}
.p-btn{width:50px;height:50px;background:rgba(255,255,255,.1);border:none;border-radius:50%;color:var(--light);font-size:14px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.p-btn:hover{background:rgba(229,9,20,0.5);transform:scale(1.1)}
.p-btn.main{width:60px;height:60px;font-size:20px;background:var(--primary);color:#000;font-weight:700}
.p-btn.main:hover{background:#ff1a1a;transform:scale(1.15)}
.p-status{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:var(--light);display:none;pointer-events:none}
.p-status.show{display:block}
.p-spin{width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 15px}
.msg{text-align:center;padding:60px 20px;color:var(--light2);font-size:16px}
@media(max-width:768px){
    .sidebar{width:0;padding:0}
    .top-bar{padding:10px 15px}
    .search-box{max-width:150px}
    .scroll-area{padding:20px 15px}
    .hero{height:200px;padding:30px}
    .hero-title{font-size:32px}
    .carousel{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
    .card{aspect-ratio:2/3}
}
</style></head><body>
<div id="app">
    <div class="sidebar" id="sidebar">
        <div class="logo-box">
            <div class="logo">► Filmax</div>
        </div>
        <div class="nav-section">
            <div class="nav-title">Menú</div>
            <div class="nav-item active" data-nav="home"><span class="nav-icon">🏠</span> Inicio</div>
            <div class="nav-item" data-nav="trending"><span class="nav-icon">🔥</span> Tendencias</div>
            <div class="nav-item" data-nav="search"><span class="nav-icon">🔍</span> Buscar</div>
        </div>
        <div class="nav-section">
            <div class="nav-title">Mi Lista</div>
            <div class="nav-item"><span class="nav-icon">❤️</span> Favoritos</div>
            <div class="nav-item"><span class="nav-icon">👁️</span> Viendo</div>
        </div>
    </div>

    <div class="main-content">
        <div class="top-bar">
            <div class="search-box">
                <input class="search-input" id="srch" placeholder="Buscar..." autocomplete="off">
            </div>
            <button class="btn-info" id="randomBtn" style="margin-left:auto;padding:8px 16px;">🎲 Aleatorio</button>
            <div class="user-profile">MH</div>
        </div>

        <div class="scroll-area" id="scrollArea">
            <div class="hero" id="hero">
                <div class="hero-content">
                    <div class="hero-title" id="heroTitle">Bienvenido</div>
                    <div class="hero-rating">
                        <span class="rating-badge">HD</span>
                        <span class="match-score" id="heroMatch">97% Match</span>
                    </div>
                    <div class="hero-desc" id="heroDesc">Explora miles de películas seleccionadas especialmente para ti.</div>
                    <div class="hero-buttons">
                        <button class="btn-play" id="heroPlay">▶ Reproducir</button>
                        <button class="btn-info" id="heroInfo">ℹ️ Información</button>
                    </div>
                </div>
            </div>

            <div id="content">
                <div class="section">
                    <div class="section-title">Popular Ahora</div>
                    <div class="carousel" id="grid"></div>
                </div>
            </div>

            <div class="loading" id="loading">
                <div class="loader"></div>
                <div>Cargando más películas...</div>
            </div>
        </div>
    </div>

    <div class="player" id="player">
        <div class="p-ui" id="pUi">
            <div class="p-top">
                <button class="p-back" id="pBack">✕</button>
                <div class="p-title" id="pTitle"></div>
                <div></div>
            </div>
            <div class="p-status" id="pStatus">
                <div class="p-spin"></div>
                <div id="pStatusTxt">Cargando...</div>
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
                    <button class="p-btn" id="pRw" title="Retroceder 10s">⏪</button>
                    <button class="p-btn main" id="pPp" title="Play/Pause">▶</button>
                    <button class="p-btn" id="pFw" title="Adelantar 10s">⏩</button>
                </div>
            </div>
        </div>
        <video id="vid" playsinline webkit-playsinline></video>
    </div>
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
    randomBtn: $('randomBtn'), loading: $('loading')
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
    searchQuery: ''
};

function esc(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
}

function loadMovies(page = 0, query = '', random = false) {
    if (S.isLoading) return;
    S.isLoading = true;
    el.loading.classList.add('show');

    const url = '/api/movies?page=' + page + '&limit=50' + (query ? '&q=' + encodeURIComponent(query) : '') + (random ? '&random=true' : '');

    fetch(url)
        .then(r => r.json())
        .then(d => {
            S.isLoading = false;
            el.loading.classList.remove('show');

            if (page === 0) {
                el.grid.innerHTML = '';
                S.movies = [];
            }

            S.hasMore = d.hasMore;
            S.movies = S.movies.concat(d.data);
            S.allMovies = d.data;

            d.data.forEach(m => {
                el.grid.appendChild(mkCard(m));
            });

            if (d.data.length > 0 && page === 0) {
                updateHero(d.data[0]);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            S.isLoading = false;
            el.loading.classList.remove('show');
        });
}

function updateHero(m) {
    el.heroTitle.textContent = m.title;
    if (m.poster) {
        el.hero.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.8)),url(' + esc(m.poster) + ')';
    }
}

function mkCard(m) {
    const d = document.createElement('div');
    d.className = 'card';
    
    const imgHtml = m.poster ? '<img data-src="' + esc(m.poster) + '" alt="' + esc(m.title) + '">' : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);display:flex;align-items:center;justify-content:center">Sin imagen</div>';
    
    d.innerHTML = imgHtml + '<div class="card-overlay"><div class="card-title">' + esc(m.title) + '</div></div>';
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
        console.log('URL original:', u);

        if (u.includes('http://') || u.includes('https://')) {
            u = '/video-proxy?url=' + encodeURIComponent(u);
            console.log('URL proxy:', u);
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
    }, 300);
}

function closeP() {
    el.vid.pause();
    el.vid.src = '';
    el.player.classList.remove('open');
    S.view = 'home';
    el.pStatus.classList.remove('show');
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
    }, 3000);
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
el.player.ontouchend = () => showUI();

document.onkeydown = e => {
    if (S.view === 'player') {
        e.preventDefault();
        if (e.key === 'ArrowLeft') seek(-10);
        else if (e.key === 'ArrowRight') seek(10);
        else if (e.key === 'ArrowUp') { el.vid.volume = Math.min(1, el.vid.volume + 0.1); }
        else if (e.key === 'ArrowDown') { el.vid.volume = Math.max(0, el.vid.volume - 0.1); }
        else if (e.key === 'Enter' || e.key === ' ') toggle();
        else if (e.key === 'Escape') closeP();
    }
};

let searchTimer;
el.srch.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const q = el.srch.value.trim();
        S.searchQuery = q;
        S.currentPage = 0;
        if (q) {
            S.searching = true;
            loadMovies(0, q);
        } else {
            S.searching = false;
            S.currentPage = 0;
            loadMovies(0);
        }
    }, 400);
};

el.heroPlay.onclick = () => {
    if (S.allMovies.length > 0) play(S.allMovies[0]);
};

el.randomBtn.onclick = () => {
    S.currentPage = 0;
    S.searchQuery = '';
    el.srch.value = '';
    loadMovies(0, '', true);
};

el.scrollArea.addEventListener('scroll', () => {
    if (S.isLoading || !S.hasMore) return;

    const scrolled = el.scrollArea.scrollTop + el.scrollArea.clientHeight;
    const threshold = el.scrollArea.scrollHeight - 500;

    if (scrolled > threshold) {
        S.currentPage++;
        loadMovies(S.currentPage, S.searchQuery);
    }
});

loadMovies(0);
})();
</script></body></html>`));

app.listen(PORT, '0.0.0.0', () => console.log('🎬 Filmax → Puerto ' + PORT + ' | ' + MOVIES.length + ' películas'));
