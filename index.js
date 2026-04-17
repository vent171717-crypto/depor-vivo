<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Netflix Style · La Casa de Papel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        :root {
            --netflix-red: #e50914;
            --netflix-black: #141414;
            --netflix-dark: #0a0a0a;
            --netflix-gray: #2f2f2f;
            --netflix-light: #b3b3b3;
            --gold: #f5c518;
            --transition: all 0.2s ease;
        }

        body {
            background-color: var(--netflix-black);
            font-family: 'Netflix Sans', 'Helvetica Neue', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            overflow: hidden;
            height: 100vh;
        }

        /* Layout principal */
        .app {
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Header estilo Netflix */
        .header {
            background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.98) 100%);
            padding: 12px 40px;
            display: flex;
            align-items: center;
            gap: 30px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            z-index: 100;
            backdrop-filter: blur(10px);
        }

        .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -1px;
            background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            cursor: pointer;
            transition: var(--transition);
            padding: 4px 8px;
            border-radius: 4px;
        }

        .logo.f {
            background: var(--gold);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 8px rgba(245,197,24,0.5);
        }

        .search-box {
            flex: 1;
            max-width: 350px;
        }

        .search-input {
            width: 100%;
            background: rgba(0,0,0,0.75);
            border: 1px solid #333;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            transition: var(--transition);
        }

        .search-input:focus, .search-input.f {
            border-color: var(--gold);
            outline: none;
            background: #1a1a1a;
        }

        .mix-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid #444;
            color: white;
            padding: 8px 20px;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            font-size: 14px;
        }

        .mix-btn.f, .mix-btn:hover {
            background: var(--gold);
            border-color: var(--gold);
            color: black;
        }

        .stats {
            color: #777;
            font-size: 13px;
            margin-left: auto;
        }

        /* Main scroll container */
        .main-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px 40px;
            scroll-behavior: smooth;
        }

        /* SECCIÓN HERO - INSPIRADA EN LA IMAGEN MONEY HEIST */
        .hero-section {
            margin-bottom: 40px;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%);
            border: 1px solid rgba(229,9,20,0.3);
        }

        .hero-banner {
            background: linear-gradient(90deg, #000000 0%, #8b0000 50%, #e50914 100%);
            padding: 40px 40px 30px;
            position: relative;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" opacity="0.1"><path fill="%23e50914" d="M0,0 L1200,0 L1200,300 L0,300 Z" /></svg>');
        }

        .series-badge {
            font-size: 14px;
            letter-spacing: 3px;
            color: var(--gold);
            font-weight: 600;
            margin-bottom: 10px;
        }

        .hero-title {
            font-size: 52px;
            font-weight: 800;
            letter-spacing: -1px;
            background: linear-gradient(135deg, #fff 30%, #ffd700 80%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 10px;
        }

        .hero-match {
            display: inline-block;
            background: var(--gold);
            color: black;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            margin-right: 12px;
        }

        .hero-year {
            color: #ccc;
            font-size: 14px;
        }

        .hero-parts {
            margin: 15px 0;
            color: #ddd;
        }

        .hero-description {
            max-width: 600px;
            font-size: 15px;
            line-height: 1.4;
            color: #ddd;
            margin: 20px 0;
        }

        .watch-now-btn {
            background: white;
            color: black;
            border: none;
            padding: 10px 30px;
            font-weight: bold;
            font-size: 18px;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.1s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .watch-now-btn:hover {
            transform: scale(1.02);
            background: #e6e6e6;
        }

        /* Popular section title */
        .section-title {
            font-size: 24px;
            font-weight: 600;
            margin: 30px 0 15px 0;
            border-left: 4px solid var(--gold);
            padding-left: 15px;
        }

        /* Grid estilo netflix rows */
        .movies-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
            margin-top: 10px;
        }

        /* Cards estilo netflix con hover */
        .movie-card {
            position: relative;
            aspect-ratio: 2 / 3;
            border-radius: 8px;
            overflow: hidden;
            background: #1a1a1a;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: 2px solid transparent;
        }

        .movie-card.f {
            border: 2px solid var(--gold);
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(245,197,24,0.4);
            z-index: 5;
        }

        .movie-card:hover {
            transform: scale(1.03);
        }

        .movie-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.25s ease-in;
        }

        .movie-card img.loaded {
            opacity: 1;
        }

        .movie-title {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.9));
            padding: 30px 8px 8px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.2s, transform 0.2s;
        }

        .movie-card.f .movie-title,
        .movie-card:hover .movie-title {
            opacity: 1;
            transform: translateY(0);
        }

        /* Loading / empty states */
        .loading-message, .error-message {
            text-align: center;
            padding: 60px;
            color: #aaa;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top-color: var(--gold);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Player overlay (Netflix style) */
        .player-overlay {
            position: fixed;
            inset: 0;
            background: black;
            z-index: 1000;
            display: none;
            flex-direction: column;
        }

        .player-overlay.open {
            display: flex;
        }

        video {
            flex: 1;
            width: 100%;
            background: black;
            outline: none;
        }

        .player-ui {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(0deg, #000000aa 0%, transparent 25%, transparent 70%, #000000aa 100%);
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
            padding: 20px;
            font-weight: bold;
            font-size: 16px;
        }

        .player-center-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            text-shadow: 0 0 10px black;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .player-bottom {
            padding: 20px;
        }

        .progress-section {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 15px;
        }

        .time {
            font-size: 13px;
            min-width: 45px;
        }

        .progress-bar {
            flex: 1;
            height: 4px;
            background: #555;
            border-radius: 2px;
            position: relative;
            cursor: pointer;
        }

        .progress-fill {
            position: absolute;
            height: 100%;
            background: var(--gold);
            border-radius: 2px;
            width: 0%;
        }

        .progress-buffered {
            position: absolute;
            height: 100%;
            background: #888;
            border-radius: 2px;
            width: 0%;
        }

        .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .ctrl-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }

        .ctrl-btn.main {
            width: 56px;
            height: 56px;
            font-size: 20px;
        }

        .ctrl-btn:hover {
            background: var(--gold);
            color: black;
        }

        .player-loading, .player-error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            display: none;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border-radius: 8px;
            z-index: 20;
        }

        .player-loading.show, .player-error.show {
            display: block;
        }

        @media (max-width: 768px) {
            .header {
                padding: 10px 16px;
                gap: 12px;
            }
            .main-container {
                padding: 12px;
            }
            .hero-title {
                font-size: 32px;
            }
            .hero-banner {
                padding: 20px;
            }
            .movies-grid {
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 8px;
            }
        }
    </style>
