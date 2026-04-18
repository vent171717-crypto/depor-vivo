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
    const start = parseInt(page) * parseInt(limit);
    const end = start + parseInt(limit);
    res.json({ total: list.length, hasMore: end < list.length, data: list.slice(start, end) });
});

app.get('/video-proxy', (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).end();
    let parsed;
    try { parsed = new URL(decodeURIComponent(url)); } catch { return res.status(400).end(); }
    const client = parsed.protocol === 'https:' ? https : http;
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*', 
        'Accept-Encoding': 'identity', 
        'Referer': parsed.origin + '/',
        'Connection': 'keep-alive'
    };
    if (req.headers.range) headers['Range'] = req.headers.range;
    
    const proxyReq = client.request({ 
        hostname: parsed.hostname, 
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80), 
        path: parsed.pathname + parsed.search, 
        headers, 
        timeout: 30000 
    }, proxyRes => {
        if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
            proxyRes.destroy();
            return res.redirect(307, '/video-proxy?url=' + encodeURIComponent(proxyRes.headers.location));
        }
        const h = { 
            'Content-Type': proxyRes.headers['content-type'] || 'video/mp4', 
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*'
        };
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

app.get('/', (req, res) => res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>FILMAX TV - Streaming Platform</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

:root {
    --primary: #e50914;
    --primary-dark: #b20710;
    --dark: #0a0a0a;
    --dark2: #141414;
    --dark3: #1f1f1f;
    --light: #ffffff;
    --light2: #b3b3b3;
    --focus-glow: 0 0 0 3px rgba(229,9,20,0.6), 0 0 0 6px rgba(229,9,20,0.3);
}

html, body {
    background: var(--dark);
    color: var(--light);
    font-family: 'Segoe UI', 'Netflix Sans', system-ui, -apple-system, sans-serif;
    height: 100%;
    overflow: hidden;
}

/* TV Focus Styles */
.focusable:focus, [tabindex]:focus {
    outline: none;
}

.focusable.focused, .focused {
    transform: scale(1.05);
    box-shadow: var(--focus-glow);
    border-color: var(--primary) !important;
    transition: all 0.15s ease;
}

/* Layout */
.app {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Header */
.header {
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.98) 100%);
    padding: 16px 40px;
    display: flex;
    align-items: center;
    gap: 30px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    z-index: 100;
    backdrop-filter: blur(10px);
}

.logo {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #e50914 0%, #ff4d4d 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s;
}

.logo.focused {
    transform: scale(1.02);
    background: linear-gradient(135deg, #ff1a1a 0%, #ff6b6b 100%);
    -webkit-background-clip: text;
    background-clip: text;
}

.search-container {
    flex: 1;
    max-width: 400px;
}

.search-input {
    width: 100%;
    background: rgba(0,0,0,0.8);
    border: 2px solid #333;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s;
}

.search-input.focused {
    border-color: var(--primary);
    box-shadow: var(--focus-glow);
    background: #1a1a1a;
}

.random-btn {
    background: rgba(255,255,255,0.1);
    border: 2px solid #444;
    color: white;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
}

.random-btn.focused {
    background: var(--primary);
    border-color: var(--primary);
    color: black;
    transform: scale(1.02);
}

.stats {
    color: #777;
    font-size: 13px;
    margin-left: auto;
}

/* Main scroll area */
.main-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 40px;
    scroll-behavior: smooth;
}

/* Hero Section */
.hero {
    position: relative;
    height: 400px;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 40px;
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
    cursor: pointer;
}

.hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    filter: brightness(0.7);
    transition: transform 0.3s ease;
}

.hero.focused .hero-bg {
    transform: scale(1.02);
}

