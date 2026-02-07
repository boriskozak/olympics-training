// ===== INTERACTIVE LEARNING MODULE =====
// Adds: Skill detail modals, drills, tips, daily challenges, achievements, streaks, celebrations

// ===== SKILL DETAILS DATABASE =====
const SKILL_DETAILS = {
    // Phase 1 — Foundation
    "p1_s0": {
        name: "Confident linked turns on green runs",
        tip: "Keep your weight centered over the board. Look where you want to go, not at your feet!",
        commonMistakes: ["Leaning back (causes the nose to lift)", "Looking down at the board", "Stiff legs — keep knees bent!"],
        drills: ["Garland turns — practice half-turns across the slope", "Count to 3 between each turn to build rhythm", "Try turns with arms behind your back for balance"],
        video: "https://www.youtube.com/results?search_query=snowboard+linked+turns+beginner+tutorial"
    },
    "p1_s1": {
        name: "Speed control — skidded stops both directions",
        tip: "Press your toes or heels into the snow gradually — don't slam them. Think of it like squeezing a brake.",
        commonMistakes: ["Sitting back to stop (will make you fall)", "Only stopping on one edge", "Straightening legs when scared"],
        drills: ["Red light / green light game — stop on command!", "Practice stopping within a 'box' you draw in the snow", "Alternate heel stops and toe stops down the run"],
        video: "https://www.youtube.com/results?search_query=snowboard+speed+control+beginner"
    },
    "p1_s2": {
        name: "Falling leaf — heel & toe edge (mastered)",
        tip: "You've already got this one! Use it as your warm-up every session.",
        commonMistakes: ["Rushing — use falling leaf to warm up your edges", "Forgetting to practice toe-side falling leaf"],
        drills: ["Race each other doing falling leaf!", "Try it on steeper terrain to build edge confidence", "Do it switch (opposite foot forward)"],
        video: "https://www.youtube.com/results?search_query=snowboard+falling+leaf+technique"
    },
    "p1_s3": {
        name: "Basic carving on gentle slopes",
        tip: "Carving means your board rides on its edge cutting an arc — no skidding! Tilt the board, don't twist it.",
        commonMistakes: ["Skidding the tail (that's steering, not carving)", "Not enough knee angulation", "Going too slow — you need some speed for carving"],
        drills: ["Try to leave a thin pencil line in the snow", "Carve one direction and look back at your track", "Play 'railroad tracks' — follow each other's carved lines"],
        video: "https://www.youtube.com/results?search_query=snowboard+basic+carving+tutorial"
    },
    "p1_s4": {
        name: "Switch stance introduction — straight glide",
        tip: "Switch = riding with your opposite foot forward. Start on flat terrain just sliding straight.",
        commonMistakes: ["Twisting body to look downhill (stay centered)", "Giving up too fast — it feels super weird at first!", "Trying turns before you can glide straight"],
        drills: ["Skate around the flat area switch", "Straight run switch on the bunny hill", "One run regular, one run switch — alternate all day"],
        video: "https://www.youtube.com/results?search_query=snowboard+switch+riding+beginner"
    },
    "p1_s5": {
        name: "Riding small rollers & natural features",
        tip: "Bend your knees as you go over bumps — absorb them like a car's suspension!",
        commonMistakes: ["Stiff legs on rollers (bouncy and out of control)", "Not looking ahead for the next feature", "Going too fast before you're comfortable"],
        drills: ["Find a gentle roller and ride over it 10 times", "Try getting a tiny air off a natural bump", "Ride through chopped up snow on the side of the run"],
        video: "https://www.youtube.com/results?search_query=snowboard+riding+terrain+features+beginner"
    },
    "p1_s6": {
        name: "Comfortable on blue runs",
        tip: "Blues are steeper but the same skills apply. Control your speed with turning, not braking!",
        commonMistakes: ["Surviving the run instead of enjoying it", "Making huge traverses instead of turning", "Going straight and then panic-stopping"],
        drills: ["Pick the easiest blue and do 5 laps", "Count your turns — try to make at least 8 per section", "Challenge: no falling leaf allowed on blue runs!"],
        video: "https://www.youtube.com/results?search_query=snowboard+blue+run+tips"
    },
    "p1_s7": {
        name: "Intro to proper body position & edge angles",
        tip: "Knees bent, back straight, arms relaxed at sides. Your front hand points where you want to go.",
        commonMistakes: ["Bending at the waist (bend knees instead)", "Arms flailing like a windmill", "Counter-rotation (twisting body opposite to the turn)"],
        drills: ["Practice stance in your living room on carpet", "Have someone film you — compare to pro riders", "Hold a ball in front of you while riding — it keeps arms quiet"],
        video: "https://www.youtube.com/results?search_query=snowboard+proper+stance+body+position"
    },
    // Phase 2 — Intermediate
    "p2_s0": {
        name: "Dynamic carving on blue runs",
        tip: "Now add power! Drive your knees into each turn and feel the board flex.",
        commonMistakes: ["Upper body rotation instead of lower body angulation", "Not committing to the edge", "Speed fear — carving actually gives you MORE control"],
        drills: ["Javelin turns — hold your front arm like a javelin pointing downhill", "Euro-carve attempts (touching snow with hand)", "Carve a figure-8 on a wide open blue"],
        video: "https://www.youtube.com/results?search_query=snowboard+dynamic+carving+intermediate"
    },
    "p2_s1": {
        name: "Carving on steeper terrain (black runs)",
        tip: "Black runs reward good technique. Short, quick turns = speed control on steeps.",
        commonMistakes: ["Leaning uphill out of fear", "Making turns too wide (cross-hill traverses)", "Looking at the steepness instead of your next turn"],
        drills: ["Pick the shortest black run available", "Make 3 turns then stop, 3 turns then stop", "Sideslip the top, carve the bottom — gradually extend the carving portion"],
        video: "https://www.youtube.com/results?search_query=snowboard+carving+steep+terrain"
    },
    "p2_s2": {
        name: "Switch riding — linking turns",
        tip: "Everything you learned regular — now mirror it. It's like learning a new language with the same alphabet.",
        commonMistakes: ["Only practicing switch for 1 run then quitting", "Not committing to full turns", "Different technique switch vs regular (should be the same)"],
        drills: ["Entire last run of the day = switch only", "Switch races with your sister!", "Film yourself switch, compare to regular footage"],
        video: "https://www.youtube.com/results?search_query=snowboard+switch+turns+tutorial"
    },
    "p2_s3": {
        name: "Intro to park — straight airs off small jumps",
        tip: "Start with the XS jumps. Pop off the lip, stay centered, land with both feet. No tricks yet — just airtime!",
        commonMistakes: ["Leaning back on takeoff (nose goes up, you land on your butt)", "Arms flailing in the air", "Not enough speed (worse than too much!)"],
        drills: ["Pop off flat ground 20 times first", "Hit the same small jump 10 times in a row", "Focus: quiet upper body, bent knees on landing"],
        video: "https://www.youtube.com/results?search_query=snowboard+first+jump+park+beginner"
    },
    "p2_s4": {
        name: "50-50 on boxes",
        tip: "50-50 = riding straight across. Keep your base flat, knees bent, eyes on the end of the box. Commit!",
        commonMistakes: ["Looking at the box surface (look at the END)", "Leaning heel or toe side (stay flat)", "Stepping off the side instead of riding off the end"],
        drills: ["Practice balancing on a curb or rail on the ground first", "Hit the box 10 times aiming for the center", "Try going slower, then gradually faster"],
        video: "https://www.youtube.com/results?search_query=snowboard+50-50+box+tutorial+beginner"
    },
    "p2_s5": {
        name: "Intro to halfpipe — dropping in",
        tip: "Start from the deck (top edge), point your nose down the transition, and ride down. Just ride wall to wall at first.",
        commonMistakes: ["Leaning back when dropping in", "Going too fast too early", "Not bending knees in the transition (flat bottom)"],
        drills: ["Ride across the flat bottom back and forth first", "Drop in from lower on the wall, work your way up", "5 runs just riding the pipe without trying any airs"],
        video: "https://www.youtube.com/results?search_query=snowboard+halfpipe+dropping+in+beginner"
    },
    "p2_s6": {
        name: "Butter tricks (nose/tail press)",
        tip: "Shift your weight over your nose or tail and press the board into the snow — like a butter knife!",
        commonMistakes: ["Bending at the waist instead of shifting hips", "Not enough flex in the knees", "Trying on steep terrain (start on flat!)"],
        drills: ["Nose press for 3 seconds while riding flat", "Tail press for 3 seconds", "Butter challenge: who can hold it longest?"],
        video: "https://www.youtube.com/results?search_query=snowboard+butter+tricks+nose+tail+press"
    },
    "p2_s7": {
        name: "Riding moguls & variable terrain",
        tip: "Absorb bumps with your legs — think of riding a horse. Look 2-3 bumps ahead!",
        commonMistakes: ["Stiff legs getting launched off bumps", "Looking at the bump you're ON instead of ahead", "Going straight instead of turning around bumps"],
        drills: ["Ride 3 bumps slowly, stop. Repeat", "Try to touch the top of each mogul with your hand", "Absorb drill: ride rollers and try to keep your head at the same height"],
        video: "https://www.youtube.com/results?search_query=snowboard+moguls+variable+terrain"
    },
    // Phase 3 — Park Fundamentals
    "p3_s0": { name: "Frontside & backside 180s", tip: "Wind up with your shoulders, unwind through the spin. Land switch — so practice switch first!", commonMistakes: ["Not committing to the full rotation", "Spinning but not spotting the landing", "Off-axis spin (keep it flat)"], drills: ["Practice 180s on flat ground with your board on", "Do 180s on a trampoline", "Hit the small jump doing frontside 180 only until it's easy"], video: "https://www.youtube.com/results?search_query=snowboard+180+tutorial" },
    "p3_s1": { name: "Frontside 360 off kickers", tip: "Same as 180 but keep the rotation going! Look over your shoulder to spot the landing.", commonMistakes: ["Opening up too early (under-rotating)", "Over-rotating and going to 450", "Not popping off the lip properly"], drills: ["360s on a trampoline until they're second nature", "Frontside 360 off side hits before the kicker", "Visualize the full rotation before each attempt"], video: "https://www.youtube.com/results?search_query=snowboard+frontside+360+tutorial" },
    "p3_s2": { name: "Boardslide on rails", tip: "Turn your board 90° and slide sideways across the rail. Keep your weight centered and look at the end.", commonMistakes: ["Leaning too far forward or back on the rail", "Not turning the full 90 degrees", "Looking down at the rail instead of the end"], drills: ["Practice on wide boxes first before rails", "Boardslide everything: boxes, logs, benches (carefully!)", "10 in a row without falling off"], video: "https://www.youtube.com/results?search_query=snowboard+boardslide+rail+tutorial" },
    "p3_s3": { name: "Frontside & backside grabs", tip: "Bring the board to your hand, don't reach for the board! Bone it out for style.", commonMistakes: ["Bending at the waist to reach the board", "Not holding the grab long enough", "Forgetting to pop off the lip first"], drills: ["Practice grabs on a trampoline first", "Indy grab 10 times, then mute grab 10 times", "Grab competition: who can hold it the longest?"], video: "https://www.youtube.com/results?search_query=snowboard+grabs+indy+mute+melon+tutorial" },
    "p3_s4": { name: "Halfpipe — riding wall to wall", tip: "Pump the transitions! Bend knees going in, extend going up. Like a skateboard pump track.", commonMistakes: ["Flat-basing in the transition (edge your board!)", "Not pumping — just coasting", "Getting too close to the lip before you're ready"], drills: ["Pump drills: 10 laps of just pumping transitions", "Try to get a little higher each lap", "Count your wall hits — try for 6+ per run"], video: "https://www.youtube.com/results?search_query=snowboard+halfpipe+transitions+pumping" },
    "p3_s5": { name: "Small kicker confidence (10-20ft)", tip: "Speed check by watching others. Pop straight up off the lip, keep your eyes on the landing.", commonMistakes: ["Absorbing the lip instead of popping", "Dead sailoring (arms and legs everywhere)", "Landing flat instead of on the downslope"], drills: ["Same jump, 10 times in a row — build the muscle memory", "Try adding a grab once the air feels easy", "Distance control: try to land in the same spot each time"], video: "https://www.youtube.com/results?search_query=snowboard+small+kicker+tips+beginner+park" },
    "p3_s6": { name: "Switch 180s", tip: "You already know 180s regular — now do them starting switch. This is called 'Cab' (or caballerial).", commonMistakes: ["Different technique than regular 180s (should feel mirrored)", "Not looking over the correct shoulder", "Reverting immediately on landing"], drills: ["Switch 180s on flat ground first", "Cab 180 off every side hit you see", "10 in a row off a small jump"], video: "https://www.youtube.com/results?search_query=snowboard+switch+180+cab+tutorial" },
    "p3_s7": { name: "Snowboard cross — basic gate training", tip: "SBX is all about being fast AND smooth through gates. Racing line = shortest distance + best angle.", commonMistakes: ["Hitting gates instead of going around them", "Losing speed in transitions between gates", "Not looking ahead to the next gate"], drills: ["Set up 4 markers and practice weaving through", "Race each other through gates!", "Practice pumping through rollers in the SBX course"], video: "https://www.youtube.com/results?search_query=snowboard+cross+gate+training+beginner" }
};