</head>
<body>
<div class="app">
    <div class="header">
        <div class="logo" id="logoBtn">NETFLIX</div>
        <div class="search-box">
            <input type="text" class="search-input" id="searchInput" placeholder="Títulos, personas, géneros">
        </div>
        <button class="mix-btn" id="mixBtn">🎲 Sorpresa</button>
        <span class="stats" id="statsCount">0 películas</span>
    </div>
    <div class="main-container" id="mainContainer">
        <!-- Hero dinámico: inspirado en la imagen -->
        <div class="hero-section" id="heroSection">
            <div class="hero-banner">
                <div class="series-badge">SERIES</div>
                <div class="hero-title">MONEY HEIST</div>
                <div><span class="hero-match">97% Match</span><span class="hero-year">2020 · 4 Parts</span></div>
                <div class="hero-parts">🔥 Temporada 4 ya disponible</div>
                <div class="hero-description">
                    Lives are on the line as the Professor's plan begins to unravel and the crew must fend off enemies from both inside and outside the Bank of Spain.
                </div>
                <button class="watch-now-btn" id="heroWatchBtn">▶ Watch Part 4 Now</button>
            </div>
        </div>

        <div class="section-title">Popular on Netflix</div>
        <div class="movies-grid" id="moviesGrid">
            <div class="loading-message">Cargando experiencias...</div>
        </div>
    </div>
</div>

