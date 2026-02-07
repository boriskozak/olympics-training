// ===== MOUNTAIN SHRED — Cute Snowboard Game =====
// Single player or split-screen head-to-head!

(function () {
    'use strict';

    // ===== GAME CONFIG =====
    const CONFIG = {
        laneCount: 5,
        baseFallSpeed: 3,
        maxFallSpeed: 8,
        speedIncreaseRate: 0.001,
        obstacleInterval: 60, // frames between obstacles
        minObstacleInterval: 25,
        lives: 3,
        invincibleFrames: 90,
        starDuration: 300,
        cocoaBoost: 1.5,
        cocoaDuration: 180
    };

    // ===== CUTE EMOJI SPRITES =====
    const OBSTACLES = [
        { emoji: '🐻', name: 'Friendly Bear', size: 40, points: 0 },
        { emoji: '🫎', name: 'Moose', size: 42, points: 0 },
        { emoji: '⛄', name: 'Snowman', size: 38, points: 0 },
        { emoji: '🌲', name: 'Pine Tree', size: 44, points: 0 },
        { emoji: '🐧', name: 'Penguin', size: 34, points: 0 },
        { emoji: '🪨', name: 'Rock', size: 36, points: 0 },
        { emoji: '🦌', name: 'Deer', size: 38, points: 0 },
        { emoji: '🐰', name: 'Bunny', size: 30, points: 0 },
    ];

    const POWERUPS = [
        { emoji: '☕', name: 'Hot Cocoa', size: 30, type: 'speed' },
        { emoji: '⭐', name: 'Star', size: 32, type: 'invincible' },
        { emoji: '❤️', name: 'Extra Life', size: 28, type: 'life' },
    ];

    const COLLECTIBLES = [
        { emoji: '🪙', name: 'Coin', size: 24, points: 10 },
        { emoji: '💎', name: 'Gem', size: 22, points: 50 },
    ];

    // ===== GAME STATE =====
    class Player {
        constructor(canvasWidth, canvasHeight, name, color) {
            this.name = name;
            this.color = color;
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.reset();
        }

        reset() {
            this.x = this.canvasWidth / 2;
            this.y = this.canvasHeight - 80;
            this.width = 36;
            this.height = 36;
            this.speed = 5;
            this.score = 0;
            this.distance = 0;
            this.lives = CONFIG.lives;
            this.invincibleTimer = 0;
            this.starTimer = 0;
            this.cocoaTimer = 0;
            this.obstacles = [];
            this.particles = [];
            this.trailParticles = [];
            this.alive = true;
            this.fallSpeed = CONFIG.baseFallSpeed;
            this.frameCount = 0;
            this.nextObstacleFrame = 30;
            this.slopeOffset = 0;
            this.moveLeft = false;
            this.moveRight = false;
            this.moveUp = false;
            this.moveDown = false;
        }

        update() {
            if (!this.alive) return;
            this.frameCount++;
            this.distance += this.fallSpeed * 0.1;

            // Speed increases over time
            this.fallSpeed = Math.min(CONFIG.maxFallSpeed, CONFIG.baseFallSpeed + this.distance * CONFIG.speedIncreaseRate);

            // Cocoa boost
            if (this.cocoaTimer > 0) {
                this.cocoaTimer--;
                this.fallSpeed *= CONFIG.cocoaBoost;
            }

            // Invincibility timers
            if (this.invincibleTimer > 0) this.invincibleTimer--;
            if (this.starTimer > 0) this.starTimer--;

            // Movement
            const moveSpeed = this.speed;
            if (this.moveLeft) this.x = Math.max(this.width / 2 + 10, this.x - moveSpeed);
            if (this.moveRight) this.x = Math.min(this.canvasWidth - this.width / 2 - 10, this.x + moveSpeed);
            if (this.moveUp) this.y = Math.max(this.height / 2 + 10, this.y - moveSpeed * 0.7);
            if (this.moveDown) this.y = Math.min(this.canvasHeight - this.height / 2 - 10, this.y + moveSpeed * 0.7);

            // Slope offset for visual effect
            this.slopeOffset += this.fallSpeed;

            // Snow trail
            if (this.frameCount % 3 === 0) {
                this.trailParticles.push({
                    x: this.x + (Math.random() - 0.5) * 10,
                    y: this.y + 15,
                    size: 3 + Math.random() * 4,
                    alpha: 0.6,
                    life: 30
                });
            }

            // Spawn obstacles
            if (this.frameCount >= this.nextObstacleFrame) {
                this.spawnObstacle();
                const interval = Math.max(CONFIG.minObstacleInterval, CONFIG.obstacleInterval - this.distance * 0.3);
                this.nextObstacleFrame = this.frameCount + interval + Math.random() * 20;
            }

            // Update obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const ob = this.obstacles[i];
                ob.y += this.fallSpeed * ob.speedMult;
                ob.wobble += 0.05;

                // Remove if off screen
                if (ob.y > this.canvasHeight + 50) {
                    if (!ob.isPowerup && !ob.isCollectible) {
                        this.score += 5; // Points for dodging
                    }
                    this.obstacles.splice(i, 1);
                    continue;
                }

                // Collision check
                const dx = this.x - ob.x;
                const dy = this.y - ob.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const hitDist = (this.width + ob.size) / 2 - 8;

                if (dist < hitDist) {
                    if (ob.isCollectible) {
                        this.score += ob.points;
                        this.spawnCollectParticles(ob.x, ob.y, '🪙');
                        this.obstacles.splice(i, 1);
                    } else if (ob.isPowerup) {
                        this.applyPowerup(ob.type);
                        this.spawnCollectParticles(ob.x, ob.y, ob.emoji);
                        this.obstacles.splice(i, 1);
                    } else if (this.invincibleTimer <= 0 && this.starTimer <= 0) {
                        this.hit(ob);
                        this.obstacles.splice(i, 1);
                    } else if (this.starTimer > 0) {
                        this.score += 20;
                        this.spawnCollectParticles(ob.x, ob.y, '💥');
                        this.obstacles.splice(i, 1);
                    }
                }
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                p.alpha = p.life / p.maxLife;
                if (p.life <= 0) this.particles.splice(i, 1);
            }

            // Update trail
            for (let i = this.trailParticles.length - 1; i >= 0; i--) {
                const t = this.trailParticles[i];
                t.life--;
                t.alpha = t.life / 30 * 0.4;
                t.size *= 0.97;
                if (t.life <= 0) this.trailParticles.splice(i, 1);
            }
        }

        spawnObstacle() {
            const rand = Math.random();
            let ob;

            if (rand < 0.12) {
                // Powerup
                const pw = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
                ob = { ...pw, isPowerup: true, isCollectible: false };
            } else if (rand < 0.35) {
                // Collectible
                const col = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
                ob = { ...col, isPowerup: false, isCollectible: true };
            } else {
                // Obstacle
                const obs = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
                ob = { ...obs, isPowerup: false, isCollectible: false };
            }

            ob.x = 30 + Math.random() * (this.canvasWidth - 60);
            ob.y = -50;
            ob.speedMult = 0.8 + Math.random() * 0.4;
            ob.wobble = Math.random() * Math.PI * 2;
            ob.rotation = 0;

            this.obstacles.push(ob);
        }

        hit(obstacle) {
            this.lives--;
            this.invincibleTimer = CONFIG.invincibleFrames;

            // Spawn hit particles
            for (let i = 0; i < 12; i++) {
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 30,
                    maxLife: 30,
                    alpha: 1,
                    emoji: '❄️',
                    size: 12 + Math.random() * 10
                });
            }

            if (this.lives <= 0) {
                this.alive = false;
            }
        }

        applyPowerup(type) {
            if (type === 'speed') {
                this.cocoaTimer = CONFIG.cocoaDuration;
            } else if (type === 'invincible') {
                this.starTimer = CONFIG.starDuration;
            } else if (type === 'life') {
                this.lives = Math.min(this.lives + 1, 5);
            }
        }

        spawnCollectParticles(x, y, emoji) {
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -2 - Math.random() * 4,
                    life: 25,
                    maxLife: 25,
                    alpha: 1,
                    emoji: emoji,
                    size: 14
                });
            }
        }
    }

    // ===== RENDERER =====
    class GameRenderer {
        constructor(ctx, width, height) {
            this.ctx = ctx;
            this.width = width;
            this.height = height;
        }

        drawSlope(slopeOffset) {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            // Snow gradient background
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#e8f4fd');
            grad.addColorStop(0.3, '#d4ecf7');
            grad.addColorStop(1, '#f0f8ff');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Slope lines (perspective effect)
            ctx.strokeStyle = 'rgba(180, 210, 235, 0.3)';
            ctx.lineWidth = 1;
            const lineSpacing = 50;
            const offset = slopeOffset % lineSpacing;

            for (let y = -lineSpacing + offset; y < h + lineSpacing; y += lineSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Side markers (trees at the edges)
            const treeSpacing = 80;
            const treeOffset = slopeOffset % treeSpacing;
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            for (let y = -treeSpacing + treeOffset; y < h; y += treeSpacing) {
                ctx.globalAlpha = 0.4;
                ctx.fillText('🌲', 12, y);
                ctx.fillText('🌲', w - 12, y);
                ctx.globalAlpha = 1;
            }

            // Snow sparkle dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 15; i++) {
                const sx = ((i * 73 + slopeOffset * 0.3) % w);
                const sy = ((i * 137 + slopeOffset * 0.7) % h);
                const sparkleSize = 1.5 + Math.sin(slopeOffset * 0.02 + i) * 1;
                ctx.beginPath();
                ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawPlayer(player) {
            const ctx = this.ctx;
            const { x, y, invincibleTimer, starTimer, cocoaTimer } = player;

            // Trail
            for (const t of player.trailParticles) {
                ctx.globalAlpha = t.alpha;
                ctx.fillStyle = '#cce5ff';
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Player glow if powered up
            if (starTimer > 0) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20;
                ctx.font = '14px serif';
                for (let i = 0; i < 3; i++) {
                    const angle = (Date.now() / 200 + i * 2.1) % (Math.PI * 2);
                    ctx.fillText('⭐', x + Math.cos(angle) * 25, y + Math.sin(angle) * 25);
                }
                ctx.shadowBlur = 0;
            }

            if (cocoaTimer > 0) {
                ctx.shadowColor = '#8B4513';
                ctx.shadowBlur = 15;
            }

            // Blink if invincible (hit)
            if (invincibleTimer > 0 && Math.floor(invincibleTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }

            // Draw the snowboarder
            ctx.font = `${player.width}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏂', x, y);

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        drawObstacles(obstacles, slopeOffset) {
            const ctx = this.ctx;

            for (const ob of obstacles) {
                ctx.save();
                ctx.translate(ob.x, ob.y);

                // Cute wobble animation
                const wobbleX = Math.sin(ob.wobble) * 3;
                ctx.translate(wobbleX, 0);

                // Shadow
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(0, ob.size / 2 + 5, ob.size / 2.5, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Powerup/collectible glow
                if (ob.isPowerup) {
                    ctx.shadowColor = ob.type === 'invincible' ? '#ffd700' : ob.type === 'speed' ? '#8B4513' : '#ff6b6b';
                    ctx.shadowBlur = 15;
                } else if (ob.isCollectible) {
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 10;
                }

                ctx.font = `${ob.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ob.emoji, 0, 0);

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }

        drawParticles(particles) {
            const ctx = this.ctx;
            for (const p of particles) {
                ctx.globalAlpha = p.alpha;
                ctx.font = `${p.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.emoji, p.x, p.y);
            }
            ctx.globalAlpha = 1;
        }

        drawHUD(player, offsetX) {
            const ctx = this.ctx;
            const x = offsetX + 10;

            // Score
            ctx.fillStyle = '#1a365d';
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${player.name}`, x, 10);

            ctx.font = '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#2d5a8c';
            ctx.fillText(`Score: ${player.score}`, x, 32);
            ctx.fillText(`${Math.floor(player.distance)}m`, x, 50);

            // Lives as hearts
            ctx.font = '18px serif';
            for (let i = 0; i < player.lives; i++) {
                ctx.fillText('❤️', x + i * 22, 70);
            }

            // Powerup indicators
            let indicatorY = 95;
            if (player.starTimer > 0) {
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#b8860b';
                ctx.fillText(`⭐ ${Math.ceil(player.starTimer / 60)}s`, x, indicatorY);
                indicatorY += 18;
            }
            if (player.cocoaTimer > 0) {
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#8B4513';
                ctx.fillText(`☕ ${Math.ceil(player.cocoaTimer / 60)}s`, x, indicatorY);
            }
        }

        drawGameOver(player) {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            ctx.fillStyle = 'rgba(0, 0, 30, 0.6)';
            ctx.fillRect(0, 0, w, h);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = '32px serif';
            ctx.fillText('😵', w / 2, h / 2 - 50);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
            ctx.fillText('Wipeout!', w / 2, h / 2 - 10);

            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ccc';
            ctx.fillText(`${player.name}: ${player.score} pts`, w / 2, h / 2 + 20);
            ctx.fillText(`Distance: ${Math.floor(player.distance)}m`, w / 2, h / 2 + 42);
        }
    }

    // ===== MAIN GAME CLASS =====
    class MountainShredGame {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.mode = null; // 'single' or 'versus'
            this.players = [];
            this.renderers = [];
            this.running = false;
            this.animFrame = null;
            this.gameOverShown = false;
            this.keys = {};
            this.highScore = parseInt(localStorage.getItem('shredHighScore') || '0');
        }

        init() {
            const section = document.getElementById('shred-game');
            if (!section) return;

            // Button listeners
            document.getElementById('btn-single')?.addEventListener('click', () => this.startGame('single'));
            document.getElementById('btn-versus')?.addEventListener('click', () => this.startGame('versus'));
            document.getElementById('btn-restart')?.addEventListener('click', () => this.restart());
            document.getElementById('btn-back-menu')?.addEventListener('click', () => this.showMenu());

            // Keyboard
            window.addEventListener('keydown', e => {
                this.keys[e.key] = true;
                // Prevent scrolling when playing
                if (this.running && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', e => { this.keys[e.key] = false; });
        }

        startGame(mode) {
            this.mode = mode;
            this.gameOverShown = false;

            const container = document.getElementById('game-container');
            const menu = document.getElementById('game-menu');
            const gameOver = document.getElementById('game-over-screen');
            if (!container) return;

            menu.style.display = 'none';
            gameOver.style.display = 'none';
            container.style.display = 'block';

            // Setup canvas
            this.canvas = document.getElementById('shred-canvas');
            this.ctx = this.canvas.getContext('2d');

            const gameWrapper = container.parentElement;
            const totalWidth = Math.min(gameWrapper.offsetWidth, 900);
            this.canvas.width = totalWidth;
            this.canvas.height = Math.min(500, window.innerHeight * 0.55);

            this.players = [];
            this.renderers = [];

            if (mode === 'single') {
                const pw = this.canvas.width;
                const ph = this.canvas.height;
                const p = new Player(pw, ph, 'Shredder', '#38bdf8');
                this.players.push(p);
                this.renderers.push(new GameRenderer(this.ctx, pw, ph));
            } else {
                const pw = Math.floor(this.canvas.width / 2);
                const ph = this.canvas.height;
                const p1 = new Player(pw, ph, 'Player 1 (WASD)', '#38bdf8');
                const p2 = new Player(pw, ph, 'Player 2 (Arrows)', '#c084fc');
                this.players.push(p1, p2);
                this.renderers.push(new GameRenderer(this.ctx, pw, ph));
                this.renderers.push(new GameRenderer(this.ctx, pw, ph));
            }

            this.running = true;
            this.gameLoop();
        }

        restart() {
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.startGame(this.mode);
        }

        showMenu() {
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.running = false;
            const container = document.getElementById('game-container');
            const menu = document.getElementById('game-menu');
            const gameOver = document.getElementById('game-over-screen');
            container.style.display = 'none';
            gameOver.style.display = 'none';
            menu.style.display = '';
        }

        handleInput() {
            if (this.mode === 'single') {
                const p = this.players[0];
                p.moveLeft = this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'];
                p.moveRight = this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'];
                p.moveUp = this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'];
                p.moveDown = this.keys['s'] || this.keys['S'] || this.keys['ArrowDown'];
            } else {
                // Player 1: WASD
                const p1 = this.players[0];
                p1.moveLeft = this.keys['a'] || this.keys['A'];
                p1.moveRight = this.keys['d'] || this.keys['D'];
                p1.moveUp = this.keys['w'] || this.keys['W'];
                p1.moveDown = this.keys['s'] || this.keys['S'];

                // Player 2: Arrow keys
                const p2 = this.players[1];
                p2.moveLeft = this.keys['ArrowLeft'];
                p2.moveRight = this.keys['ArrowRight'];
                p2.moveUp = this.keys['ArrowUp'];
                p2.moveDown = this.keys['ArrowDown'];
            }
        }

        gameLoop() {
            if (!this.running) return;

            this.handleInput();

            // Update players
            for (const p of this.players) {
                p.update();
            }

            // Render
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.mode === 'single') {
                const r = this.renderers[0];
                const p = this.players[0];
                r.drawSlope(p.slopeOffset);
                r.drawObstacles(p.obstacles, p.slopeOffset);
                r.drawPlayer(p);
                r.drawParticles(p.particles);
                r.drawHUD(p, 0);

                if (!p.alive) {
                    r.drawGameOver(p);
                    if (!this.gameOverShown) {
                        this.gameOverShown = true;
                        this.showGameOverScreen();
                    }
                }
            } else {
                const halfW = Math.floor(this.canvas.width / 2);

                for (let i = 0; i < 2; i++) {
                    const r = this.renderers[i];
                    const p = this.players[i];
                    const offsetX = i * halfW;

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.rect(offsetX, 0, halfW, this.canvas.height);
                    this.ctx.clip();
                    this.ctx.translate(offsetX, 0);

                    r.drawSlope(p.slopeOffset);
                    r.drawObstacles(p.obstacles, p.slopeOffset);
                    r.drawPlayer(p);
                    r.drawParticles(p.particles);
                    r.drawHUD(p, 0);

                    if (!p.alive) {
                        r.drawGameOver(p);
                    }

                    this.ctx.restore();
                }

                // Divider line
                this.ctx.save();
                this.ctx.strokeStyle = '#1a365d';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([8, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(halfW, 0);
                this.ctx.lineTo(halfW, this.canvas.height);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.restore();

                // Both dead?
                if (!this.players[0].alive && !this.players[1].alive && !this.gameOverShown) {
                    this.gameOverShown = true;
                    this.showGameOverScreen();
                }
            }

            this.animFrame = requestAnimationFrame(() => this.gameLoop());
        }

        showGameOverScreen() {
            setTimeout(() => {
                this.running = false;
                if (this.animFrame) cancelAnimationFrame(this.animFrame);

                const gameOver = document.getElementById('game-over-screen');
                const resultsDiv = document.getElementById('game-results');
                if (!gameOver || !resultsDiv) return;

                let html = '';

                if (this.mode === 'single') {
                    const p = this.players[0];
                    if (p.score > this.highScore) {
                        this.highScore = p.score;
                        localStorage.setItem('shredHighScore', String(this.highScore));
                        html = `
                            <div class="game-result-title">🏆 New High Score!</div>
                            <div class="game-result-score">${p.score}</div>
                            <div class="game-result-detail">Distance: ${Math.floor(p.distance)}m</div>
                        `;
                    } else {
                        html = `
                            <div class="game-result-title">❄️ Wipeout!</div>
                            <div class="game-result-score">${p.score}</div>
                            <div class="game-result-detail">Distance: ${Math.floor(p.distance)}m</div>
                            <div class="game-result-detail">High Score: ${this.highScore}</div>
                        `;
                    }
                } else {
                    const p1 = this.players[0];
                    const p2 = this.players[1];
                    const winner = p1.score > p2.score ? p1 : p2.score > p1.score ? p2 : null;

                    html = `
                        <div class="game-result-title">${winner ? `🥇 ${winner.name} Wins!` : '🤝 It\'s a Tie!'}</div>
                        <div class="versus-scores">
                            <div class="vs-player ${p1.score >= p2.score ? 'winner' : ''}">
                                <span class="vs-name">Player 1</span>
                                <span class="vs-score">${p1.score}</span>
                                <span class="vs-dist">${Math.floor(p1.distance)}m</span>
                            </div>
                            <div class="vs-divider">VS</div>
                            <div class="vs-player ${p2.score >= p1.score ? 'winner' : ''}">
                                <span class="vs-name">Player 2</span>
                                <span class="vs-score">${p2.score}</span>
                                <span class="vs-dist">${Math.floor(p2.distance)}m</span>
                            </div>
                        </div>
                    `;
                }

                resultsDiv.innerHTML = html;
                gameOver.style.display = 'flex';

                // Fire confetti for the winner
                if (window.fireConfetti) {
                    window.fireConfetti(window.innerWidth / 2, window.innerHeight / 3);
                }
            }, 1500);
        }
    }

    // ===== AUTO-INIT =====
    const game = new MountainShredGame();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => game.init());
    } else {
        game.init();
    }
})();
