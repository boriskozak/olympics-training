// ===== DATA =====
const PHASES = [
    {
        id: 1, name: "Foundation", years: "2026–2027", skills: [
            "Confident linked turns on green runs", "Speed control — skidded stops both directions",
            "Falling leaf — heel & toe edge (mastered)", "Basic carving on gentle slopes",
            "Switch stance introduction — straight glide", "Riding small rollers & natural features",
            "Comfortable on blue runs", "Intro to proper body position & edge angles"
        ]
    },
    {
        id: 2, name: "Intermediate", years: "2027–2028", skills: [
            "Dynamic carving on blue runs", "Carving on steeper terrain (black runs)",
            "Switch riding — linking turns", "Intro to park — straight airs off small jumps",
            "50-50 on boxes", "Intro to halfpipe — dropping in",
            "Butter tricks (nose/tail press)", "Riding moguls & variable terrain"
        ]
    },
    {
        id: 3, name: "Park Fundamentals", years: "2028–2029", skills: [
            "Frontside & backside 180s", "Frontside 360 off kickers",
            "Boardslide on rails", "Frontside & backside grabs (indy, mute, melon)",
            "Halfpipe — riding wall to wall", "Small kicker confidence (10-20ft tables)",
            "Switch 180s", "Snowboard cross — basic gate training"
        ]
    },
    {
        id: 4, name: "Advanced Freestyle", years: "2029–2030", skills: [
            "Frontside & backside 540s", "Rail combos (board-to-lip, 270 on/off)",
            "Halfpipe — airs above the lip", "Medium kickers (30-40ft)",
            "Cork 540 introduction", "Cab 360 & 540 (switch takeoff)",
            "First local/regional competition entry", "Giant slalom — basic gate training"
        ]
    },
    {
        id: 5, name: "Competition Ready", years: "2030–2031", skills: [
            "720s (frontside & backside)", "Big air — 50ft+ kickers",
            "Halfpipe — 12ft+ airs", "Cork 720 introduction",
            "Consistent podium finishes at regionals", "SBX — drafting & contact racing",
            "GS — consistent clean runs", "Video part / competition reel"
        ]
    },
    {
        id: 6, name: "National Circuit", years: "2031–2032", skills: [
            "900s & 1080s", "Double cork 1080 development",
            "Halfpipe — amplitude & consistency", "National-level competition results",
            "FIS points accumulation", "SBX — national ranking improvement",
            "Signature trick development", "Mental game & competition psychology"
        ]
    },
    {
        id: 7, name: "World Cup / Elite", years: "2032–2033", skills: [
            "Double cork mastery (various axes)", "Triple cork development",
            "FIS World Cup circuit entries", "Top-30 World Cup results",
            "Olympic qualification points pursuit", "X Games / Dew Tour invitations",
            "Sponsor relationships & equipment optimization", "High-performance coaching team"
        ]
    },
    {
        id: 8, name: "Olympic Prep", years: "2033–2034", skills: [
            "Peak trick difficulty & consistency", "Competition-specific run building",
            "Olympic Trials qualification", "Utah venue familiarization",
            "Peak physical conditioning", "Media & pressure management",
            "Olympic Team selection", "🥇 COMPETE AT 2034 WINTER OLYMPICS"
        ]
    }
];