// Add generic details for phases 4-8 (more advanced)
for (let p = 4; p <= 8; p++) {
    const phase = window.PHASES ? window.PHASES[p - 1] : null;
    if (!phase) continue;
    phase.skills.forEach((sk, i) => {
        const key = `p${p}_s${i}`;
        if (!SKILL_DETAILS[key]) {
            SKILL_DETAILS[key] = {
                name: sk,
                tip: "Focus on consistency and progression. Film yourself and review!",
                commonMistakes: ["Rushing to the next level before mastering this", "Not warming up properly", "Skipping fundamentals"],
                drills: ["10 reps of this skill per session", "Film and review your technique", "Visualize before attempting"],
                video: `https://www.youtube.com/results?search_query=snowboard+${encodeURIComponent(sk.split('—')[0].trim())}+tutorial`
            };
        }
    });
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS = [
    { id: "first_skill", icon: "⭐", name: "First Steps", desc: "Check off your first skill", check: r => Object.values(state[r].skills).filter(Boolean).length >= 1 },
    { id: "5_skills", icon: "🌟", name: "Getting Started", desc: "Complete 5 skills", check: r => Object.values(state[r].skills).filter(Boolean).length >= 5 },
    { id: "phase1", icon: "🏔️", name: "Foundation Built", desc: "Complete all Phase 1 skills", check: r => { for (let i = 0; i < 8; i++) if (!state[r].skills[`p1_s${i}`]) return false; return true; } },
    { id: "10_skills", icon: "💪", name: "Dedicated", desc: "Complete 10 skills", check: r => Object.values(state[r].skills).filter(Boolean).length >= 10 },
    { id: "phase2", icon: "⛷️", name: "Intermediate Shredder", desc: "Complete all Phase 2 skills", check: r => { for (let i = 0; i < 8; i++) if (!state[r].skills[`p2_s${i}`]) return false; return true; } },
    { id: "20_skills", icon: "🔥", name: "On Fire", desc: "Complete 20 skills", check: r => Object.values(state[r].skills).filter(Boolean).length >= 20 },
    { id: "park_rat", icon: "🎿", name: "Park Rat", desc: "Complete all Phase 3 skills", check: r => { for (let i = 0; i < 8; i++) if (!state[r].skills[`p3_s${i}`]) return false; return true; } },
    { id: "halfway", icon: "🏅", name: "Halfway There!", desc: "Complete 32 skills (50%)", check: r => Object.values(state[r].skills).filter(Boolean).length >= 32 },
    { id: "comp_ready", icon: "🏆", name: "Competition Ready", desc: "Complete through Phase 5", check: r => { for (let p = 1; p <= 5; p++) for (let i = 0; i < 8; i++) if (!state[r].skills[`p${p}_s${i}`]) return false; return true; } },
    { id: "first_log", icon: "📝", name: "Logger", desc: "Log your first session", check: r => state[r].sessions.length >= 1 },
    { id: "10_logs", icon: "📖", name: "Consistent", desc: "Log 10 sessions", check: r => state[r].sessions.length >= 10 },
    { id: "streak3", icon: "🔥", name: "3-Day Streak", desc: "Log sessions 3 days in a row", check: r => getStreak(r) >= 3 },
    { id: "streak7", icon: "⚡", name: "Week Warrior", desc: "Log sessions 7 days in a row", check: r => getStreak(r) >= 7 },
    { id: "all_done", icon: "🥇", name: "Olympic Ready", desc: "Complete ALL 64 skills", check: r => Object.values(state[r].skills).filter(Boolean).length >= 64 },
];

// ===== DAILY CHALLENGES =====
const DAILY_CHALLENGES = {
    1: [
        { text: "🎯 Do 20 linked turns without stopping", xp: 10 },
        { text: "🏔️ Race your sister down a green run — loser buys hot chocolate!", xp: 15 },
        { text: "⏱️ Hold a falling leaf for 30 seconds without moving forward", xp: 10 },
        { text: "🎥 Film each other and watch the video at lunch", xp: 20 },
        { text: "🔄 Try 5 switch straight runs on the bunny slope", xp: 15 },
        { text: "🎿 Find 3 natural rollers and ride over all of them", xp: 10 },
        { text: "💪 Make turns so smooth a cup of water on your board wouldn't spill", xp: 15 },
    ],
    2: [
        { text: "🎯 Carve 10 perfect turns on a blue run", xp: 15 },
        { text: "📦 Hit the small box 5 times in a row without falling", xp: 20 },
        { text: "🔄 Complete an entire run switch on a green", xp: 20 },
        { text: "🧈 Hold a nose press for 3 seconds", xp: 15 },
        { text: "🏂 Try a straight air — JUST pop and land. No tricks!", xp: 20 },
        { text: "⛷️ Ride through moguls without stopping", xp: 15 },
        { text: "🎥 Film your carving and count how many are REAL carves (no skid!)", xp: 20 },
    ],
    3: [
        { text: "🔄 Land 3 frontside 180s in a row", xp: 25 },
        { text: "🎯 Boardslide the easiest box, clean entry and exit", xp: 25 },
        { text: "✋ Do an indy grab off a small jump", xp: 25 },
        { text: "🏂 Ride the halfpipe wall-to-wall 5 times without stopping", xp: 20 },
        { text: "🔥 Combo challenge: 180 then immediately a nose press", xp: 30 },
        { text: "🏁 Race through SBX gates if available at your resort", xp: 20 },
        { text: "🎥 Film a 'mini-part' — 30 seconds of your best tricks today", xp: 30 },
    ]
};

// For phases 4+, generate challenges
for (let p = 4; p <= 8; p++) {
    DAILY_CHALLENGES[p] = [
        { text: "🎯 Practice your hardest trick 10 times", xp: 30 + (p * 5) },
        { text: "🏂 Full run top to bottom with zero falls", xp: 25 + (p * 5) },
        { text: "📹 Film your session and review technique", xp: 20 + (p * 5) },
        { text: "🔄 Do everything switch for one full run", xp: 30 + (p * 5) },
        { text: "💪 Visualization: close your eyes and mentally run through your hardest trick 5 times", xp: 15 + (p * 5) },
        { text: "🏔️ Push your comfort zone — try something new today", xp: 35 + (p * 5) },
        { text: "🤝 Watch someone better than you and try to copy one thing they do", xp: 25 + (p * 5) },
    ];
}

// ===== STREAK CALCULATOR =====
function getStreak(rider) {
    const sessions = state[rider].sessions;
    if (!sessions.length) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    // Check if most recent session is today or yesterday
    const mostRecent = dates[0];
    const dayDiff = Math.floor((new Date(today) - new Date(mostRecent)) / 86400000);
    if (dayDiff > 1) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((new Date(dates[i - 1]) - new Date(dates[i])) / 86400000);
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

// ===== GET CURRENT PHASE =====
function getCurrentPhase(rider) {
    for (let p = 0; p < PHASES.length; p++) {
        const allDone = PHASES[p].skills.every((_, i) => state[rider].skills[`p${PHASES[p].id}_s${i}`]);
        if (!allDone) return p + 1;
    }
    return 8;
}

// ===== CELEBRATION EFFECTS =====
function fireConfetti(x, y) {
    const snowflakes = ['❄', '❅', '❆', '✻', '✼', '❄️'];
    const colors = ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#a78bfa', '#c4b5fd'];
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;`;
    document.body.appendChild(container);
    const count = 45;
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('span');
        const size = 12 + Math.random() * 22;
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const burstDist = 60 + Math.random() * 160;
        const driftX = (Math.random() - 0.5) * 120;
        const fallDist = 200 + Math.random() * 400;
        const spinEnd = (Math.random() - 0.5) * 1080;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const sym = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        const duration = 1200 + Math.random() * 1000;
        const delay = Math.random() * 200;
        flake.textContent = sym;
        flake.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${size}px;color:${color};text-shadow:0 0 6px rgba(56,189,248,0.6);filter:drop-shadow(0 0 3px rgba(255,255,255,0.4));line-height:1;`;
        container.appendChild(flake);
        flake.animate([
            { transform: 'translate(0,0) rotate(0deg) scale(0.3)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * burstDist * 0.5 + driftX * 0.3}px,${Math.sin(angle) * burstDist * 0.5}px) rotate(${spinEnd * 0.4}deg) scale(1.1)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${Math.cos(angle) * burstDist + driftX}px,${Math.sin(angle) * burstDist + fallDist}px) rotate(${spinEnd}deg) scale(0.6)`, opacity: 0 }
        ], { duration, delay, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
    }
    setTimeout(() => container.remove(), 2800);
}

function fireBigCelebration() {
    // Full screen celebration for phase completion
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-emoji">🎉🏂🎉</div>
            <h2>PHASE COMPLETE!</h2>
            <p>Amazing progress! You're one step closer to the Olympics! 🥇</p>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    // Multiple confetti bursts
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            fireConfetti(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5);
        }, i * 200);
    }
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    }, 3000);
}

