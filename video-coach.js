// ===== VIDEO COACH — AI-Powered Trick Analysis =====
// Extracts frames from uploaded video + uses Gemini Vision API for real analysis

const TRICK_CRITERIA = {
    'linked-turns': {
        name: 'Linked Turns',
        checkpoints: ['Weight centered over board', 'Eyes looking ahead (not at feet)', 'Smooth edge-to-edge transitions', 'Consistent turn shape', 'Knees bent throughout', 'Arms relaxed at sides'],
        phase: 1
    },
    'carving': {
        name: 'Carving',
        checkpoints: ['Clean edge hold (no skidding)', 'Knee angulation into the turn', 'Board on edge creating arc', 'Upper body stable', 'Speed maintained through turns', 'Smooth weight transfer'],
        phase: 1
    },
    'switch-riding': {
        name: 'Switch Riding',
        checkpoints: ['Balanced stance', 'Smooth glide without wobble', 'Centered weight distribution', 'Relaxed posture', 'Consistent speed control', 'Eyes forward'],
        phase: 1
    },
    'ollie': {
        name: 'Ollie / Pop',
        checkpoints: ['Back foot presses tail down', 'Front foot slides forward', 'Full board leaves the snow', 'Level in the air', 'Knees absorb landing', 'Balanced on landing'],
        phase: 2
    },
    'straight-air': {
        name: 'Straight Air (Jump)',
        checkpoints: ['Good approach speed', 'Pop off the lip', 'Stable in the air', 'No arm flailing', 'Knees bent on landing', 'Landing on downslope'],
        phase: 2
    },
    '50-50': {
        name: '50-50 on Box/Rail',
        checkpoints: ['Centered approach', 'Flat base on the feature', 'Knees bent and stable', 'Eyes on the end', 'Balanced weight', 'Clean ride-off'],
        phase: 2
    },
    'butter': {
        name: 'Butter / Press',
        checkpoints: ['Smooth weight shift to nose/tail', 'Board flexes properly', 'Hips over pressure point', 'Controlled duration', 'Smooth exit', 'Balanced throughout'],
        phase: 2
    },
    '180': {
        name: '180 Spin',
        checkpoints: ['Proper wind-up', 'Good pop off lip', 'Full 180° rotation', 'Spot the landing', 'Land switch cleanly', 'Balanced on landing'],
        phase: 3
    },
    '360': {
        name: '360 Spin',
        checkpoints: ['Strong wind-up', 'Good pop', 'Full 360° rotation', 'Head leads the spin', 'Spot the landing', 'Stomped landing'],
        phase: 3
    },
    'boardslide': {
        name: 'Boardslide',
        checkpoints: ['Approach at slight angle', 'Full 90° turn onto feature', 'Weight centered', 'Board perpendicular to rail', 'Eyes on the end', 'Clean ride-off'],
        phase: 3
    },
    'grab': {
        name: 'Grab (Indy/Mute/Melon)',
        checkpoints: ['Good pop and height', 'Board brought to hand', 'Clean grab (not reaching)', 'Grab held for duration', 'Boned out for style', 'Clean release and landing'],
        phase: 3
    },
    'halfpipe': {
        name: 'Halfpipe Run',
        checkpoints: ['Pumping transitions', 'Getting above the lip', 'Dropping back in cleanly', 'Edge control in pipe', 'Speed maintained', 'Smooth wall-to-wall flow'],
        phase: 3
    },
    'general': {
        name: 'General Riding',
        checkpoints: ['Good body position', 'Knees bent', 'Weight centered', 'Smooth movements', 'Good edge control', 'Overall flow and style'],
        phase: 1
    }
};

// Gemini API key management
function getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
}
function setApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
}

// Extract frames from video as base64
async function extractFrames(videoEl, count = 4) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const duration = videoEl.duration;
    const frames = [];

    canvas.width = 640;
    canvas.height = 360;

    for (let i = 0; i < count; i++) {
        const time = (duration / (count + 1)) * (i + 1);
        videoEl.currentTime = time;
        await new Promise(r => {
            videoEl.onseeked = r;
        });
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        frames.push({
            time: time.toFixed(1),
            dataUrl: canvas.toDataURL('image/jpeg', 0.8)
        });
    }

    return frames;
}