<!-- Reproductor estilo Netflix -->
<div class="player-overlay" id="playerOverlay">
    <video id="videoPlayer" playsinline webkit-playsinline></video>
    <div class="player-loading" id="playerLoading"><div class="loading-spinner"></div><div id="loadingText">Cargando...</div></div>
    <div class="player-error" id="playerError">
        <div>⚠️ Error al reproducir</div>
        <button class="mix-btn" id="retryBtn" style="margin-top:12px">Reintentar</button>
        <button class="mix-btn" id="closeErrorBtn" style="margin-top:8px">Volver</button>
    </div>
    <div class="player-ui" id="playerUi">
        <div class="player-top"><span id="playerTitle"></span></div>
        <div class="player-center-indicator" id="centerIndicator"></div>
        <div class="player-bottom">
            <div class="progress-section">
                <span class="time" id="currentTime">0:00</span>
                <div class="progress-bar" id="progressBar">
                    <div class="progress-buffered" id="bufferedBar"></div>
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <span class="time" id="durationTime">0:00</span>
            </div>
            <div class="controls">
                <button class="ctrl-btn" id="rewindBtn">-10</button>
                <button class="ctrl-btn main" id="playPauseBtn">▶</button>
                <button class="ctrl-btn" id="forwardBtn">+10</button>
            </div>
        </div>
    </div>
</div>