// ===== SKILL DETAIL MODAL =====
function showSkillModal(skillKey) {
    const detail = SKILL_DETAILS[skillKey];
    if (!detail) return;
    const existing = document.querySelector('.skill-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML = `
        <div class="skill-modal">
            <button class="modal-close">&times;</button>
            <h3 class="modal-title">${detail.name}</h3>
            
            <div class="modal-section">
                <div class="modal-section-header">
                    <span class="modal-icon">💡</span>
                    <h4>Pro Tip</h4>
                </div>
                <p class="modal-tip">${detail.tip}</p>
            </div>

            <div class="modal-section">
                <div class="modal-section-header">
                    <span class="modal-icon">⚠️</span>
                    <h4>Common Mistakes</h4>
                </div>
                <ul class="modal-list mistakes-list">
                    ${detail.commonMistakes.map(m => `<li>${m}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-section">
                <div class="modal-section-header">
                    <span class="modal-icon">🎯</span>
                    <h4>Drills to Try</h4>
                </div>
                <ul class="modal-list drills-list">
                    ${detail.drills.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>

            <a href="${detail.video}" target="_blank" class="modal-video-btn">
                ▶️ Search Tutorial Videos
            </a>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('.modal-close').addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    });
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}

// ===== DAILY CHALLENGE WIDGET =====
function renderDailyChallenge() {
    const container = document.getElementById('daily-challenge');
    if (!container) return;

    ['cleo', 'lila'].forEach(rider => {
        const phase = getCurrentPhase(rider);
        const challenges = DAILY_CHALLENGES[phase] || DAILY_CHALLENGES[1];
        // Pick challenge based on day of year so it changes daily
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const challenge = challenges[dayOfYear % challenges.length];
        const riderDiv = container.querySelector(`[data-rider="${rider}"]`);
        if (riderDiv) {
            const completedKey = `challenge_${rider}_${dayOfYear}`;
            const isCompleted = state[rider][completedKey];
            riderDiv.querySelector('.challenge-text').textContent = challenge.text;
            riderDiv.querySelector('.challenge-xp').textContent = `+${challenge.xp} XP`;
            const btn = riderDiv.querySelector('.challenge-complete-btn');
            if (isCompleted) {
                btn.textContent = '✅ Done!';
                btn.disabled = true;
                btn.classList.add('completed');
            } else {
                btn.textContent = 'Complete!';
                btn.disabled = false;
                btn.classList.remove('completed');
                btn.onclick = (e) => {
                    state[rider][completedKey] = true;
                    // Add XP
                    state[rider].xp = (state[rider].xp || 0) + challenge.xp;
                    saveState();
                    fireConfetti(e.clientX, e.clientY);
                    renderDailyChallenge();
                    renderXPBar();
                    checkAchievements(rider);
                };
            }
        }
    });
}

// ===== XP SYSTEM =====
function renderXPBar() {
    ['cleo', 'lila'].forEach(rider => {
        const xpEl = document.getElementById(`${rider}-xp`);
        const levelEl = document.getElementById(`${rider}-level`);
        if (!xpEl || !levelEl) return;
        const xp = state[rider].xp || 0;
        const level = Math.floor(xp / 100) + 1;
        const xpInLevel = xp % 100;
        levelEl.textContent = `Level ${level}`;
        xpEl.style.width = `${xpInLevel}%`;
    });
}

// ===== ACHIEVEMENTS RENDERER =====
function renderAchievements() {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    const activeRider = document.querySelector('.badge-rider-btn.active')?.dataset.rider || 'cleo';
    container.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = a.check(activeRider);
        return `<div class="badge ${unlocked ? 'unlocked' : 'locked'}" title="${a.desc}">
            <span class="badge-icon">${a.icon}</span>
            <span class="badge-name">${a.name}</span>
            <span class="badge-desc">${a.desc}</span>
        </div>`;
    }).join('');
}

function checkAchievements(rider) {
    const prev = state[rider].achievements || [];
    const newAchievements = [];
    ACHIEVEMENTS.forEach(a => {
        if (!prev.includes(a.id) && a.check(rider)) {
            newAchievements.push(a);
            prev.push(a.id);
        }
    });
    state[rider].achievements = prev;
    saveState();
    // Show notification for new achievements
    newAchievements.forEach((a, i) => {
        setTimeout(() => showAchievementToast(a), i * 1500);
    });
    renderAchievements();
}

function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <span class="toast-icon">${achievement.icon}</span>
        <div>
            <strong>Achievement Unlocked!</strong>
            <p>${achievement.name}</p>
        </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    fireConfetti(window.innerWidth / 2, 80);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== STREAK DISPLAY =====
function renderStreaks() {
    ['cleo', 'lila'].forEach(rider => {
        const el = document.getElementById(`${rider}-streak`);
        if (!el) return;
        const streak = getStreak(rider);
        el.textContent = streak;
        el.parentElement.classList.toggle('on-fire', streak >= 3);
    });
}

// ===== WIRE INTO EXISTING APP =====
// Override the skill checkbox handler to add celebrations and modals
function enhanceSkillItems() {
    document.querySelectorAll('.skill-item').forEach(item => {
        const cb = item.querySelector('.skill-cb');
        const label = item.querySelector('.skill-label');
        if (!cb || !label) return;
        const key = cb.dataset.key;

        // Add info button
        if (!item.querySelector('.skill-info-btn')) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'skill-info-btn';
            infoBtn.textContent = '💡';
            infoBtn.title = 'Tips & Drills';
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSkillModal(key);
            });
            item.appendChild(infoBtn);
        }
    });
}

// Patch the checkpoint handler
const origBuildTimeline = window.buildTimeline;
if (typeof origBuildTimeline === 'function') {
    window.buildTimeline = function () {
        origBuildTimeline();
        enhanceSkillItems();
    };
}

// Hook into skill checkbox changes for celebrations
document.addEventListener('change', e => {
    if (!e.target.classList.contains('skill-cb')) return;
    if (e.target.checked) {
        const rect = e.target.closest('.skill-item').getBoundingClientRect();
        fireConfetti(rect.left + rect.width / 2, rect.top);

        const rider = e.target.dataset.rider;
        // Check if a phase was just completed
        const key = e.target.dataset.key;
        const phaseNum = parseInt(key.split('_')[0].substring(1));
        const phase = PHASES[phaseNum - 1];
        if (phase) {
            const allDone = phase.skills.every((_, i) => state[rider].skills[`p${phaseNum}_s${i}`]);
            if (allDone) {
                setTimeout(fireBigCelebration, 300);
            }
        }
        checkAchievements(rider);
    }
});

// Hook into session log for streak and achievements
const origForm = document.getElementById('log-form');
if (origForm) {
    origForm.addEventListener('submit', () => {
        setTimeout(() => {
            const rider = document.getElementById('log-rider').value || activeLogRider;
            renderStreaks();
            checkAchievements(rider);
        }, 100);
    });
}

// ===== INIT =====
function initInteractive() {
    enhanceSkillItems();
    renderDailyChallenge();
    renderXPBar();
    renderAchievements();
    renderStreaks();

    // Badge rider toggle
    document.querySelectorAll('.badge-rider-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.badge-rider-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAchievements();
        });
    });

    // Make PHASES accessible from this module
    if (!window.PHASES) window.PHASES = PHASES;
}

// Run after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractive);
} else {
    initInteractive();
}