const SKILL_TREE_NODES = [
    { id: "fl", label: "Falling Leaf", x: 350, y: 30, phase: 0 },
    { id: "lt", label: "Linked Turns", x: 350, y: 80, phase: 1, deps: ["fl"] },
    { id: "bc", label: "Basic Carve", x: 250, y: 130, phase: 1, deps: ["lt"] },
    { id: "sw", label: "Switch Riding", x: 450, y: 130, phase: 1, deps: ["lt"] },
    { id: "dc", label: "Dynamic Carving", x: 150, y: 190, phase: 2, deps: ["bc"] },
    { id: "park", label: "Park Intro", x: 350, y: 190, phase: 2, deps: ["bc", "sw"] },
    { id: "pipe", label: "Halfpipe Intro", x: 550, y: 190, phase: 2, deps: ["bc"] },
    { id: "180", label: "180s", x: 250, y: 260, phase: 3, deps: ["park"] },
    { id: "360", label: "360s", x: 350, y: 260, phase: 3, deps: ["park"] },
    { id: "rails", label: "Rail Slides", x: 450, y: 260, phase: 3, deps: ["park"] },
    { id: "pw", label: "Pipe Walls", x: 580, y: 260, phase: 3, deps: ["pipe"] },
    { id: "gs", label: "GS Gates", x: 80, y: 260, phase: 3, deps: ["dc"] },
    { id: "sbx", label: "SBX Racing", x: 150, y: 320, phase: 4, deps: ["dc", "gs"] },
    { id: "540", label: "540s", x: 300, y: 330, phase: 4, deps: ["360", "180"] },
    { id: "rc", label: "Rail Combos", x: 450, y: 330, phase: 4, deps: ["rails"] },
    { id: "pa", label: "Pipe Airs", x: 580, y: 330, phase: 4, deps: ["pw"] },
    { id: "720", label: "720s", x: 300, y: 400, phase: 5, deps: ["540"] },
    { id: "ba", label: "Big Air", x: 400, y: 400, phase: 5, deps: ["540"] },
    { id: "ck7", label: "Cork 720", x: 500, y: 400, phase: 5, deps: ["540", "pa"] },
    { id: "1080", label: "1080s", x: 250, y: 470, phase: 6, deps: ["720"] },
    { id: "dc10", label: "Dbl Cork 1080", x: 400, y: 470, phase: 6, deps: ["ck7", "ba"] },
    { id: "natl", label: "National Comps", x: 550, y: 470, phase: 6, deps: ["ck7"] },
    { id: "tc", label: "Triple Cork", x: 350, y: 540, phase: 7, deps: ["dc10"] },
    { id: "wc", label: "World Cup", x: 500, y: 540, phase: 7, deps: ["natl", "dc10"] },
    { id: "oly", label: "🥇 OLYMPICS", x: 400, y: 610, phase: 8, deps: ["tc", "wc"] }
];

// ===== STATE =====
let state = loadState();
function defaultState() {
    return {
        cleo: { disciplines: [], skills: {}, sessions: [] },
        lila: { disciplines: [], skills: {}, sessions: [] }
    };
}
function loadState() {
    try {
        const s = JSON.parse(localStorage.getItem('peaks-podium'));
        if (s && s.cleo && s.lila) return s;
    } catch (e) { }
    return defaultState();
}
function saveState() { localStorage.setItem('peaks-podium', JSON.stringify(state)); }
window.PHASES = PHASES;

// ===== COUNTDOWN =====
function updateCountdown() {
    const target = new Date('2034-02-10T00:00:00-07:00');
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent = d;
    document.getElementById('cd-hours').textContent = h;
    document.getElementById('cd-mins').textContent = m;
    document.getElementById('cd-secs').textContent = s;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ===== SNOW PARTICLES =====
function initSnow() {
    const canvas = document.getElementById('snow-canvas');
    const ctx = canvas.getContext('2d');
    let W, H;
    const flakes = [];
    const MAX = 80;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < MAX; i++) {
        flakes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 3 + 1, d: Math.random() * MAX, s: Math.random() * 0.8 + 0.3 });
    }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        for (const f of flakes) { ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); }
        ctx.fill();
        for (const f of flakes) {
            f.y += f.s; f.x += Math.sin(f.d) * 0.5; f.d += 0.01;
            if (f.y > H) { f.y = -5; f.x = Math.random() * W; }
        }
        requestAnimationFrame(draw);
    }
    draw();
}
initSnow();

// ===== DISCIPLINES =====
document.querySelectorAll('.discipline-chips').forEach(container => {
    const rider = container.id.split('-')[0];
    container.querySelectorAll('.chip').forEach(chip => {
        const disc = chip.dataset.disc;
        if (state[rider].disciplines.includes(disc)) chip.classList.add('active');
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            const arr = state[rider].disciplines;
            const idx = arr.indexOf(disc);
            idx >= 0 ? arr.splice(idx, 1) : arr.push(disc);
            saveState();
        });
    });
});