.hero-content {
    position: relative;
    z-index: 10;
    padding: 60px;
    background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.hero-title {
    font-size: 52px;
    font-weight: 800;
    margin-bottom: 16px;
    letter-spacing: -1px;
}

.hero-badge {
    display: inline-block;
    background: var(--primary);
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
    margin-right: 12px;
}

.hero-match {
    color: #46d369;
    font-weight: bold;
}

.hero-desc {
    max-width: 500px;
    font-size: 15px;
    line-height: 1.5;
    color: #ddd;
    margin: 20px 0;
}

.hero-buttons {
    display: flex;
    gap: 12px;
}

.btn-play, .btn-info {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-play {
    background: white;
    color: black;
}

.btn-play.focused, .btn-info.focused {
    transform: scale(1.05);
    box-shadow: var(--focus-glow);
}

.btn-info {
    background: rgba(109,109,110,0.7);
    color: white;
}

/* Section */
.section {
    margin-bottom: 40px;
}

.section-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    padding-left: 8px;
    border-left: 4px solid var(--primary);
}

/* Movie Grid */
.movies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
}

.movie-card {
    position: relative;
    aspect-ratio: 2 / 3;
    background: var(--dark3);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.movie-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.3s;
}

.movie-card img.loaded {
    opacity: 1;
}

.movie-card .movie-title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.95));
    padding: 40px 12px 12px;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.movie-card.focused {
    transform: scale(1.05);
    border-color: var(--primary);
    box-shadow: var(--focus-glow);
    z-index: 20;
}

.movie-card.focused .movie-title {
    opacity: 1;
}

/* Player */
.player {
    position: fixed;
    inset: 0;
    background: black;
    z-index: 1000;
    display: none;
    flex-direction: column;
}

.player.open {
    display: flex;
}

video {
    flex: 1;
    width: 100%;
    background: black;
}

.player-ui {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%);
    opacity: 1;
    transition: opacity 0.3s;
    pointer-events: none;
}

.player-ui.hide {
    opacity: 0;
}

.player-ui > * {
    pointer-events: auto;
}

.player-top {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.player-title {
    font-size: 18px;
    font-weight: bold;
}

.player-close {
    background: rgba(0,0,0,0.6);
    border: none;
    color: white;
    font-size: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
}

.player-close.focused {
    background: var(--primary);
    transform: scale(1.1);
}

.player-bottom {
    padding: 24px;
}

.progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.time {
    font-size: 13px;
    min-width: 50px;
}

.progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
}

.progress-fill {
    position: absolute;
    height: 100%;
    background: var(--primary);
    border-radius: 3px;
    width: 0%;
}

.progress-buffered {
    position: absolute;
    height: 100%;
    background: rgba(255,255,255,0.5);
    border-radius: 3px;
    width: 0%;
}

.player-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
}

.ctrl-btn {
    width: 56px;
    height: 56px;
    background: rgba(255,255,255,0.15);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
}

.ctrl-btn.main {
    width: 72px;
    height: 72px;
    font-size: 28px;
    background: var(--primary);
    color: black;
}

.ctrl-btn.focused {
    transform: scale(1.1);
    background: var(--primary);
    color: black;
    box-shadow: var(--focus-glow);
}

.player-status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: rgba(0,0,0,0.8);
    padding: 20px 40px;
    border-radius: 12px;
    display: none;
    z-index: 20;
}

.player-status.show {
    display: block;
}