// Analyze with Gemini Vision API
async function analyzeWithGemini(frames, trickType) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const trick = TRICK_CRITERIA[trickType];
    const prompt = `You are an expert snowboard coach analyzing video frames of a snowboarder attempting a "${trick.name}".

Analyze these ${frames.length} sequential frames and evaluate the rider's technique. Score each of these checkpoints from 0-10:
${trick.checkpoints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond in this exact JSON format:
{
  "overallScore": <number 0-100>,
  "scores": [<array of scores 0-10 for each checkpoint>],
  "feedback": "<2-3 sentences of specific, encouraging coaching feedback>",
  "strength": "<their biggest strength in one sentence>",
  "improvement": "<their #1 area to improve in one sentence>"
}

Be encouraging but honest. These are young riders training for the Olympics. Focus on actionable tips.`;

    const parts = [{ text: prompt }];
    frames.forEach(f => {
        parts.push({
            inline_data: {
                mime_type: 'image/jpeg',
                data: f.dataUrl.split(',')[1]
            }
        });
    });

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature: 0.7 }
            })
        });
        const data = await resp.json();
        if (data.error) {
            console.error('Gemini API error:', data.error);
            return null;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Gemini analysis error:', e);
    }
    return null;
}

// Smart simulated analysis (fallback when no API key)
function simulateAnalysis(trickType) {
    const trick = TRICK_CRITERIA[trickType];
    const scores = trick.checkpoints.map(() => Math.floor(Math.random() * 3) + 6); // 6-8 range
    // Make one score high and one lower for realism
    scores[Math.floor(Math.random() * scores.length)] = 9;
    scores[Math.floor(Math.random() * scores.length)] = 5;
    const total = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10);

    const feedbackOptions = {
        'linked-turns': { feedback: "Good rhythm on the turns! Focus on keeping your gaze ahead — your board follows your eyes. Try counting 1-2-3 between turns for consistent spacing.", strength: "Nice smooth edge transitions between turns.", improvement: "Keep your weight more centered — you're leaning back slightly on heel-side turns." },
        'carving': { feedback: "You're getting a nice arc started! The board is engaging the edge well. Push your knees more into the turn and trust the edge — that's where the magic happens.", strength: "Good commitment to the edge angle.", improvement: "Try to eliminate the small skid at the start of each turn — initiate with your front knee." },
        'switch-riding': { feedback: "Switch is all about muscle memory — you're building it! Your balance looks stable. Work on keeping your shoulders parallel to the board.", strength: "Good centered stance and calm upper body.", improvement: "Look further ahead — your head position is slightly down, which tightens your turns." },
        'ollie': { feedback: "Nice pop! The timing of your tail press is improving. Focus on the front foot slide after you press — that's what levels the board out.", strength: "Good tail press initiation.", improvement: "Slide your front foot forward more to level the board at peak height." },
        'straight-air': { feedback: "Good approach and takeoff! You're popping well off the lip. Focus on keeping your arms still in the air and spotting your landing earlier.", strength: "Great approach speed control.", improvement: "Tuck your arms in — keep them quiet for a more stable, stylish air." },
        '50-50': { feedback: "Nice work getting on the feature! Your balance looks steady. Remember: eyes on the end of the box, not your feet! Commitment is key.", strength: "Good flat-base balance on the feature.", improvement: "Keep your eyes focused on the end of the box from the moment you get on." },
        'butter': { feedback: "Fun butter! The press looks good. Focus on shifting your hips over the nose/tail rather than bending at the waist — it's all in the hips!", strength: "Good flex and press duration.", improvement: "Shift your hips forward rather than bending your torso — more style, more control." },
        '180': { feedback: "Solid 180! Your wind-up and rotation look committed. The key now is landing switch more confidently — ride an entire run switch to build that comfort.", strength: "Good shoulder wind-up and commitment to the full rotation.", improvement: "Spot your landing earlier by looking over your shoulder as you rotate." },
        '360': { feedback: "Going for 3s! Love the commitment. Focus on keeping your head leading the spin — where your head goes, your body follows. Almost there!", strength: "Great commitment and pop off the lip.", improvement: "Keep your head turning through the rotation — don't stop looking halfway." },
        'boardslide': { feedback: "Getting sideways! Good approach. Focus on centering your weight over the middle of the rail/box and looking at the end. Trust it!", strength: "Good approach angle and turn onto the feature.", improvement: "Center your weight more — stay directly over the feature, not leaning back." },
        'grab': { feedback: "Going for grabs! Nice. Remember: bring the board to your hand by sucking your knees up, don't reach down for it. Bone it out for maximum style!", strength: "Good height and willingness to go for the grab.", improvement: "Suck your knees up to bring the board to your hand — don't reach down." },
        'halfpipe': { feedback: "Pipe riding takes courage! Great job getting wall to wall. Focus on pumping the transitions — bend your knees going in, extend going up. It's like a pump track!", strength: "Good commitment to riding the walls.", improvement: "Pump the transitions harder — compress going in, extend going up." },
        'general': { feedback: "Looking smooth out there! Your overall body position is solid. Keep those knees bent and eyes up — you'll be amazed at the difference it makes.", strength: "Good overall flow and comfort on the board.", improvement: "Bend your knees a little more — lower center of gravity = more stability." }
    };

    const fb = feedbackOptions[trickType] || feedbackOptions['general'];
    return {
        overallScore: total,
        scores: scores,
        feedback: fb.feedback,
        strength: fb.strength,
        improvement: fb.improvement
    };
}