// ===== TIMELINE / PHASES =====
let activeTimelineRider = 'cleo';
function buildTimeline() {
    const container = document.getElementById('timeline-container');
    // Remember which phases are open before rebuild
    const openPhases = new Set();
    container.querySelectorAll('.phase-card.open').forEach(c => {
        const num = c.dataset.phase;
        if (num) openPhases.add(num);
    });
    container.innerHTML = '';
    PHASES.forEach(phase => {
        const card = document.createElement('div');
        card.className = 'phase-card';
        card.dataset.phase = phase.id;
        if (openPhases.has(String(phase.id))) card.classList.add('open');
        const completedCount = phase.skills.filter((_, i) => {
            const key = `p${phase.id}_s${i}`;
            return state[activeTimelineRider].skills[key];
        }).length;
        const total = phase.skills.length;
        const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        if (pct === 100) card.classList.add('completed');

        card.innerHTML = `
            <div class="phase-header">
                <div>
                    <h3><span class="phase-num">Phase ${phase.id}</span>${phase.name}</h3>
                    <span class="phase-years">${phase.years} · ${completedCount}/${total} skills</span>
                </div>
                <span class="phase-toggle">▼</span>
            </div>
            <div class="phase-progress"><div class="phase-progress-fill" style="width:${pct}%"></div></div>
            <div class="phase-body">
                <div class="skill-rider-toggles">
                    <button class="skill-rider-btn ${activeTimelineRider === 'cleo' ? 'active' : ''}" data-rider="cleo">Cleo</button>
                    <button class="skill-rider-btn ${activeTimelineRider === 'lila' ? 'active' : ''}" data-rider="lila">Lila</button>
                </div>
                <div class="phase-skills">
                    ${phase.skills.map((sk, i) => {
            const key = `p${phase.id}_s${i}`;
            const checked = state[activeTimelineRider].skills[key] ? 'checked' : '';
            return `<div class="skill-item">
                            <input type="checkbox" class="skill-cb" id="${activeTimelineRider}_${key}" data-key="${key}" data-rider="${activeTimelineRider}" ${checked}>
                            <label class="skill-label" for="${activeTimelineRider}_${key}">
                                <span class="skill-check"></span>
                                ${sk}
                            </label>
                        </div>`;
        }).join('')}
                </div>
            </div>
        `;
        // Toggle open/close
        card.querySelector('.phase-header').addEventListener('click', () => card.classList.toggle('open'));
        // Rider toggle within phase
        card.querySelectorAll('.skill-rider-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                activeTimelineRider = btn.dataset.rider;
                buildTimeline();
            });
        });
        // Skill checkboxes
        container.appendChild(card);
    });
    // Attach checkbox listeners after appending
    container.querySelectorAll('.skill-cb').forEach(cb => {
        cb.addEventListener('change', () => {
            const rider = cb.dataset.rider;
            const key = cb.dataset.key;
            state[rider].skills[key] = cb.checked;
            saveState();
            updateProgress();
            buildTimeline();
            renderSkillTree();
        });
    });
}
buildTimeline();
window.buildTimeline = buildTimeline;


// ===== PROGRESS RINGS =====
function updateProgress() {
    ['cleo', 'lila'].forEach(rider => {
        const totalSkills = PHASES.reduce((sum, p) => sum + p.skills.length, 0);
        const done = Object.values(state[rider].skills).filter(Boolean).length;
        const pct = totalSkills > 0 ? Math.round((done / totalSkills) * 100) : 0;
        document.getElementById(`${rider}-pct`).textContent = `${pct}%`;
        const circle = document.querySelector(`.progress-ring-fill[data-rider="${rider}"]`);
        const circumference = 2 * Math.PI * 52;
        circle.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    });
}
updateProgress();

// ===== SKILL TREE =====
let activeTreeRider = 'cleo';
document.querySelectorAll('.tree-rider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tree-rider-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTreeRider = btn.dataset.rider;
        renderSkillTree();
    });
});