.loader {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(229,9,20,0.3);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-message, .error-message {
    text-align: center;
    padding: 60px;
    color: var(--light2);
}

@media (max-width: 768px) {
    .header { padding: 12px 16px; gap: 12px; }
    .main-area { padding: 12px; }
    .hero { height: 300px; }
    .hero-content { padding: 30px; }
    .hero-title { font-size: 32px; }
    .movies-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
}
</style>
</head>
<body>
<div class="app">
    <div class="header">
        <div class="logo" tabindex="0" data-focus="logo">FILMAX</div>
        <div class="search-container">
            <input type="text" class="search-input" id="searchInput" placeholder="Buscar..." tabindex="0">
        </div>
        <button class="random-btn" id="randomBtn" tabindex="0">🎲 Aleatorio</button>
        <span class="stats" id="statsCount">0 películas</span>
    </div>

    <div class="main-area" id="mainArea">
        <div class="hero" id="heroSection" tabindex="0">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-content">
                <div class="hero-title" id="heroTitle">Bienvenido</div>
                <div><span class="hero-badge">HD</span><span class="hero-match" id="heroMatch">97% Match</span></div>
                <div class="hero-desc" id="heroDesc">Explora miles de películas y series con navegación optimizada para TV</div>
                <div class="hero-buttons">
                    <button class="btn-play" id="heroPlayBtn" tabindex="0">▶ Reproducir</button>
                    <button class="btn-info" id="heroInfoBtn" tabindex="0">ℹ️ Más info</button>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🔥 Popular Ahora</div>
            <div class="movies-grid" id="moviesGrid"></div>
        </div>
    </div>
</div>

<div class="player" id="player">
    <div class="player-ui" id="playerUi">
        <div class="player-top">
            <div class="player-title" id="playerTitle"></div>
            <button class="player-close" id="playerClose" tabindex="0">✕</button>
        </div>
        <div class="player-bottom">
            <div class="progress-container">
                <span class="time" id="currentTime">0:00</span>
                <div class="progress-bar" id="progressBar">
                    <div class="progress-buffered" id="bufferedBar"></div>
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <span class="time" id="durationTime">0:00</span>
            </div>
            <div class="player-controls">
                <button class="ctrl-btn" id="rewindBtn" tabindex="0">⏪</button>
                <button class="ctrl-btn main" id="playPauseBtn" tabindex="0">▶</button>
                <button class="ctrl-btn" id="forwardBtn" tabindex="0">⏩</button>
            </div>
        </div>
    </div>
    <div class="player-status" id="playerStatus">
        <div class="loader"></div>
        <div id="statusText">Cargando...</div>
    </div>
    <video id="videoPlayer" playsinline webkit-playsinline></video>
</div>

<script>
(function() {
    // DOM Elements
    const elements = {
        logo: document.querySelector('.logo'),
        searchInput: document.getElementById('searchInput'),
        randomBtn: document.getElementById('randomBtn'),
        mainArea: document.getElementById('mainArea'),
        heroSection: document.getElementById('heroSection'),
        heroPlayBtn: document.getElementById('heroPlayBtn'),
        heroInfoBtn: document.getElementById('heroInfoBtn'),
        moviesGrid: document.getElementById('moviesGrid'),
        statsCount: document.getElementById('statsCount'),
        player: document.getElementById('player'),
        videoPlayer: document.getElementById('videoPlayer'),
        playerUi: document.getElementById('playerUi'),
        playerTitle: document.getElementById('playerTitle'),
        playerClose: document.getElementById('playerClose'),
        playerStatus: document.getElementById('playerStatus'),
        statusText: document.getElementById('statusText'),
        currentTime: document.getElementById('currentTime'),
        durationTime: document.getElementById('durationTime'),
        progressFill: document.getElementById('progressFill'),
        bufferedBar: document.getElementById('bufferedBar'),
        progressBar: document.getElementById('progressBar'),
        rewindBtn: document.getElementById('rewindBtn'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        forwardBtn: document.getElementById('forwardBtn'),
        heroTitle: document.getElementById('heroTitle'),
        heroDesc: document.getElementById('heroDesc'),
        heroBg: document.getElementById('heroBg')
    };

    // State
    let allMovies = [];
    let currentMovies = [];
    let currentFocus = null;
    let focusableElements = [];
    let currentFocusIndex = 0;
    let isPlayerActive = false;
    let currentMovie = null;
    let hideUITimer = null;
    let isLoadingMore = false;
    let currentPage = 0;
    let hasMore = true;
    let searchQuery = '';
    let gridColumns = 5;

    // Helper: format time
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Fetch movies from API
    async function fetchMovies(page = 0, query = '', random = false) {
        try {
            let url = `/api/movies?page=${page}&limit=50`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            if (random) url += `&random=true`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching movies:', error);
            return { data: [], hasMore: false, total: 0 };
        }
    }

    // Load movies into grid
    async function loadMovies(reset = true, random = false) {
        if (reset) {
            currentPage = 0;
            allMovies = [];
            elements.moviesGrid.innerHTML = '<div class="loading-message"><div class="loader"></div>Cargando...</div>';
        }

        const result = await fetchMovies(currentPage, searchQuery, random);
        
        if (reset) {
            allMovies = result.data;
            currentMovies = result.data;
            renderMovies();
            elements.statsCount.textContent = `${result.total} películas`;
            if (allMovies.length > 0 && !random) {
                updateHero(allMovies[0]);
            }
        } else {
            allMovies = [...allMovies, ...result.data];
            currentMovies = allMovies;
            appendMovies(result.data);
        }
        
        hasMore = result.hasMore;
        
        if (random && allMovies.length > 0) {
            updateHero(allMovies[0]);
        }
    }

    // Render all movies
    function renderMovies() {
        elements.moviesGrid.innerHTML = '';
        allMovies.forEach((movie, index) => {
            const card = createMovieCard(movie, index);
            elements.moviesGrid.appendChild(card);
        });
        lazyLoadImages();
        updateFocusableElements();
        calculateGridColumns();
    }

    // Append more movies (infinite scroll)
    function appendMovies(movies) {
        movies.forEach((movie, idx) => {
            const card = createMovieCard(movie, allMovies.length - movies.length + idx);
            elements.moviesGrid.appendChild(card);
        });
        lazyLoadImages();
        updateFocusableElements();
    }

    // Create movie card DOM element
    function createMovieCard(movie, index) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-index', index);
        card.setAttribute('data-id', movie.id);
        card.setAttribute('tabindex', '0');
        
        const img = document.createElement('img');
        img.setAttribute('data-src', movie.poster || '');
        img.alt = escapeHtml(movie.title);
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'movie-title';
        titleDiv.textContent = movie.title;
        
        card.appendChild(img);
        card.appendChild(titleDiv);
        
        card.addEventListener('click', () => playMovie(movie));
        
        return card;
    }

    // Lazy load images
    function lazyLoadImages() {
        const images = document.querySelectorAll('.movie-card img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src && !img.classList.contains('loaded')) {
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = src;
                            img.classList.add('loaded');
                        };
                        tempImg.onerror = () => {
                            img.classList.add('loaded');
                        };
                        tempImg.src = src;
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });
        
        images.forEach(img => observer.observe(img));
    }

    // Update hero section
    function updateHero(movie) {
        elements.heroTitle.textContent = movie.title;
        if (movie.poster) {
            elements.heroBg.style.backgroundImage = `url(${escapeHtml(movie.poster)})`;
            elements.heroBg.style.backgroundSize = 'cover';
            elements.heroBg.style.backgroundPosition = 'center';
        }
        if (movie.description) {
            elements.heroDesc.textContent = movie.description.substring(0, 120);
        }
    }

    // Calculate grid columns for navigation
    function calculateGridColumns() {
        const firstRow = elements.moviesGrid.children[0];
        if (!firstRow) {
            gridColumns = 5;
            return;
        }
        const firstRect = firstRow.getBoundingClientRect();
        let cols = 1;
        for (let i = 1; i < elements.moviesGrid.children.length; i++) {
            const rect = elements.moviesGrid.children[i].getBoundingClientRect();
            if (Math.abs(rect.top - firstRect.top) < 20) {
                cols++;
            } else {
                break;
            }
        }
        gridColumns = Math.max(1, cols);
    }

    // Update focusable elements list
    function updateFocusableElements() {
        const cards = document.querySelectorAll('.movie-card');
        const headerElements = [elements.logo, elements.searchInput, elements.randomBtn];
        const heroElements = [elements.heroSection, elements.heroPlayBtn, elements.heroInfoBtn];
        
        focusableElements = [
            ...headerElements,
            ...heroElements,
            ...Array.from(cards)
        ];
        
        // Remove null/undefined
        focusableElements = focusableElements.filter(el => el !== null);
    }

    // Set focus to element
    function setFocus(element, index = null) {
        if (currentFocus) {
            currentFocus.classList.remove('focused');
        }
        
        currentFocus = element;
        if (index !== null) currentFocusIndex = index;
        
        if (currentFocus) {
            currentFocus.classList.add('focused');
            currentFocus.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            
            // Special handling for input
            if (currentFocus === elements.searchInput) {
                elements.searchInput.focus();
            } else {
                elements.searchInput.blur();
            }
        }
    }

    // Navigate in grid
    function navigateGrid(direction, currentIdx) {
        const cards = document.querySelectorAll('.movie-card');
        if (cards.length === 0) return false;
        
        let newIndex = currentIdx;
        
        switch(direction) {
            case 'ArrowUp':
                if (currentIdx - gridColumns < 0) {
                    setFocus(elements.heroSection, 2);
                    return true;
                }
                newIndex = Math.max(0, currentIdx - gridColumns);
                break;
            case 'ArrowDown':
                newIndex = Math.min(cards.length - 1, currentIdx + gridColumns);
                break;
            case 'ArrowLeft':
                if (currentIdx % gridColumns === 0) {
                    setFocus(elements.heroInfoBtn, 4);
                    return true;
                }
                newIndex = Math.max(0, currentIdx - 1);
                break;
            case 'ArrowRight':
                if ((currentIdx + 1) % gridColumns === 0 || currentIdx === cards.length - 1) {
                    return false;
                }
                newIndex = Math.min(cards.length - 1, currentIdx + 1);
                break;
        }
        
        if (newIndex !== currentIdx) {
            setFocus(cards[newIndex], newIndex);
            return true;
        }
        return false;
    }

    // Navigate in hero section
    function navigateHero(direction, currentIdx) {
        const heroFocusOrder = [elements.heroSection, elements.heroPlayBtn, elements.heroInfoBtn];
        let newIdx = currentIdx;
        
        switch(direction) {
            case 'ArrowRight':
                newIdx = Math.min(heroFocusOrder.length - 1, currentIdx + 1);
                break;
            case 'ArrowLeft':
                newIdx = Math.max(0, currentIdx - 1);
                break;
            case 'ArrowDown':
                const cards = document.querySelectorAll('.movie-card');
                if (cards.length > 0) {
                    setFocus(cards[0], 5);
                    return true;
                }
                break;
            case 'ArrowUp':
                setFocus(elements.randomBtn, 2);
                return true;
        }
        
        if (newIdx !== currentIdx) {
            setFocus(heroFocusOrder[newIdx], newIdx);
        }
        return true;
    }

    // Navigate header
    function navigateHeader(direction, currentIdx) {
        const headerOrder = [elements.logo, elements.searchInput, elements.randomBtn];
        let newIdx = currentIdx;
        
        switch(direction) {
            case 'ArrowRight':
                newIdx = Math.min(headerOrder.length - 1, currentIdx + 1);
                break;
            case 'ArrowLeft':
                newIdx = Math.max(0, currentIdx - 1);
                break;
            case 'ArrowDown':
                setFocus(elements.heroSection, 2);
                return true;
        }
        
        if (newIdx !== currentIdx) {
            setFocus(headerOrder[newIdx], newIdx);
        }
        return true;
    }

    // Global keyboard navigation (TV Remote)
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        
        // Player controls
        if (isPlayerActive) {
            e.preventDefault();
            
            if (key === 'Escape' || key === 'Backspace') {
                closePlayer();
            } else if (key === 'ArrowLeft') {
                seek(-10);
                showPlayerUI();
            } else if (key === 'ArrowRight') {
                seek(10);
                showPlayerUI();
            } else if (key === 'ArrowUp') {
                adjustVolume(0.1);
                showPlayerUI();
            } else if (key === 'ArrowDown') {
                adjustVolume(-0.1);
                showPlayerUI();
            } else if (key === 'Enter' || key === ' ') {
                togglePlayPause();
                showPlayerUI();
            }
            return;
        }
        
        // Navigation keys for main UI
        const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Tab'];
        if (navKeys.includes(key)) {
            e.preventDefault();
        }
        
        // Escape to clear search
        if (key === 'Escape') {
            if (elements.searchInput.value) {
                elements.searchInput.value = '';
                searchQuery = '';
                loadMovies(true, false);
                setFocus(elements.searchInput, 1);
            }
            return;
        }
        
        // Tab navigation fallback
        if (key === 'Tab') {
            e.preventDefault();
            const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
            setFocus(focusableElements[nextIndex], nextIndex);
            return;
        }
        
        // Enter / Space to activate
        if (key === 'Enter' || key === ' ') {
            if (currentFocus === elements.logo) {
                location.reload();
            } else if (currentFocus === elements.randomBtn) {
                loadMovies(true, true);
            } else if (currentFocus === elements.heroPlayBtn || currentFocus === elements.heroSection) {
                if (allMovies.length > 0) playMovie(allMovies[0]);
            } else if (currentFocus && currentFocus.classList && currentFocus.classList.contains('movie-card')) {
                const index = parseInt(currentFocus.getAttribute('data-index'));
                if (!isNaN(index) && allMovies[index]) {
                    playMovie(allMovies[index]);
                }
            } else if (currentFocus === elements.searchInput) {
                // Search already handled by input
            }
            return;
        }
        
        // Directional navigation
        if (key.startsWith('Arrow')) {
            // Determine current focus type
            const headerIndices = [0, 1, 2];
            const heroIndices = [2, 3, 4];
            
            if (headerIndices.includes(currentFocusIndex)) {
                navigateHeader(key, currentFocusIndex);
            } else if (heroIndices.includes(currentFocusIndex)) {
                navigateHero(key, currentFocusIndex);
            } else {
                navigateGrid(key, currentFocusIndex);
            }
        }
    });

    // Search handler
    elements.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        loadMovies(true, false);
    });
    
    elements.searchInput.addEventListener('focus', () => {
        setFocus(elements.searchInput, 1);
    });

    // Random button
    elements.randomBtn.addEventListener('click', () => {
        loadMovies(true, true);
    });

    // Logo click
    elements.logo.addEventListener('click', () => {
        location.reload();
    });

    // Infinite scroll
    elements.mainArea.addEventListener('scroll', async () => {
        if (isLoadingMore || !hasMore || searchQuery) return;
        
        const scrollTop = elements.mainArea.scrollTop;
        const scrollHeight = elements.mainArea.scrollHeight;
        const clientHeight = elements.mainArea.clientHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 300) {
            isLoadingMore = true;
            currentPage++;
            const result = await fetchMovies(currentPage, '', false);
            if (result.data.length > 0) {
                allMovies = [...allMovies, ...result.data];
                currentMovies = allMovies;
                appendMovies(result.data);
                hasMore = result.hasMore;
            }
            isLoadingMore = false;
        }
    });

    // Window resize recalc
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            calculateGridColumns();
        }, 200);
    });

    // ============ PLAYER FUNCTIONS ============
    function playMovie(movie) {
        if (!movie || !movie.url) {
            console.error('No URL for movie:', movie);
            return;
        }
        
        currentMovie = movie;
        isPlayerActive = true;
        elements.player.classList.add('open');
        elements.playerTitle.textContent = movie.title;
        elements.playerStatus.classList.add('show');
        elements.statusText.textContent = 'Conectando...';
        
        // Setup video
        elements.videoPlayer.pause();
        elements.videoPlayer.src = '';
        
        setTimeout(() => {
            let videoUrl = movie.url;
            if (videoUrl.includes('http://') || videoUrl.includes('https://')) {
                videoUrl = `/video-proxy?url=${encodeURIComponent(videoUrl)}`;
            }
            
            elements.videoPlayer.src = videoUrl;
            elements.videoPlayer.load();
            
            elements.videoPlayer.play().catch((err) => {
                console.error('Play error:', err);
                elements.statusText.textContent = 'Error: ' + err.message;
            });
        }, 100);
        
        // Update player UI focus
        setTimeout(() => {
            const playerFocusables = [elements.playPauseBtn, elements.rewindBtn, elements.forwardBtn, elements.playerClose];
            setFocus(playerFocusables[0]);
        }, 500);
    }
    
    function closePlayer() {
        elements.videoPlayer.pause();
        elements.videoPlayer.src = '';
        elements.player.classList.remove('open');
        elements.playerStatus.classList.remove('show');
        isPlayerActive = false;
        
        // Restore focus to grid
        updateFocusableElements();
        const cards = document.querySelectorAll('.movie-card');
        if (cards.length > 0) {
            setFocus(cards[0], 5);
        } else {
            setFocus(elements.heroSection, 2);
        }
    }
    
    function togglePlayPause() {
        if (elements.videoPlayer.paused) {
            elements.videoPlayer.play();
            elements.playPauseBtn.textContent = '⏸';
        } else {
            elements.videoPlayer.pause();
            elements.playPauseBtn.textContent = '▶';
        }
        showPlayerUI();
    }
    
    function seek(seconds) {
        if (!elements.videoPlayer.duration || !isFinite(elements.videoPlayer.duration)) return;
        const newTime = Math.max(0, Math.min(elements.videoPlayer.currentTime + seconds, elements.videoPlayer.duration));
        elements.videoPlayer.currentTime = newTime;
    }
    
    function adjustVolume(delta) {
        const newVolume = Math.max(0, Math.min(1, elements.videoPlayer.volume + delta));
        elements.videoPlayer.volume = newVolume;
    }
    
    function showPlayerUI() {
        elements.playerUi.classList.remove('hide');
        clearTimeout(hideUITimer);
        if (!elements.videoPlayer.paused) {
            hideUITimer = setTimeout(() => {
                elements.playerUi.classList.add('hide');
            }, 3000);
        }
    }
    
    // Video event handlers
    elements.videoPlayer.addEventListener('canplay', () => {
        elements.playerStatus.classList.remove('show');
    });
    
    elements.videoPlayer.addEventListener('waiting', () => {
        elements.playerStatus.classList.add('show');
        elements.statusText.textContent = 'Buffering...';
    });
    
    elements.videoPlayer.addEventListener('playing', () => {
        elements.playerStatus.classList.remove('show');
        elements.playPauseBtn.textContent = '⏸';
    });
    
    elements.videoPlayer.addEventListener('pause', () => {
        elements.playPauseBtn.textContent = '▶';
    });
    
    elements.videoPlayer.addEventListener('timeupdate', () => {
        if (!elements.videoPlayer.duration || !isFinite(elements.videoPlayer.duration)) return;
        const percent = (elements.videoPlayer.currentTime / elements.videoPlayer.duration) * 100;
        elements.progressFill.style.width = `${percent}%`;
        elements.currentTime.textContent = formatTime(elements.videoPlayer.currentTime);
    });
    
    elements.videoPlayer.addEventListener('durationchange', () => {
        if (isFinite(elements.videoPlayer.duration)) {
            elements.durationTime.textContent = formatTime(elements.videoPlayer.duration);
        }
    });
    
    elements.videoPlayer.addEventListener('progress', () => {
        if (elements.videoPlayer.buffered && elements.videoPlayer.buffered.length > 0) {
            const bufferedEnd = elements.videoPlayer.buffered.end(elements.videoPlayer.buffered.length - 1);
            const percent = (bufferedEnd / elements.videoPlayer.duration) * 100;
            elements.bufferedBar.style.width = `${percent}%`;
        }
    });
    
    elements.videoPlayer.addEventListener('error', () => {
        const error = elements.videoPlayer.error;
        let msg = 'Error desconocido';
        if (error) {
            const codes = ['', 'Abortado', 'Error de red', 'Error de decodificación', 'Formato no soportado'];
            msg = codes[error.code] || 'Error de reproducción';
        }
        elements.statusText.textContent = msg;
        elements.playerStatus.classList.add('show');
    });
    
    // Player button handlers
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.rewindBtn.addEventListener('click', () => seek(-10));
    elements.forwardBtn.addEventListener('click', () => seek(10));
    elements.playerClose.addEventListener('click', closePlayer);
    
    elements.progressBar.addEventListener('click', (e) => {
        if (!elements.videoPlayer.duration) return;
        const rect = elements.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        elements.videoPlayer.currentTime = percent * elements.videoPlayer.duration;
        showPlayerUI();
    });
    
    // Mouse move to show UI
    elements.player.addEventListener('mousemove', showPlayerUI);
    elements.player.addEventListener('click', (e) => {
        if (e.target === elements.videoPlayer) {
            togglePlayPause();
            showPlayerUI();
        }
    });
    
    // Initialize
    async function init() {
        await loadMovies(true, false);
        updateFocusableElements();
        setFocus(elements.logo, 0);
        calculateGridColumns();
        
        // Add focus event listeners to all focusable elements
        focusableElements.forEach((el, idx) => {
            if (el && el.addEventListener) {
                el.addEventListener('focus', () => setFocus(el, idx));
            }
        });
    }
    
    init();
})();
</script>
</body>
</html>`));

app.listen(PORT, '0.0.0.0', () => console.log('🎬 FILMAX TV → Puerto ' + PORT + ' | ' + MOVIES.length + ' películas listas para TV'));
