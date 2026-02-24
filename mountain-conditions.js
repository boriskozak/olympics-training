// ===== MOUNTAIN CONDITIONS — Live Training Weather Dashboard =====
// Simulated real-time conditions for Salt Lake City area training mountains

(function () {
    'use strict';

    // ===== MOUNTAIN DATA =====
    const MOUNTAINS = [
        { id: 'jack-frost', name: 'Jack Frost', emoji: '🏠', elevation: '2,000 ft', trails: 21, lifts: 6, terrain: 'Home Mountain • Park', home: true },
        { id: 'big-boulder', name: 'Big Boulder', emoji: '🏠', elevation: '2,175 ft', trails: 16, lifts: 4, terrain: 'Home Mountain • Park & Pipe', home: true },
        { id: 'park-city', name: 'Park City', emoji: '⛷️', elevation: '10,000 ft', trails: 341, lifts: 41, terrain: 'All-Mountain' },
        { id: 'snowbird', name: 'Snowbird', emoji: '🦅', elevation: '11,000 ft', trails: 169, lifts: 14, terrain: 'Expert / Steep' },
        { id: 'brighton', name: 'Brighton', emoji: '🌟', elevation: '10,500 ft', trails: 66, lifts: 7, terrain: 'Park & Pipe' },
        { id: 'deer-valley', name: 'Deer Valley', emoji: '🦌', elevation: '9,570 ft', trails: 103, lifts: 21, terrain: 'Groomed / Racing' }
    ];

    const WEATHER_CONDITIONS = ['Bluebird ☀️', 'Partly Cloudy ⛅', 'Snowing 🌨️', 'Heavy Snow ❄️', 'Overcast 🌥️', 'Light Flurries 🌬️'];
    const SNOW_QUALITY = ['Packed Powder', 'Fresh Powder', 'Groomed Corduroy', 'Spring Corn', 'Machine Made', 'Natural Powder'];
    const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    // ===== GENERATE REALISTIC CONDITIONS =====
    function generateConditions() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const hour = now.getHours();
        const seed = dayOfYear * 97 + hour;

        // Deterministic pseudo-random per day/hour
        function seededRand(offset) {
            const x = Math.sin((seed + offset) * 9301 + 49297) * 49297;
            return x - Math.floor(x);
        }

        return MOUNTAINS.map((mtn, i) => {
            const r = (o) => seededRand(i * 100 + o);

            // Temperature: colder at higher elevations, colder at night
            const baseTemp = 15 + r(1) * 20; // 15-35 F
            const hourAdj = hour >= 10 && hour <= 15 ? 5 : -8;
            const temp = Math.round(baseTemp + hourAdj + (r(2) - 0.5) * 10);

            // Wind
            const windSpeed = Math.round(5 + r(3) * 30);
            const windDir = WIND_DIRS[Math.floor(r(4) * 8)];
            const windGust = windSpeed + Math.round(r(5) * 15);

            // Snow
            const new24h = Math.round(r(6) * 18);
            const new48h = new24h + Math.round(r(7) * 12);
            const baseDepth = Math.round(60 + r(8) * 80);
            const snowQuality = SNOW_QUALITY[Math.floor(r(9) * SNOW_QUALITY.length)];

            // Weather condition (biased toward good conditions)
            const condIdx = Math.floor(r(10) * WEATHER_CONDITIONS.length);
            const condition = WEATHER_CONDITIONS[condIdx];

            // Visibility
            const visibility = condition.includes('Heavy') ? 'Poor' : condition.includes('Snowing') ? 'Moderate' : 'Good';

            // Lifts operating
            const totalLifts = mtn.lifts;
            const closedLifts = windSpeed > 25 ? Math.floor(r(11) * totalLifts * 0.4) : Math.floor(r(11) * 2);
            const openLifts = totalLifts - closedLifts;

            // Shred Score (0-100)
            let shredScore = 70;
            if (new24h > 8) shredScore += 15;
            if (new24h > 12) shredScore += 10;
            if (windSpeed < 15) shredScore += 5;
            if (windSpeed > 25) shredScore -= 20;
            if (temp > 10 && temp < 30) shredScore += 5;
            if (temp < 0) shredScore -= 10;
            if (condition.includes('Bluebird')) shredScore += 10;
            if (condition.includes('Heavy')) shredScore -= 10;
            if (snowQuality.includes('Powder')) shredScore += 10;
            shredScore = Math.max(20, Math.min(100, shredScore + Math.round((r(12) - 0.5) * 10)));

            return {
                ...mtn,
                temp, windSpeed, windDir, windGust,
                new24h, new48h, baseDepth, snowQuality,
                condition, visibility,
                openLifts, totalLifts,
                shredScore
            };
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
    function renderConditions() {
        const container = document.getElementById('conditions-grid');
        if (!container) return;

        const conditions = generateConditions();
        const bestMtn = conditions.reduce((a, b) => a.shredScore > b.shredScore ? a : b);

        // Overall shred score (average)
        const avgScore = Math.round(conditions.reduce((sum, c) => sum + c.shredScore, 0) / conditions.length);
        const overallGauge = document.getElementById('overall-shred-gauge');
        if (overallGauge) {
            animateGauge(overallGauge, avgScore);
        }
        const overallLabel = document.getElementById('overall-shred-label');
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
            ts.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    }

    // ===== ANIMATED GAUGE =====
    function animateGauge(el, targetScore) {
        const arc = el.querySelector('.gauge-arc-fill');
        if (!arc) return;
        const radius = 70;
        const circumference = Math.PI * radius; // semi-circle
        const offset = circumference * (1 - targetScore / 100);
        // Animate with delay
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
    function renderForecast() {
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

        // Generate 7-day snowfall forecast
        const now = new Date();
        const days = [];
        const seed = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        for (let d = 0; d < 7; d++) {
            const r = Math.sin((seed + d) * 12345 + 67890) * 10000;
            const snow = Math.round(Math.abs(r % 20));
            const dayName = new Date(now.getTime() + d * 86400000).toLocaleDateString('en', { weekday: 'short' });
            days.push({ name: dayName, snow });
        }

        const maxSnow = Math.max(...days.map(d => d.snow), 1);
        const barWidth = (w - 40) / 7;
        const barGap = 8;

        // Background
        ctx.clearRect(0, 0, w, h);

        // Bars
        days.forEach((day, i) => {
            const barH = (day.snow / maxSnow) * (h - 50);
            const x = 20 + i * barWidth + barGap / 2;
            const y = h - 25 - barH;

            // Gradient bar
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

            // Snow amount label
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '600 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${day.snow}"`, x + bw / 2, y - 6);

            // Day label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 10px Inter, sans-serif';
            ctx.fillText(day.name, x + bw / 2, h - 8);
        });
    }

    // ===== INIT =====
    function init() {
        renderConditions();
        renderForecast();

        // Refresh button
        const refreshBtn = document.getElementById('conditions-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                setTimeout(() => {
                    renderConditions();
                    renderForecast();
                    refreshBtn.classList.remove('spinning');
                }, 600);
            });
        }

        // Auto-refresh every 5 minutes
        setInterval(() => {
            renderConditions();
            renderForecast();
        }, 300000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