function isNodeUnlocked(nodeId) {
    const node = SKILL_TREE_NODES.find(n => n.id === nodeId);
    if (!node) return false;
    if (node.phase === 0) return true; // Falling leaf is already done
    // Check if any skill in phases up to this node's phase is checked
    const phaseData = PHASES[node.phase - 1];
    if (!phaseData) return false;
    const skills = state[activeTreeRider].skills;
    // Node is "unlocked" if at least one skill in its phase is checked AND all deps are unlocked
    const hasPhaseProgress = phaseData.skills.some((_, i) => skills[`p${phaseData.id}_s${i}`]);
    const depsOk = !node.deps || node.deps.every(d => isNodeUnlocked(d));
    return (node.phase === 0) || (hasPhaseProgress && depsOk);
}

function renderSkillTree() {
    const container = document.getElementById('skill-tree-vis');
    const nodes = SKILL_TREE_NODES;
    // Build edges
    let edgesHTML = '';
    nodes.forEach(node => {
        if (node.deps) {
            node.deps.forEach(depId => {
                const dep = nodes.find(n => n.id === depId);
                if (!dep) return;
                const active = isNodeUnlocked(node.id) && isNodeUnlocked(depId);
                edgesHTML += `<line class="tree-edge ${active ? 'active' : ''}" x1="${dep.x}" y1="${dep.y}" x2="${node.x}" y2="${node.y}"/>`;
            });
        }
    });
    let nodesHTML = '';
    nodes.forEach(node => {
        const unlocked = isNodeUnlocked(node.id);
        const r = node.id === 'oly' ? 24 : 16;
        nodesHTML += `<g class="tree-node ${unlocked ? 'unlocked' : ''}">
            <circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${unlocked ? '#38bdf8' : 'rgba(255,255,255,0.06)'}" stroke="${unlocked ? '#38bdf8' : 'rgba(255,255,255,0.15)'}" stroke-width="2"/>
            <text x="${node.x}" y="${node.y + r + 14}" text-anchor="middle">${node.label}</text>
        </g>`;
    });
    container.innerHTML = `<svg class="tree-svg" viewBox="0 0 700 660">${edgesHTML}${nodesHTML}</svg>`;
}
renderSkillTree();

// ===== SESSION LOG =====
let selectedRating = 3;
let activeLogRider = 'cleo';

document.querySelectorAll('.rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRating = parseInt(btn.dataset.val);
    });
});
// Set default rating
document.querySelector('.rate-btn[data-val="3"]').classList.add('active');
// Set default date
document.getElementById('log-date').valueAsDate = new Date();

document.querySelectorAll('.log-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeLogRider = tab.dataset.rider;
        renderLogEntries();
    });
});

document.getElementById('log-form').addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('log-date').value;
    const rider = document.getElementById('log-rider').value;
    const notes = document.getElementById('log-notes').value;
    if (!date || !rider || !notes) return;
    state[rider].sessions.push({ date, notes, rating: selectedRating, ts: Date.now() });
    state[rider].sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveState();
    document.getElementById('log-notes').value = '';
    activeLogRider = rider;
    document.querySelectorAll('.log-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.rider === rider);
    });
    renderLogEntries();
});

const RATING_EMOJIS = ['', '😤', '😐', '🙂', '😄', '🔥'];

function renderLogEntries() {
    const container = document.getElementById('log-entries');
    const sessions = state[activeLogRider].sessions;
    if (!sessions.length) {
        container.innerHTML = '<div class="log-empty">No sessions logged yet. Get out there! 🏔️</div>';
        return;
    }
    container.innerHTML = sessions.map(s => `
        <div class="log-entry">
            <span class="log-entry-date">${s.date}</span>
            <span class="log-entry-notes">${escapeHtml(s.notes)}</span>
            <span class="log-entry-rating">${RATING_EMOJIS[s.rating] || ''}</span>
        </div>
    `).join('');
}
function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}
renderLogEntries();

// ===== EXPORT / IMPORT =====
document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'peaks-podium-backup.json';
    a.click();
});
document.getElementById('btn-import').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            if (imported.cleo && imported.lila) {
                state = imported;
                saveState();
                location.reload();
            } else { alert('Invalid backup file.'); }
        } catch { alert('Could not parse file.'); }
    };
    reader.readAsText(file);
});

// ===== NAV SCROLL EFFECT =====
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    nav.style.borderBottomColor = window.scrollY > 50 ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.05)';
});
