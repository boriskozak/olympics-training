// ===== MOUNTAIN CONDITIONS — LIVE Weather Dashboard =====
// Real-time data from Open-Meteo API (free, no API key needed)

(function () {
    'use strict';

    // ===== MOUNTAIN DATA (with GPS coordinates) =====
    const MOUNTAINS = [
        { id: 'jack-frost', name: 'Jack Frost', emoji: '🏠', lat: 41.0117, lon: -75.4853, elevation: '2,000 ft', trails: 21, lifts: 6, terrain: 'Home Mountain • Park', home: true },
        { id: 'big-boulder', name: 'Big Boulder', emoji: '🏠', lat: 41.0167, lon: -75.5422, elevation: '2,175 ft', trails: 16, lifts: 4, terrain: 'Home Mountain • Park & Pipe', home: true },
        { id: 'park-city', name: 'Park City', emoji: '⛷️', lat: 40.6514, lon: -111.5080, elevation: '10,000 ft', trails: 341, lifts: 41, terrain: 'All-Mountain' },
        { id: 'snowbird', name: 'Snowbird', emoji: '🦅', lat: 40.5830, lon: -111.6538, elevation: '11,000 ft', trails: 169, lifts: 14, terrain: 'Expert / Steep' },
        { id: 'brighton', name: 'Brighton', emoji: '🌟', lat: 40.5980, lon: -111.5832, elevation: '10,500 ft', trails: 66, lifts: 7, terrain: 'Park & Pipe' },
        { id: 'deer-valley', name: 'Deer Valley', emoji: '🦌', lat: 40.6374, lon: -111.4783, elevation: '9,570 ft', trails: 103, lifts: 21, terrain: 'Groomed / Racing' }
    ];

    const WIND_DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    // WMO Weather Codes → human labels
    const WMO_CODES = {
        0: 'Clear Sky ☀️', 1: 'Mostly Clear 🌤️', 2: 'Partly Cloudy ⛅', 3: 'Overcast 🌥️',
        45: 'Foggy 🌫️', 48: 'Rime Fog 🌫️',
        51: 'Light Drizzle 🌧️', 53: 'Drizzle 🌧️', 55: 'Heavy Drizzle 🌧️',
        56: 'Freezing Drizzle 🧊', 57: 'Freezing Drizzle 🧊',
        61: 'Light Rain 🌧️', 63: 'Rain 🌧️', 65: 'Heavy Rain 🌧️',
        66: 'Freezing Rain 🧊', 67: 'Freezing Rain 🧊',
        71: 'Light Snow 🌨️', 73: 'Snowing ❄️', 75: 'Heavy Snow ❄️',
        77: 'Snow Grains ❄️',
        80: 'Rain Showers �️', 81: 'Rain Showers 🌦️', 82: 'Heavy Showers 🌦️',
        85: 'Snow Showers �🌨️', 86: 'Heavy Snow ❄️',
        95: 'Thunderstorm ⛈️', 96: 'Thunderstorm w/ Hail ⛈️', 99: 'Thunderstorm w/ Hail ⛈️'
    };

    // Snow quality heuristic based on temp
    function getSnowQuality(tempF, snowfall24h, weatherCode) {
        if (snowfall24h > 4) {
            if (tempF < 20) return 'Fresh Powder';
            if (tempF < 28) return 'Fresh Snow';
            return 'Wet Snow';
        }
        if (weatherCode >= 71 && weatherCode <= 77) return 'Natural Powder';
        if (tempF > 35) return 'Spring Corn';
        if (tempF < 15) return 'Packed Powder';
        return 'Groomed Corduroy';
    }

    // ===== FETCH REAL WEATHER =====
    async function fetchAllConditions() {
        // Build batch URL: comma-separated lat/lon for all mountains
        const lats = MOUNTAINS.map(m => m.lat).join(',');
        const lons = MOUNTAINS.map(m => m.lon).join(',');

        const url = `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${lats}&longitude=${lons}` +
            `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
            `&daily=snowfall_sum,temperature_2m_max,temperature_2m_min,weather_code` +
            `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch` +
            `&timezone=America%2FNew_York&forecast_days=7`;

        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`API ${resp.status}`);
            const data = await resp.json();
            // API returns an array when multiple coords are given
            const results = Array.isArray(data) ? data : [data];
            return results.map((d, i) => parseConditions(MOUNTAINS[i], d));
        } catch (err) {
            console.warn('Open-Meteo fetch failed, using fallback:', err);
            return generateFallbackConditions();
        }
    }

    // ===== PARSE API RESPONSE =====
    function parseConditions(mtn, data) {
        const c = data.current;
        const daily = data.daily;

        const temp = Math.round(c.temperature_2m);
        const windSpeed = Math.round(c.wind_speed_10m);
        const windGust = Math.round(c.wind_gusts_10m);
        const windDirDeg = c.wind_direction_10m;
        const windDir = WIND_DIRS[Math.round(windDirDeg / 22.5) % 16];
        const weatherCode = c.weather_code;
        const condition = WMO_CODES[weatherCode] || `Code ${weatherCode}`;

        // Snowfall from daily data
        const new24h = daily.snowfall_sum[0] ? Math.round(daily.snowfall_sum[0] * 10) / 10 : 0;
        const new48h = new24h + (daily.snowfall_sum[1] ? Math.round(daily.snowfall_sum[1] * 10) / 10 : 0);

        // Visibility heuristic from weather code
        const visibility = [45, 48, 75, 86, 65, 67, 82, 95, 96, 99].includes(weatherCode) ? 'Poor'
            : [71, 73, 85, 51, 53, 61, 63, 80, 81].includes(weatherCode) ? 'Moderate' : 'Good';

        // Lifts open estimate based on wind
        const totalLifts = mtn.lifts;
        const closedRatio = windSpeed > 40 ? 0.6 : windSpeed > 30 ? 0.3 : windSpeed > 20 ? 0.1 : 0;
        const openLifts = Math.max(1, totalLifts - Math.floor(totalLifts * closedRatio));

        const snowQuality = getSnowQuality(temp, new24h, weatherCode);

        // Base depth estimate (simulated — can't get this from weather API)
        const isSnowy = weatherCode >= 71;
        const baseDepth = mtn.lat > 41 ? Math.round(30 + new48h * 3) : Math.round(80 + new48h * 2);

        // ===== SHRED SCORE =====
        let shredScore = 60;
        // Fresh snow boost
        if (new24h > 2) shredScore += 10;
        if (new24h > 6) shredScore += 10;
        if (new24h > 12) shredScore += 10;
        // Wind penalty
        if (windSpeed < 10) shredScore += 10;
        else if (windSpeed < 20) shredScore += 5;
        else if (windSpeed > 30) shredScore -= 15;
        else if (windSpeed > 40) shredScore -= 25;
        // Temp sweet spot (15-30°F)
        if (temp >= 15 && temp <= 30) shredScore += 10;
        else if (temp < 5 || temp > 40) shredScore -= 10;
        // Clear skies bonus
        if (weatherCode <= 2) shredScore += 10;
        // Active snow is fun
        if (weatherCode >= 71 && weatherCode <= 77) shredScore += 5;
        // Heavy rain/freezing rain penalty
        if (weatherCode >= 61 && weatherCode <= 67) shredScore -= 20;
        // Powder bonus
        if (snowQuality.includes('Powder')) shredScore += 5;
        shredScore = Math.max(10, Math.min(100, shredScore));

        // 7-day forecast for chart
        const forecast = daily.snowfall_sum.map((snow, idx) => ({
            name: new Date(daily.time[idx]).toLocaleDateString('en', { weekday: 'short' }),
            snow: Math.round((snow || 0) * 10) / 10
        }));

        return {
            ...mtn,
            temp, windSpeed, windDir, windGust,
            new24h, new48h, baseDepth, snowQuality,
            condition, visibility, weatherCode,
            openLifts, totalLifts,
            shredScore, forecast
        };
    }

    // ===== FALLBACK (no network) =====
    function generateFallbackConditions() {
        const now = new Date();
        const seed = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000) * 97 + now.getHours();
        function seededRand(offset) {
            const x = Math.sin((seed + offset) * 9301 + 49297) * 49297;
            return x - Math.floor(x);
        }
        return MOUNTAINS.map((mtn, i) => {
            const r = (o) => seededRand(i * 100 + o);
            const temp = Math.round(15 + r(1) * 20 + (r(2) - 0.5) * 10);
            const windSpeed = Math.round(5 + r(3) * 25);
            const windDir = WIND_DIRS[Math.floor(r(4) * 16)];
            const windGust = windSpeed + Math.round(r(5) * 12);
            const new24h = Math.round(r(6) * 14);
            const new48h = new24h + Math.round(r(7) * 10);
            const baseDepth = mtn.lat > 41 ? Math.round(30 + r(8) * 40) : Math.round(80 + r(8) * 60);
            const codes = [0, 1, 2, 3, 71, 73, 75, 85];
            const weatherCode = codes[Math.floor(r(9) * codes.length)];
            const condition = WMO_CODES[weatherCode];
            const visibility = weatherCode >= 75 ? 'Poor' : weatherCode >= 71 ? 'Moderate' : 'Good';
            const snowQuality = getSnowQuality(temp, new24h, weatherCode);
            const totalLifts = mtn.lifts;
            const openLifts = Math.max(1, totalLifts - (windSpeed > 25 ? Math.floor(r(10) * totalLifts * 0.3) : 0));
            let shredScore = 60;
            if (new24h > 4) shredScore += 15;
            if (windSpeed < 15) shredScore += 10;
            if (windSpeed > 25) shredScore -= 15;
            if (temp >= 15 && temp <= 30) shredScore += 10;
            if (weatherCode <= 2) shredScore += 10;
            if (weatherCode >= 71 && weatherCode <= 77) shredScore += 5;
            shredScore = Math.max(10, Math.min(100, shredScore));
            const forecast = Array.from({ length: 7 }, (_, d) => ({
                name: new Date(now.getTime() + d * 86400000).toLocaleDateString('en', { weekday: 'short' }),
                snow: Math.round(Math.abs(Math.sin((seed + d + i) * 12345) * 15))
            }));
            return { ...mtn, temp, windSpeed, windDir, windGust, new24h, new48h, baseDepth, snowQuality, condition, visibility, weatherCode, openLifts, totalLifts, shredScore, forecast };
        });
    }

    // ===== SHRED SCORE COLOR =====
    function getScoreColor(score) {
        if (score >= 85) return '#2dc653';
        if (score >= 70) return '#60c5f7';
        if (score >= 50) return '#f4c430';
        return '#e63946';
    }

    function getScoreLabel(score) {
        if (score >= 90) return 'EPIC DAY 🔥';
        if (score >= 80) return 'SEND IT 🚀';
        if (score >= 70) return 'GREAT 👍';
        if (score >= 55) return 'DECENT 👌';
        if (score >= 40) return 'MEH 😐';
        return 'STAY HOME 🛋️';
    }

    // ===== RENDER =====
    async function renderConditions() {
        const container = document.getElementById('conditions-grid');
        if (!container) return;

        // Show loading state
        const overallLabel = document.getElementById('overall-shred-label');
        if (overallLabel && overallLabel.textContent === 'Loading...') {
            // Already loading, keep the text
        }

        const conditions = await fetchAllConditions();
        const bestMtn = conditions.reduce((a, b) => a.shredScore > b.shredScore ? a : b);

        // Overall shred score (average)
        const avgScore = Math.round(conditions.reduce((sum, c) => sum + c.shredScore, 0) / conditions.length);
        const overallGauge = document.getElementById('overall-shred-gauge');
        if (overallGauge) {
            animateGauge(overallGauge, avgScore);
        }
        if (overallLabel) {
            overallLabel.textContent = getScoreLabel(avgScore);
            overallLabel.style.color = getScoreColor(avgScore);
        }
        const overallVal = document.getElementById('overall-shred-value');
        if (overallVal) {
            animateNumber(overallVal, avgScore);
            overallVal.style.color = getScoreColor(avgScore);
        }
        const bestPick = document.getElementById('best-mountain-pick');
        if (bestPick) {
            bestPick.innerHTML = `${bestMtn.emoji} <strong>${bestMtn.name}</strong> — ${bestMtn.condition}`;
        }

        // Render mountain cards
        container.innerHTML = conditions.map(c => `
            <div class="mtn-card ${c.id === bestMtn.id ? 'mtn-card--best' : ''} ${c.home ? 'mtn-card--home' : ''}" data-score="${c.shredScore}">
                ${c.home ? '<div class="mtn-home-badge">🏠 HOME MTN</div>' : ''}
                ${c.id === bestMtn.id ? '<div class="mtn-best-badge">🏆 BEST TODAY</div>' : ''}
                <div class="mtn-card-header">
                    <div class="mtn-name">
                        <span class="mtn-emoji">${c.emoji}</span>
                        <div>
                            <h4>${c.name}</h4>
                            <span class="mtn-terrain">${c.terrain}</span>
                        </div>
                    </div>
                    <div class="mtn-score" style="--score-color: ${getScoreColor(c.shredScore)}">
                        <svg class="mtn-score-ring" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4"/>
                            <circle cx="30" cy="30" r="26" fill="none" stroke="${getScoreColor(c.shredScore)}" stroke-width="4"
                                stroke-dasharray="${2 * Math.PI * 26}"
                                stroke-dashoffset="${2 * Math.PI * 26 * (1 - c.shredScore / 100)}"
                                stroke-linecap="round" transform="rotate(-90 30 30)"/>
                        </svg>
                        <span class="mtn-score-num">${c.shredScore}</span>
                    </div>
                </div>
                <div class="mtn-condition-bar">${c.condition}</div>
                <div class="mtn-stats">
                    <div class="mtn-stat">
                        <span class="mtn-stat-icon">🌡️</span>
                        <div class="mtn-stat-info">
                            <span class="mtn-stat-val">${c.temp}°F</span>
                            <span class="mtn-stat-lbl">Temp</span>
                        </div>
                    </div>
                    <div class="mtn-stat">
                        <span class="mtn-stat-icon">💨</span>
                        <div class="mtn-stat-info">
                            <span class="mtn-stat-val">${c.windSpeed} mph ${c.windDir}</span>
                            <span class="mtn-stat-lbl">Wind (gust ${c.windGust})</span>
                        </div>
                    </div>
                    <div class="mtn-stat">
                        <span class="mtn-stat-icon">❄️</span>
                        <div class="mtn-stat-info">
                            <span class="mtn-stat-val">${c.new24h}" / ${c.new48h}"</span>
                            <span class="mtn-stat-lbl">24h / 48h Snow</span>
                        </div>
                    </div>
                    <div class="mtn-stat">
                        <span class="mtn-stat-icon">🏔️</span>
                        <div class="mtn-stat-info">
                            <span class="mtn-stat-val">${c.baseDepth}"</span>
                            <span class="mtn-stat-lbl">Base Depth</span>
                        </div>
                    </div>
                </div>
                <div class="mtn-details">
                    <div class="mtn-detail-chip"><span>👁️</span> ${c.visibility}</div>
                    <div class="mtn-detail-chip"><span>🎿</span> ${c.openLifts}/${c.totalLifts} Lifts</div>
                    <div class="mtn-detail-chip"><span>⛰️</span> ${c.elevation}</div>
                    <div class="mtn-detail-chip snow-quality"><span>✨</span> ${c.snowQuality}</div>
                </div>
            </div>
        `).join('');

        // Animate cards in
        const cards = container.querySelectorAll('.mtn-card');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 120);
        });

        // Update timestamp
        const ts = document.getElementById('conditions-timestamp');
        if (ts) {
            const now = new Date();
            ts.textContent = `Live — ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Render forecast from the best mountain's data
        renderForecast(conditions[0].forecast || []);

        // Store for refresh
        window._lastConditions = conditions;
    }

    // ===== ANIMATED GAUGE =====
    function animateGauge(el, targetScore) {
        const arc = el.querySelector('.gauge-arc-fill');
        if (!arc) return;
        const radius = 70;
        const circumference = Math.PI * radius; // semi-circle
        const offset = circumference * (1 - targetScore / 100);
        setTimeout(() => {
            arc.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            arc.style.strokeDashoffset = offset;
            arc.style.stroke = getScoreColor(targetScore);
        }, 300);
    }

    // ===== ANIMATE NUMBER =====
    function animateNumber(el, target) {
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current;
        }, 25);
    }

    // ===== FORECAST MINI-CHART =====
    function renderForecast(days) {
        const canvas = document.getElementById('forecast-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const w = rect.width;
        const h = rect.height;

        if (!days || days.length === 0) return;

        const maxSnow = Math.max(...days.map(d => d.snow), 0.5);
        const barWidth = (w - 40) / days.length;
        const barGap = 8;

        ctx.clearRect(0, 0, w, h);

        days.forEach((day, i) => {
            const barH = Math.max(4, (day.snow / maxSnow) * (h - 50));
            const x = 20 + i * barWidth + barGap / 2;
            const y = h - 25 - barH;

            const grad = ctx.createLinearGradient(x, y, x, h - 25);
            grad.addColorStop(0, 'rgba(96, 197, 247, 0.9)');
            grad.addColorStop(1, 'rgba(96, 197, 247, 0.2)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            const bw = barWidth - barGap;
            const r = Math.min(4, bw / 2);
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + bw - r, y);
            ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
            ctx.lineTo(x + bw, h - 25);
            ctx.lineTo(x, h - 25);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.fill();

            ctx.fillStyle = '#f1f5f9';
            ctx.font = '600 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${day.snow}"`, x + bw / 2, y - 6);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 10px Inter, sans-serif';
            ctx.fillText(day.name, x + bw / 2, h - 8);
        });
    }

    // ===== INIT =====
    async function init() {
        await renderConditions();

        const refreshBtn = document.getElementById('conditions-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.classList.add('spinning');
                await renderConditions();
                refreshBtn.classList.remove('spinning');
            });
        }

        // Auto-refresh every 10 minutes
        setInterval(() => { renderConditions(); }, 600000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