<script>
    // ======================== BACKEND INTEGRATION ======================
    let MOVIES_DATA = [];
    let currentFocus = null;          // elemento con focus
    let focusType = 'header';          // 'header' or 'grid'
    let currentGridIndex = -1;
    let headerElements = [];
    let gridColumns = 5;
    let activeSearchTerm = '';
    let currentMoviesList = [];

    // Player state
    let playerActive = false;
    let currentMovieObj = null;
    let hideUITimer = null;
    let indicatorTimer = null;

    // DOM Elements
    const logoBtn = document.getElementById('logoBtn');
    const searchInput = document.getElementById('searchInput');
    const mixBtn = document.getElementById('mixBtn');
    const statsSpan = document.getElementById('statsCount');
    const moviesGrid = document.getElementById('moviesGrid');
    const mainContainer = document.getElementById('mainContainer');
    const heroWatchBtn = document.getElementById('heroWatchBtn');
    const playerOverlay = document.getElementById('playerOverlay');
    const videoPlayer = document.getElementById('videoPlayer');
    const playerLoading = document.getElementById('playerLoading');
    const playerError = document.getElementById('playerError');
    const playerUi = document.getElementById('playerUi');
    const playerTitleSpan = document.getElementById('playerTitle');
    const centerIndicator = document.getElementById('centerIndicator');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationTimeSpan = document.getElementById('durationTime');
    const progressFill = document.getElementById('progressFill');
    const bufferedBar = document.getElementById('bufferedBar');
    const progressBar = document.getElementById('progressBar');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const retryBtn = document.getElementById('retryBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    const loadingTextSpan = document.getElementById('loadingText');

    // Helper: fetch movies
    async function fetchMovies(query = '', random = false) {
        try {
            let url = '/api/movies?limit=200';
            if (query) url += `&q=${encodeURIComponent(query)}`;
            if (random) url += `&random=true`;
            const res = await fetch(url);
            const data = await res.json();
            return data.data || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    // Renderizar grid con cards
    function renderGrid(movies) {
        if (!movies.length) {
            moviesGrid.innerHTML = '<div class="loading-message">🎬 No se encontraron títulos</div>';
            statsSpan.innerText = `0 películas`;
            return;
        }
        statsSpan.innerText = `${movies.length} películas`;
        moviesGrid.innerHTML = '';
        movies.forEach((movie, idx) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.setAttribute('data-idx', idx);
            card.setAttribute('data-id', movie.id);
            const posterUrl = movie.poster || '';
            card.innerHTML = `
                <img data-src="${escapeHtml(posterUrl)}" alt="${escapeHtml(movie.title)}">
                <div class="movie-title">${escapeHtml(movie.title)}</div>
            `;
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                playMovie(movie);
            });
            moviesGrid.appendChild(card);
        });
        initLazyImages();
        recalcGridColumns();
        // Reset focus grid
        if (movies.length > 0 && focusType === 'grid' && currentGridIndex >= movies.length) {
            setFocusGrid(0);
        } else if (focusType === 'grid' && currentGridIndex >= 0) {
            setFocusGrid(currentGridIndex);
        } else if (movies.length > 0 && focusType !== 'grid') {
            // si no hay focus en grid, no forzar
        }
    }

    function escapeHtml(str) { return String(str || '').replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

    function initLazyImages() {
        const imgs = document.querySelectorAll('.movie-card img[data-src]');
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
                        tempImg.onerror = () => { img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 3"%3E%3Crect width="100%25" height="100%25" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" font-size="0.2"%3E🎬%3C/text%3E%3C/svg%3E'; img.classList.add('loaded'); };
                        tempImg.src = src;
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });
        imgs.forEach(img => observer.observe(img));
    }

    function recalcGridColumns() {
        const firstRow = moviesGrid.children[0];
        if (!firstRow) return;
        const firstRect = firstRow.getBoundingClientRect();
        let cols = 1;
        for (let i = 1; i < moviesGrid.children.length; i++) {
            const rect = moviesGrid.children[i].getBoundingClientRect();
            if (Math.abs(rect.top - firstRect.top) < 20) cols++;
            else break;
        }
        gridColumns = Math.max(1, cols);
    }

    // SISTEMA DE FOCUS Y NAVEGACIÓN (teclado estilo smart TV)
    function setFocusHeader(element, index) {
        if (currentFocus) currentFocus.classList.remove('f');
        focusType = 'header';
        currentGridIndex = -1;
        currentFocus = element;
        if (currentFocus) currentFocus.classList.add('f');
        if (element === searchInput) searchInput.focus();
        else searchInput.blur();
    }

    function setFocusGrid(index) {
        const cards = [...document.querySelectorAll('.movie-card')];
        if (!cards.length || index < 0 || index >= cards.length) return;
        if (currentFocus) currentFocus.classList.remove('f');
        focusType = 'grid';
        currentGridIndex = index;
        currentFocus = cards[index];
        currentFocus.classList.add('f');
        currentFocus.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        searchInput.blur();
    }

    function navigateGrid(direction) {
        const cards = [...document.querySelectorAll('.movie-card')];
        if (!cards.length) return false;
        let newIdx = currentGridIndex;
        if (direction === 'ArrowUp') {
            if (currentGridIndex - gridColumns < 0) {
                setFocusHeader(logoBtn, 0);
                return true;
            }
            newIdx = Math.max(0, currentGridIndex - gridColumns);
        } else if (direction === 'ArrowDown') {
            newIdx = Math.min(cards.length-1, currentGridIndex + gridColumns);
        } else if (direction === 'ArrowLeft') {
            if (currentGridIndex % gridColumns === 0) {
                setFocusHeader(searchInput, 1);
                return true;
            }
            newIdx = Math.max(0, currentGridIndex - 1);
        } else if (direction === 'ArrowRight') {
            if ((currentGridIndex+1) % gridColumns === 0 || currentGridIndex === cards.length-1) return false;
            newIdx = Math.min(cards.length-1, currentGridIndex + 1);
        }
        if (newIdx !== currentGridIndex) setFocusGrid(newIdx);
        return true;
    }

    function navigateHeader(direction) {
        const headers = [logoBtn, searchInput, mixBtn];
        let currentIdx = headers.indexOf(currentFocus);
        if (direction === 'ArrowRight') currentIdx = Math.min(headers.length-1, currentIdx+1);
        else if (direction === 'ArrowLeft') currentIdx = Math.max(0, currentIdx-1);
        else if (direction === 'ArrowDown') {
            const cards = [...document.querySelectorAll('.movie-card')];
            if (cards.length) setFocusGrid(0);
            return true;
        }
        setFocusHeader(headers[currentIdx], currentIdx);
        return true;
    }

    // Cargar contenido principal
    async function loadMoviesAndRender(query = '', random = false) {
        moviesGrid.innerHTML = '<div class="loading-message"><div class="loading-spinner"></div>Cargando...</div>';
        const movies = await fetchMovies(query, random);
        currentMoviesList = movies;
        renderGrid(movies);
        if (movies.length && focusType === 'header') {
            // mantener header
        } else if (movies.length && currentGridIndex === -1) {
            setFocusGrid(0);
        } else if (!movies.length) {
            setFocusHeader(searchInput, 1);
        }
    }

    // Reproductor
    function playMovie(movie) {
        if (!movie || !movie.url) return;
        currentMovieObj = movie;
        playerActive = true;
        playerOverlay.classList.add('open');
        playerTitleSpan.innerText = movie.title;
        videoPlayer.pause();
        videoPlayer.removeAttribute('src');
        videoPlayer.load();
        playerLoading.classList.add('show');
        playerError.classList.remove('show');
        loadingTextSpan.innerText = 'Conectando...';
        let videoUrl = movie.url;
        if (videoUrl.startsWith('http') && !videoUrl.includes(location.hostname)) {
            videoUrl = `/video-proxy?url=${encodeURIComponent(videoUrl)}`;
        }
        videoPlayer.src = videoUrl;
        videoPlayer.play().catch(e => { onPlayerError(e); });
        showPlayerUI();
    }

    function closePlayer() {
        playerOverlay.classList.remove('open');
        videoPlayer.pause();
        videoPlayer.src = '';
        playerActive = false;
        // restaurar focus
        setTimeout(() => {
            if (currentMoviesList.length && focusType === 'grid' && currentGridIndex >= 0 && currentGridIndex < currentMoviesList.length) {
                setFocusGrid(currentGridIndex);
            } else if (currentMoviesList.length) setFocusGrid(0);
            else setFocusHeader(logoBtn,0);
        }, 100);
    }

    function onPlayerError(err) {
        playerLoading.classList.remove('show');
        playerError.classList.add('show');
    }

    function retryPlay() {
        if (!currentMovieObj) return;
        playerError.classList.remove('show');
        playerLoading.classList.add('show');
        videoPlayer.load();
        videoPlayer.play().catch(onPlayerError);
    }

    videoPlayer.addEventListener('canplay', () => {
        playerLoading.classList.remove('show');
    });
    videoPlayer.addEventListener('waiting', () => {
        playerLoading.classList.add('show');
        loadingTextSpan.innerText = 'Buffering...';
    });
    videoPlayer.addEventListener('playing', () => {
        playerLoading.classList.remove('show');
        playPauseBtn.innerText = '⏸';
    });
    videoPlayer.addEventListener('pause', () => { playPauseBtn.innerText = '▶'; });
    videoPlayer.addEventListener('timeupdate', () => {
        if (!videoPlayer.duration) return;
        const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressFill.style.width = `${percent}%`;
        currentTimeSpan.innerText = formatTime(videoPlayer.currentTime);
    });
    videoPlayer.addEventListener('durationchange', () => {
        durationTimeSpan.innerText = formatTime(videoPlayer.duration);
    });
    videoPlayer.addEventListener('progress', () => {
        if (videoPlayer.buffered.length) {
            const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length-1);
            const bufPercent = (bufferedEnd / videoPlayer.duration) * 100;
            bufferedBar.style.width = `${bufPercent}%`;
        }
    });
    videoPlayer.onerror = () => { onPlayerError(); };

    function togglePlay() { if (videoPlayer.paused) videoPlayer.play(); else videoPlayer.pause(); showPlayerUI(); }
    function seek(seconds) { if (videoPlayer.duration) { videoPlayer.currentTime = Math.min(videoPlayer.duration, Math.max(0, videoPlayer.currentTime + seconds)); showIndicator((seconds>0?'+':'')+seconds+'s'); showPlayerUI(); } }
    function showIndicator(text) { centerIndicator.innerText = text; centerIndicator.style.opacity = '1'; clearTimeout(indicatorTimer); indicatorTimer = setTimeout(() => centerIndicator.style.opacity = '0', 600); }
    function showPlayerUI() { playerUi.classList.remove('hide'); clearTimeout(hideUITimer); if (!videoPlayer.paused) hideUITimer = setTimeout(() => playerUi.classList.add('hide'), 3000); }
    function formatTime(sec) { if (!sec || isNaN(sec)) return '0:00'; const hrs = Math.floor(sec/3600); const mins = Math.floor((sec%3600)/60); const secs = Math.floor(sec%60); return hrs ? `${hrs}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}` : `${mins}:${secs.toString().padStart(2,'0')}`; }

    // Event listeners teclado global
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (playerActive) {
            if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); closePlayer(); }
            else if (key === 'ArrowLeft') { e.preventDefault(); seek(-10); }
            else if (key === 'ArrowRight') { e.preventDefault(); seek(10); }
            else if (key === 'ArrowUp' || key === 'ArrowDown') { e.preventDefault(); if (videoPlayer.volume) videoPlayer.volume = Math.min(1,Math.max(0, videoPlayer.volume + (key==='ArrowUp'?0.1:-0.1))); showPlayerUI(); }
            else if (key === 'Enter' || key === ' ') { e.preventDefault(); togglePlay(); showPlayerUI(); }
            return;
        }
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace','Tab'].includes(key)) e.preventDefault();
        if (key === 'Escape') { if (searchInput.value) { searchInput.value = ''; loadMoviesAndRender(''); setFocusHeader(searchInput,1); } else if (focusType === 'grid') setFocusHeader(logoBtn,0); return; }
        if (key === 'Enter' || key === ' ') {
            if (focusType === 'header' && currentFocus === mixBtn) loadMoviesAndRender('', true);
            else if (focusType === 'header' && currentFocus === logoBtn) location.reload();
            else if (focusType === 'header' && currentFocus === searchInput) loadMoviesAndRender(searchInput.value, false);
            else if (focusType === 'grid' && currentFocus && currentMoviesList[currentGridIndex]) playMovie(currentMoviesList[currentGridIndex]);
            return;
        }
        if (key === 'Tab') { e.preventDefault(); const headers = [logoBtn, searchInput, mixBtn]; let idx = headers.indexOf(currentFocus); let next = (idx+1)%headers.length; setFocusHeader(headers[next], next); return; }
        if (key === 'Backspace') { if (focusType === 'grid') setFocusHeader(logoBtn,0); else if (searchInput.value.length) return; else setFocusHeader(logoBtn,0); return; }
        if (key.startsWith('Arrow')) {
            if (focusType === 'grid') navigateGrid(key);
            else if (focusType === 'header') navigateHeader(key);
        }
    });

    // Eventos UI
    logoBtn.addEventListener('click', () => location.reload());
    mixBtn.addEventListener('click', () => loadMoviesAndRender('', true));
    heroWatchBtn.addEventListener('click', () => {
        const moneyHeistMovie = currentMoviesList.find(m => m.title.toLowerCase().includes('money heist') || m.title.toLowerCase().includes('casa de papel'));
        if (moneyHeistMovie) playMovie(moneyHeistMovie);
        else if (currentMoviesList.length) playMovie(currentMoviesList[0]);
    });
    searchInput.addEventListener('input', (e) => { loadMoviesAndRender(e.target.value, false); });
    searchInput.addEventListener('focus', () => setFocusHeader(searchInput,1));
    logoBtn.addEventListener('focus', () => setFocusHeader(logoBtn,0));
    mixBtn.addEventListener('focus', () => setFocusHeader(mixBtn,2));
    playPauseBtn.addEventListener('click', togglePlay);
    rewindBtn.addEventListener('click', () => seek(-10));
    forwardBtn.addEventListener('click', () => seek(10));
    progressBar.addEventListener('click', (e) => { if(videoPlayer.duration){ const rect = progressBar.getBoundingClientRect(); const percent = (e.clientX-rect.left)/rect.width; videoPlayer.currentTime = percent * videoPlayer.duration; showPlayerUI(); } });
    retryBtn.addEventListener('click', retryPlay);
    closeErrorBtn.addEventListener('click', closePlayer);
    window.addEventListener('resize', () => recalcGridColumns());

    // Inicializar
    (async () => {
        await loadMoviesAndRender('', false);
        setFocusHeader(logoBtn, 0);
    })();
</script>
</body>
</html>