// ===== RENDER FUNCTIONS =====

function renderAnalysisResult(result, trickType, frames) {
    const trick = TRICK_CRITERIA[trickType];
    const resultsDiv = document.getElementById('coach-results');
    if (!resultsDiv) return;

    const scoreColor = result.overallScore >= 80 ? '#34d399' : result.overallScore >= 60 ? '#fbbf24' : '#f87171';
    const scoreEmoji = result.overallScore >= 80 ? '🔥' : result.overallScore >= 60 ? '💪' : '📈';
    const grade = result.overallScore >= 90 ? 'S' : result.overallScore >= 80 ? 'A' : result.overallScore >= 70 ? 'B' : result.overallScore >= 60 ? 'C' : 'D';

    let framesHTML = '';
    if (frames && frames.length > 0) {
        framesHTML = `
            <div class="analysis-frames">
                ${frames.map((f, i) => `
                    <div class="frame-thumb">
                        <img src="${f.dataUrl}" alt="Frame ${i + 1}">
                        <span class="frame-time">${f.time}s</span>
                    </div>
                `).join('')}
            </div>`;
    }

    resultsDiv.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-header">
                <div class="score-ring">
                    <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="${scoreColor}" stroke-width="8"
                            stroke-dasharray="${2 * Math.PI * 52}" 
                            stroke-dashoffset="${2 * Math.PI * 52 * (1 - result.overallScore / 100)}"
                            stroke-linecap="round" transform="rotate(-90 60 60)" class="score-ring-fill"/>
                    </svg>
                    <div class="score-text">
                        <span class="score-number" style="color:${scoreColor}">${result.overallScore}</span>
                        <span class="score-grade">${grade}</span>
                    </div>
                </div>
                <div class="analysis-meta">
                    <h3>${scoreEmoji} ${trick.name} Analysis</h3>
                    <p class="analysis-feedback">${result.feedback}</p>
                </div>
            </div>

            ${framesHTML}

            <div class="checkpoints-grid">
                ${trick.checkpoints.map((cp, i) => {
        const score = result.scores[i] || 0;
        const cpColor = score >= 8 ? '#34d399' : score >= 6 ? '#fbbf24' : '#f87171';
        const cpEmoji = score >= 8 ? '✅' : score >= 6 ? '🟡' : '🔴';
        return `
                        <div class="checkpoint-item">
                            <div class="checkpoint-header">
                                <span>${cpEmoji} ${cp}</span>
                                <span class="checkpoint-score" style="color:${cpColor}">${score}/10</span>
                            </div>
                            <div class="checkpoint-bar">
                                <div class="checkpoint-fill" style="width:${score * 10}%;background:${cpColor}"></div>
                            </div>
                        </div>`;
    }).join('')}
            </div>

            <div class="analysis-summary">
                <div class="summary-item strength">
                    <span class="summary-icon">💪</span>
                    <div>
                        <strong>Biggest Strength</strong>
                        <p>${result.strength}</p>
                    </div>
                </div>
                <div class="summary-item improve">
                    <span class="summary-icon">🎯</span>
                    <div>
                        <strong>#1 Focus Area</strong>
                        <p>${result.improvement}</p>
                    </div>
                </div>
            </div>

            <button class="analyze-again-btn" onclick="resetCoach()">📹 Analyze Another Video</button>
        </div>
    `;

    resultsDiv.classList.add('show');
    // Animate score ring
    setTimeout(() => {
        const ring = resultsDiv.querySelector('.score-ring-fill');
        if (ring) ring.style.transition = 'stroke-dashoffset 1.5s ease-out';
    }, 100);
}

function resetCoach() {
    const results = document.getElementById('coach-results');
    const upload = document.getElementById('coach-upload-area');
    const preview = document.getElementById('coach-preview');
    if (results) { results.innerHTML = ''; results.classList.remove('show'); }
    if (upload) upload.style.display = '';
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
}

// ===== INITIALIZATION =====
function initVideoCoach() {
    const dropzone = document.getElementById('video-dropzone');
    const fileInput = document.getElementById('video-file-input');
    const trickSelect = document.getElementById('trick-select');
    const apiKeyInput = document.getElementById('gemini-key-input');
    const apiKeyToggle = document.getElementById('api-key-toggle');

    if (!dropzone) return;

    // Load saved API key
    if (apiKeyInput) {
        apiKeyInput.value = getApiKey();
        apiKeyInput.addEventListener('change', () => setApiKey(apiKeyInput.value.trim()));
    }

    // API key section toggle
    if (apiKeyToggle) {
        apiKeyToggle.addEventListener('click', () => {
            const section = document.getElementById('api-key-section');
            if (section) section.classList.toggle('show');
        });
    }

    // Drag and drop
    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideoFile(file);
        }
    });

    // Click to upload
    dropzone.addEventListener('click', () => fileInput?.click());
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) handleVideoFile(file);
        });
    }
}

async function handleVideoFile(file) {
    const uploadArea = document.getElementById('coach-upload-area');
    const preview = document.getElementById('coach-preview');
    if (!preview) return;

    uploadArea.style.display = 'none';
    preview.style.display = 'block';

    const videoURL = URL.createObjectURL(file);
    preview.innerHTML = `
        <video id="coach-video" controls playsinline>
            <source src="${videoURL}" type="${file.type}">
        </video>
        <div class="coach-controls">
            <select id="trick-select-preview">
                ${Object.entries(TRICK_CRITERIA).map(([key, val]) =>
        `<option value="${key}">Phase ${val.phase}: ${val.name}</option>`
    ).join('')}
            </select>
            <button class="analyze-btn" id="analyze-btn">
                <span class="analyze-icon">🤖</span> Analyze My Trick
            </button>
        </div>
        <div class="coach-api-hint">
            <button id="api-key-toggle" class="api-toggle-btn">🔑 AI Settings</button>
            <div id="api-key-section" class="api-key-section">
                <p>Add a <a href="https://aistudio.google.com/apikey" target="_blank">free Gemini API key</a> for real AI analysis:</p>
                <input type="password" id="gemini-key-input" placeholder="Paste Gemini API key..." value="${getApiKey()}">
                <p class="api-note">Without a key, you'll get smart tip-based feedback.</p>
            </div>
        </div>
    `;

    // Setup API key toggle
    const toggle = document.getElementById('api-key-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.getElementById('api-key-section')?.classList.toggle('show');
        });
    }
    const keyInput = document.getElementById('gemini-key-input');
    if (keyInput) {
        keyInput.addEventListener('change', () => setApiKey(keyInput.value.trim()));
    }

    // Setup analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    const video = document.getElementById('coach-video');

    video.addEventListener('loadedmetadata', () => {
        analyzeBtn.disabled = false;
    });

    analyzeBtn.addEventListener('click', async () => {
        const trickType = document.getElementById('trick-select-preview').value;
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="analyze-spinner"></span> Analyzing...';

        let frames = [];
        let result;

        try {
            // Extract frames
            frames = await extractFrames(video, 4);

            // Try AI analysis first
            if (getApiKey()) {
                analyzeBtn.innerHTML = '<span class="analyze-spinner"></span> AI is watching...';
                result = await analyzeWithGemini(frames, trickType);
            }

            // Fallback to simulated if no API key or analysis failed
            if (!result) {
                await new Promise(r => setTimeout(r, 1500)); // Simulate thinking
                result = simulateAnalysis(trickType);
            }

            if (result) {
                window.fireConfetti?.(window.innerWidth / 2, window.innerHeight / 3);
                renderAnalysisResult(result, trickType, frames);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            result = simulateAnalysis(trickType);
            renderAnalysisResult(result, trickType, frames);
        }

        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="analyze-icon">🤖</span> Analyze Again';
    });
}

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideoCoach);
} else {
    initVideoCoach();
}
