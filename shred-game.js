// ===== MOUNTAIN SHRED — Wolfenstein 3D-Style First-Person Snowboard Game =====
// Raycasting-inspired pseudo-3D engine with billboard sprites

(function () {
    'use strict';

    // ===== CONFIG =====
    const CFG = {
        fov: 60,              // Field of view in degrees
        maxDist: 40,          // Max render distance (world units)
        spawnDist: 38,        // Where obstacles spawn
        playerZ: 2,           // Camera Z position
        laneWidth: 12,        // Total width of the slope
        baseFallSpeed: 0.15,  // Starting speed (world units/frame)
        maxFallSpeed: 0.45,
        speedIncrease: 0.00003,
        lives: 3,
        invincibleFrames: 90,
        starDuration: 300,
        cocoaDuration: 180,
        cocoaBoost: 1.5,
        obstacleInterval: 40,
        minObstacleInterval: 18,
        hitboxRadius: 0.6,
    };

    // ===== OBSTACLE TYPES =====
    const OBS_TYPES = {
        TREE: { name: 'Pine Tree', color: '#1a5c1a', trunkColor: '#5c3a1a', w: 1.2, h: 2.5, points: 0 },
        ROCK: { name: 'Rock', color: '#607080', trunkColor: null, w: 1.4, h: 1.0, points: 0 },
        BEAR: { name: 'Bear', color: '#6B3A2A', trunkColor: null, w: 1.3, h: 1.5, points: 0 },
        MOOSE: { name: 'Moose', color: '#5C4033', trunkColor: null, w: 1.5, h: 1.8, points: 0 },
        PENGUIN: { name: 'Penguin', color: '#1a1a2e', trunkColor: '#f0f0f0', w: 0.8, h: 1.2, points: 0 },
        SNOWMAN: { name: 'Snowman', color: '#e8e8f0', trunkColor: '#f08020', w: 1.0, h: 1.8, points: 0 },
        COIN: { name: 'Coin', color: '#FFD700', trunkColor: null, w: 0.6, h: 0.6, points: 10, isCollectible: true },
        GEM: { name: 'Gem', color: '#00FFCC', trunkColor: null, w: 0.5, h: 0.5, points: 50, isCollectible: true },
        COCOA: { name: 'Hot Cocoa', color: '#8B4513', trunkColor: null, w: 0.6, h: 0.8, isPowerup: true, type: 'speed' },
        STAR: { name: 'Star', color: '#FFD700', trunkColor: null, w: 0.7, h: 0.7, isPowerup: true, type: 'invincible' },
        HEART: { name: 'Extra Life', color: '#FF4444', trunkColor: null, w: 0.6, h: 0.6, isPowerup: true, type: 'life' },
    };

    const OBSTACLE_POOL = ['TREE', 'TREE', 'TREE', 'ROCK', 'ROCK', 'BEAR', 'MOOSE', 'PENGUIN', 'SNOWMAN', 'TREE'];
    const POWERUP_POOL = ['COCOA', 'STAR', 'HEART'];
    const COLLECT_POOL = ['COIN', 'COIN', 'GEM'];

    // ===== RENDERER =====
    class Renderer {
        constructor(ctx, w, h) {
            this.ctx = ctx;
            this.w = w;
            this.h = h;
            this.horizon = Math.floor(h * 0.38); // Horizon line
            this.fovRad = CFG.fov * Math.PI / 180;

            // Pre-compute mountain heights
            this.mountainHeights = [];
            for (let x = 0; x < w; x++) {
                const nx = x / w;
                this.mountainHeights.push(
                    Math.sin(nx * 8) * 15 +
                    Math.sin(nx * 15 + 2) * 8 +
                    Math.sin(nx * 25 + 5) * 5 +
                    Math.cos(nx * 12 + 1) * 10
                );
            }
        }

        clear() {
            this.ctx.clearRect(0, 0, this.w, this.h);
        }

        // --- SKY ---
        renderSky(slopeOffset) {
            const ctx = this.ctx;
            const h = this.horizon;

            // Sky gradient
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#0a1628');    // Deep night blue at top
            grad.addColorStop(0.3, '#1a3050');  // Dark blue
            grad.addColorStop(0.6, '#3a6090');  // Medium blue
            grad.addColorStop(0.85, '#7ab0d0'); // Light blue
            grad.addColorStop(1, '#c0daf0');    // Pale near horizon
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.w, h + 10);

            // Sun
            const sunX = this.w * 0.75;
            const sunY = h * 0.25;
            const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
            sunGrad.addColorStop(0, 'rgba(255,240,200,0.9)');
            sunGrad.addColorStop(0.3, 'rgba(255,200,100,0.4)');
            sunGrad.addColorStop(1, 'rgba(255,200,100,0)');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(sunX - 80, sunY - 80, 160, 160);

            // Mountains — 3 layers with parallax
            const layers = [
                { offset: slopeOffset * 0.01, height: 40, color: '#4a6080', yBase: h - 5 },
                { offset: slopeOffset * 0.025, height: 55, color: '#354a60', yBase: h },
                { offset: slopeOffset * 0.05, height: 35, color: '#253545', yBase: h + 5 },
            ];

            for (const layer of layers) {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(0, layer.yBase);
                for (let x = 0; x < this.w; x++) {
                    const idx = Math.floor((x + layer.offset * 100) % this.w);
                    const mh = this.mountainHeights[Math.abs(idx) % this.w] * (layer.height / 15);
                    ctx.lineTo(x, layer.yBase - Math.abs(mh));
                }
                ctx.lineTo(this.w, layer.yBase);
                ctx.closePath();
                ctx.fill();

                // Snow caps on nearest layer
                if (layer === layers[1]) {
                    ctx.fillStyle = 'rgba(220,235,255,0.6)';
                    ctx.beginPath();
                    ctx.moveTo(0, layer.yBase);
                    for (let x = 0; x < this.w; x++) {
                        const idx = Math.floor((x + layer.offset * 100) % this.w);
                        const mh = this.mountainHeights[Math.abs(idx) % this.w] * (layer.height / 15);
                        const peak = layer.yBase - Math.abs(mh);
                        ctx.lineTo(x, peak + Math.abs(mh) * 0.15);
                    }
                    ctx.lineTo(this.w, layer.yBase);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // --- FLOOR (Perspective Snow Ground) ---
        renderFloor(slopeOffset, speed) {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            const horizon = this.horizon;
            const floorH = h - horizon;

            // Scanline-by-scanline perspective floor
            for (let y = horizon; y < h; y++) {
                const screenY = y - horizon;
                const ratio = screenY / floorH;

                // Distance for this scanline (perspective divide)
                const dist = 0.5 / (ratio + 0.001);

                // World Z coordinate (scrolling with player)
                const worldZ = dist + slopeOffset * 0.15;

                // Grid lines
                const gridZ = worldZ % 3.0;
                const isZLine = gridZ < 0.15;

                // X expansion (wider at bottom)
                const expansion = dist * 0.3;

                // Color based on distance (fog)
                const fog = Math.min(1, dist / 12);
                const baseR = 230, baseG = 240, baseB = 255;
                const fogR = 180, fogG = 210, fogB = 240;

                let r = Math.floor(baseR * (1 - fog) + fogR * fog);
                let g = Math.floor(baseG * (1 - fog) + fogG * fog);
                let b = Math.floor(baseB * (1 - fog) + fogB * fog);

                if (isZLine) {
                    r = Math.floor(r * 0.85);
                    g = Math.floor(g * 0.88);
                    b = Math.floor(b * 0.92);
                }

                // Edge shadows (slope edges)
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(0, y, w, 1);
            }

            // Edge tree line hints
            const treeLineWidth = 25;
            const leftGrad = ctx.createLinearGradient(0, 0, treeLineWidth, 0);
            leftGrad.addColorStop(0, 'rgba(20,50,20,0.7)');
            leftGrad.addColorStop(1, 'rgba(20,50,20,0)');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, horizon, treeLineWidth, floorH);

            const rightGrad = ctx.createLinearGradient(w - treeLineWidth, 0, w, 0);
            rightGrad.addColorStop(0, 'rgba(20,50,20,0)');
            rightGrad.addColorStop(1, 'rgba(20,50,20,0.7)');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(w - treeLineWidth, horizon, treeLineWidth, floorH);

            // Snow sparkles
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            for (let i = 0; i < 20; i++) {
                const sx = ((i * 73 + slopeOffset * 2.3) % w);
                const sy = horizon + ((i * 137 + slopeOffset * 5.1) % floorH);
                const sparkle = 1 + Math.sin(slopeOffset * 0.1 + i * 3) * 0.8;
                if (sparkle > 0.5) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, sparkle, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // --- SPRITES (Billboard) ---
        renderSprites(sprites, playerX, cameraShake) {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            const horizon = this.horizon;
            const halfW = w / 2;

            // Sort by Z (far to near)
            const sorted = sprites.filter(s => s.z > 0.1 && s.z < CFG.maxDist)
                .sort((a, b) => b.z - a.z);

            for (const sprite of sorted) {
                // Project to screen
                const scale = 3.5 / sprite.z;
                const screenX = halfW + (sprite.x - playerX) * scale * (w * 0.12) + (cameraShake || 0);
                const spriteH = sprite.def.h * scale * h * 0.35;
                const spriteW = sprite.def.w * scale * h * 0.35;

                // Screen Y: sits on the ground plane
                const groundY = horizon + (h - horizon) * (1 - 1 / (sprite.z * 0.5 + 1));
                const screenY = groundY - spriteH;

                // Off screen? Skip
                if (screenX + spriteW / 2 < 0 || screenX - spriteW / 2 > w) continue;

                // Fog alpha
                const fog = Math.max(0.1, 1 - sprite.z / CFG.maxDist);

                ctx.save();
                ctx.globalAlpha = fog;

                const type = sprite.typeName;
                const def = sprite.def;
                const cx = screenX;
                const cy = screenY + spriteH;
                const sw = spriteW;
                const sh = spriteH;

                this.drawSpriteShape(ctx, type, def, cx, cy, sw, sh, sprite);

                ctx.restore();
            }
        }

        drawSpriteShape(ctx, type, def, cx, cy, sw, sh, sprite) {
            if (type === 'TREE') {
                // Trunk
                ctx.fillStyle = def.trunkColor;
                ctx.fillRect(cx - sw * 0.08, cy - sh * 0.4, sw * 0.16, sh * 0.4);
                // Foliage layers
                const greens = ['#0d3d0d', '#1a5c1a', '#247a24'];
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = greens[i];
                    const layerW = sw * (1 - i * 0.25);
                    const layerY = cy - sh * 0.3 - i * sh * 0.25;
                    const layerH = sh * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(cx, layerY - layerH);
                    ctx.lineTo(cx - layerW / 2, layerY);
                    ctx.lineTo(cx + layerW / 2, layerY);
                    ctx.closePath();
                    ctx.fill();
                }
                // Snow on top
                ctx.fillStyle = '#e0ecff';
                ctx.beginPath();
                ctx.moveTo(cx, cy - sh - 2);
                ctx.lineTo(cx - sw * 0.12, cy - sh * 0.8);
                ctx.lineTo(cx + sw * 0.12, cy - sh * 0.8);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'ROCK') {
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.moveTo(cx - sw * 0.4, cy);
                ctx.lineTo(cx - sw * 0.3, cy - sh * 0.7);
                ctx.lineTo(cx + sw * 0.1, cy - sh);
                ctx.lineTo(cx + sw * 0.4, cy - sh * 0.6);
                ctx.lineTo(cx + sw * 0.45, cy);
                ctx.closePath();
                ctx.fill();
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.moveTo(cx - sw * 0.1, cy - sh * 0.5);
                ctx.lineTo(cx + sw * 0.1, cy - sh);
                ctx.lineTo(cx + sw * 0.3, cy - sh * 0.6);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'BEAR' || type === 'MOOSE') {
                // Body
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.ellipse(cx, cy - sh * 0.35, sw * 0.35, sh * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.ellipse(cx, cy - sh * 0.75, sw * 0.2, sh * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(cx - sw * 0.08, cy - sh * 0.78, sw * 0.04, 0, Math.PI * 2);
                ctx.arc(cx + sw * 0.08, cy - sh * 0.78, sw * 0.04, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(cx - sw * 0.08, cy - sh * 0.78, sw * 0.02, 0, Math.PI * 2);
                ctx.arc(cx + sw * 0.08, cy - sh * 0.78, sw * 0.02, 0, Math.PI * 2);
                ctx.fill();
                if (type === 'MOOSE') {
                    // Antlers
                    ctx.strokeStyle = def.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cx - sw * 0.15, cy - sh * 0.9);
                    ctx.lineTo(cx - sw * 0.3, cy - sh * 1.1);
                    ctx.moveTo(cx + sw * 0.15, cy - sh * 0.9);
                    ctx.lineTo(cx + sw * 0.3, cy - sh * 1.1);
                    ctx.stroke();
                }
            } else if (type === 'PENGUIN') {
                // Body
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.ellipse(cx, cy - sh * 0.4, sw * 0.3, sh * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Belly
                ctx.fillStyle = def.trunkColor;
                ctx.beginPath();
                ctx.ellipse(cx, cy - sh * 0.35, sw * 0.18, sh * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Beak
                ctx.fillStyle = '#f0a020';
                ctx.beginPath();
                ctx.moveTo(cx, cy - sh * 0.55);
                ctx.lineTo(cx - sw * 0.08, cy - sh * 0.48);
                ctx.lineTo(cx + sw * 0.08, cy - sh * 0.48);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'SNOWMAN') {
                // Three circles
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.arc(cx, cy - sh * 0.15, sw * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy - sh * 0.45, sw * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy - sh * 0.7, sw * 0.15, 0, Math.PI * 2);
                ctx.fill();
                // Nose
                ctx.fillStyle = def.trunkColor;
                ctx.beginPath();
                ctx.moveTo(cx, cy - sh * 0.7);
                ctx.lineTo(cx + sw * 0.2, cy - sh * 0.68);
                ctx.lineTo(cx, cy - sh * 0.66);
                ctx.closePath();
                ctx.fill();
            } else if (type === 'COIN' || type === 'GEM') {
                // Glowing collectible
                const glow = ctx.createRadialGradient(cx, cy - sh * 0.5, 0, cx, cy - sh * 0.5, sw);
                glow.addColorStop(0, def.color);
                glow.addColorStop(0.5, def.color + 'aa');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(cx - sw, cy - sh - sw * 0.5, sw * 2, sh + sw);

                ctx.fillStyle = def.color;
                ctx.beginPath();
                if (type === 'COIN') {
                    ctx.arc(cx, cy - sh * 0.5, sw * 0.4, 0, Math.PI * 2);
                } else {
                    // Diamond shape
                    ctx.moveTo(cx, cy - sh);
                    ctx.lineTo(cx - sw * 0.3, cy - sh * 0.5);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx + sw * 0.3, cy - sh * 0.5);
                    ctx.closePath();
                }
                ctx.fill();
                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(cx - sw * 0.1, cy - sh * 0.6, sw * 0.1, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'COCOA' || type === 'STAR' || type === 'HEART') {
                // Powerup with pulsing glow
                const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
                const glow = ctx.createRadialGradient(cx, cy - sh * 0.5, 0, cx, cy - sh * 0.5, sw * 1.5);
                glow.addColorStop(0, def.color);
                glow.addColorStop(0.4 * pulse, def.color + '88');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(cx - sw * 1.5, cy - sh - sw, sw * 3, sh + sw * 2);

                ctx.fillStyle = def.color;
                if (type === 'STAR') {
                    this.drawStar(ctx, cx, cy - sh * 0.5, 5, sw * 0.35, sw * 0.15);
                } else if (type === 'HEART') {
                    this.drawHeart(ctx, cx, cy - sh * 0.5, sw * 0.35);
                } else {
                    // Cup
                    ctx.fillRect(cx - sw * 0.2, cy - sh * 0.8, sw * 0.4, sh * 0.6);
                    ctx.fillStyle = '#f0e0c0';
                    ctx.fillRect(cx - sw * 0.15, cy - sh * 0.75, sw * 0.3, sh * 0.15);
                }
            }

            // Shadow on ground
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 2, sw * 0.3, sh * 0.05 + 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        drawStar(ctx, cx, cy, points, outer, inner) {
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const r = i % 2 === 0 ? outer : inner;
                const a = (Math.PI / points) * i - Math.PI / 2;
                const x = cx + Math.cos(a) * r;
                const y = cy + Math.sin(a) * r;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }

        drawHeart(ctx, cx, cy, size) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + size * 0.4);
            ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size * 0.5, cy - size, cx, cy - size * 0.4);
            ctx.bezierCurveTo(cx + size * 0.5, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.4);
            ctx.fill();
        }

        // --- WEAPON (First-Person Snowboard — Looking Down at Your Feet) ---
        renderWeapon(tilt, speed, frameCount) {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;
            const cx = w / 2;
            const sway = Math.sin(frameCount * 0.08) * (speed * 5);
            const tx = tilt * 45 + sway;

            ctx.save();

            // === LEGS (thick, coming from behind camera) ===
            const legW = 50;
            const legGap = 30; // gap between legs
            const legTop = h - 160; // legs start high

            // Left leg — snow pants
            const llx = cx - legGap / 2 - legW / 2 + tx;
            ctx.fillStyle = '#1c1c3d';
            ctx.beginPath();
            ctx.moveTo(llx - legW * 0.7, h + 10);  // wide at bottom (off screen)
            ctx.lineTo(llx - legW * 0.3, legTop);   // narrow at top
            ctx.lineTo(llx + legW * 0.3, legTop);
            ctx.lineTo(llx + legW * 0.7, h + 10);
            ctx.closePath();
            ctx.fill();
            // pants seam
            ctx.strokeStyle = '#14142e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(llx, legTop);
            ctx.lineTo(llx, h + 10);
            ctx.stroke();

            // Right leg
            const rlx = cx + legGap / 2 + legW / 2 + tx;
            ctx.fillStyle = '#1c1c3d';
            ctx.beginPath();
            ctx.moveTo(rlx - legW * 0.7, h + 10);
            ctx.lineTo(rlx - legW * 0.3, legTop);
            ctx.lineTo(rlx + legW * 0.3, legTop);
            ctx.lineTo(rlx + legW * 0.7, h + 10);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#14142e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rlx, legTop);
            ctx.lineTo(rlx, h + 10);
            ctx.stroke();

            // Knee highlights (subtle)
            ctx.fillStyle = 'rgba(60,60,120,0.3)';
            ctx.beginPath();
            ctx.ellipse(llx, h - 110, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rlx, h - 110, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // === BOOTS (chunky snowboard boots) ===
            const bootW = 50;
            const bootH = 35;
            const bootY = h - 55;

            // Left boot
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(llx - bootW / 2, bootY + bootH);     // bottom left
            ctx.lineTo(llx - bootW / 2, bootY + 5);         // up left
            ctx.quadraticCurveTo(llx - bootW / 2, bootY - 5, llx - bootW / 4, bootY - 5); // top curve
            ctx.lineTo(llx + bootW / 4, bootY - 5);
            ctx.quadraticCurveTo(llx + bootW / 2, bootY - 5, llx + bootW / 2, bootY + 5);
            ctx.lineTo(llx + bootW / 2, bootY + bootH);
            ctx.closePath();
            ctx.fill();
            // Boot sole
            ctx.fillStyle = '#333';
            ctx.fillRect(llx - bootW / 2, bootY + bootH - 6, bootW, 6);
            // Boot lacing
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const ly = bootY + 3 + i * 9;
                ctx.beginPath();
                ctx.moveTo(llx - 10, ly);
                ctx.lineTo(llx + 10, ly);
                ctx.stroke();
            }

            // Right boot
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(rlx - bootW / 2, bootY + bootH);
            ctx.lineTo(rlx - bootW / 2, bootY + 5);
            ctx.quadraticCurveTo(rlx - bootW / 2, bootY - 5, rlx - bootW / 4, bootY - 5);
            ctx.lineTo(rlx + bootW / 4, bootY - 5);
            ctx.quadraticCurveTo(rlx + bootW / 2, bootY - 5, rlx + bootW / 2, bootY + 5);
            ctx.lineTo(rlx + bootW / 2, bootY + bootH);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(rlx - bootW / 2, bootY + bootH - 6, bootW, 6);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const ly = bootY + 3 + i * 9;
                ctx.beginPath();
                ctx.moveTo(rlx - 10, ly);
                ctx.lineTo(rlx + 10, ly);
                ctx.stroke();
            }

            // === SNOWBOARD (wide, foreshortened perspective) ===
            const boardY = h - 16;
            const boardNear = 170;  // width at bottom (near camera)
            const boardFar = 130;   // width at top (far from camera)
            const boardH = 24;

            ctx.save();
            ctx.translate(cx + tx, boardY);
            ctx.rotate(tilt * 0.06);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.moveTo(-boardNear / 2 + 5, boardH + 4);
            ctx.lineTo(-boardFar / 2 + 5, -4);
            ctx.lineTo(boardFar / 2 + 5, -4);
            ctx.lineTo(boardNear / 2 + 5, boardH + 4);
            ctx.closePath();
            ctx.fill();

            // Board body (trapezoid — perspective)
            const bGrad = ctx.createLinearGradient(0, -boardH / 2, 0, boardH);
            bGrad.addColorStop(0, '#0d2847');
            bGrad.addColorStop(0.5, '#1a4a7a');
            bGrad.addColorStop(1, '#0d2847');
            ctx.fillStyle = bGrad;

            // Rounded trapezoid shape
            ctx.beginPath();
            ctx.moveTo(-boardFar / 2 + 10, 0);
            ctx.quadraticCurveTo(-boardFar / 2 - 5, 0, -boardNear / 2 - 5, boardH / 2); // left tip
            ctx.quadraticCurveTo(-boardNear / 2 - 5, boardH, -boardNear / 2 + 10, boardH);
            ctx.lineTo(boardNear / 2 - 10, boardH);
            ctx.quadraticCurveTo(boardNear / 2 + 5, boardH, boardNear / 2 + 5, boardH / 2); // right tip
            ctx.quadraticCurveTo(boardNear / 2 + 5, 0, boardFar / 2 - 10, 0);
            ctx.closePath();
            ctx.fill();

            // Metal edge
            ctx.strokeStyle = '#5aa8d8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Top surface sheen
            const sheen = ctx.createLinearGradient(0, 0, 0, boardH);
            sheen.addColorStop(0, 'rgba(120,200,255,0.15)');
            sheen.addColorStop(0.3, 'rgba(255,255,255,0.05)');
            sheen.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = sheen;
            ctx.fill();

            // Center stripe graphic
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.moveTo(-boardFar / 2 + 30, boardH / 2 - 3);
            ctx.lineTo(boardFar / 2 - 30, boardH / 2 - 3);
            ctx.lineTo(boardNear / 2 - 30, boardH / 2 + 3);
            ctx.lineTo(-boardNear / 2 + 30, boardH / 2 + 3);
            ctx.closePath();
            ctx.fill();

            // Brand name
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SHRED', 0, boardH / 2);

            // Binding plates
            const bindW = 35, bindH = 20;
            // Left binding
            ctx.fillStyle = 'rgba(40,40,40,0.8)';
            ctx.beginPath();
            ctx.roundRect(-50 - bindW / 2, boardH / 2 - bindH / 2, bindW, bindH, 3);
            ctx.fill();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-50 - bindW / 2 + 3, boardH / 2 - bindH / 2 + 3, bindW - 6, 4);
            ctx.strokeRect(-50 - bindW / 2 + 3, boardH / 2 + 3, bindW - 6, 4);

            // Right binding
            ctx.fillStyle = 'rgba(40,40,40,0.8)';
            ctx.beginPath();
            ctx.roundRect(50 - bindW / 2, boardH / 2 - bindH / 2, bindW, bindH, 3);
            ctx.fill();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(50 - bindW / 2 + 3, boardH / 2 - bindH / 2 + 3, bindW - 6, 4);
            ctx.strokeRect(50 - bindW / 2 + 3, boardH / 2 + 3, bindW - 6, 4);

            ctx.restore();

            // === SNOW SPRAY when carving ===
            if (Math.abs(tilt) > 0.15) {
                const dir = tilt > 0 ? -1 : 1;
                ctx.fillStyle = 'rgba(220,240,255,0.5)';
                for (let i = 0; i < 12; i++) {
                    const sx = cx + dir * (130 + Math.random() * 60) + tx;
                    const sy = h - 10 + Math.random() * 15;
                    const sz = 1.5 + Math.random() * 4;
                    ctx.beginPath();
                    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        // --- SPEED LINES ---
        renderSpeedLines(speed, frameCount) {
            if (speed < 0.2) return;
            const ctx = this.ctx;
            const intensity = (speed - 0.2) / 0.3;
            ctx.strokeStyle = `rgba(255,255,255,${0.15 * intensity})`;
            ctx.lineWidth = 2;

            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dist = this.w * 0.35;
                const len = 30 + intensity * 40;
                const cx = this.w / 2 + Math.cos(angle) * dist;
                const cy = this.h / 2 + Math.sin(angle) * dist * 0.6;
                const offset = (frameCount * speed * 20 + i * 50) % len;

                ctx.beginPath();
                ctx.moveTo(
                    cx + Math.cos(angle) * offset,
                    cy + Math.sin(angle) * offset * 0.6
                );
                ctx.lineTo(
                    cx + Math.cos(angle) * (offset + len),
                    cy + Math.sin(angle) * (offset + len) * 0.6
                );
                ctx.stroke();
            }
        }

        // --- DAMAGE FLASH ---
        renderDamageFlash(intensity) {
            if (intensity <= 0) return;
            const ctx = this.ctx;
            ctx.fillStyle = `rgba(255,0,0,${intensity * 0.4})`;
            ctx.fillRect(0, 0, this.w, this.h);
        }

        // --- HUD ---
        renderHUD(player, highScore) {
            const ctx = this.ctx;
            const w = this.w;

            // Semi-transparent bar at top
            ctx.fillStyle = 'rgba(0,0,20,0.5)';
            ctx.fillRect(0, 0, w, 42);
            ctx.fillStyle = 'rgba(100,160,255,0.15)';
            ctx.fillRect(0, 42, w, 1);

            ctx.textBaseline = 'middle';

            // Score
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`SCORE ${String(player.score).padStart(6, '0')}`, 12, 16);

            // Distance
            ctx.fillStyle = '#8cf';
            ctx.font = '13px "Courier New", monospace';
            ctx.fillText(`${Math.floor(player.distance)}m`, 12, 34);

            // Lives (hearts)
            ctx.textAlign = 'right';
            ctx.font = '16px serif';
            for (let i = 0; i < player.lives; i++) {
                ctx.fillText('❤️', w - 12 - i * 22, 16);
            }

            // Speed bar
            const speedRatio = (player.speed - CFG.baseFallSpeed) / (CFG.maxFallSpeed - CFG.baseFallSpeed);
            const barW = 100;
            const barX = w - barW - 12;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(barX, 30, barW, 8);
            const speedColor = speedRatio > 0.7 ? '#f44' : speedRatio > 0.4 ? '#fa0' : '#4f4';
            ctx.fillStyle = speedColor;
            ctx.fillRect(barX, 30, barW * Math.min(1, speedRatio), 8);
            ctx.fillStyle = '#aaa';
            ctx.font = '9px "Courier New", monospace';
            ctx.fillText('SPEED', barX - 4, 35);

            // Powerup indicators
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Courier New"';
            if (player.starTimer > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`⭐ INVINCIBLE ${Math.ceil(player.starTimer / 60)}s`, w / 2, 16);
            } else if (player.cocoaTimer > 0) {
                ctx.fillStyle = '#DEB887';
                ctx.fillText(`☕ SPEED BOOST ${Math.ceil(player.cocoaTimer / 60)}s`, w / 2, 16);
            }

            // High score
            if (highScore > 0) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#666';
                ctx.font = '10px "Courier New"';
                ctx.fillText(`HI ${highScore}`, w / 2, 36);
            }
        }

        // --- GAME OVER ---
        renderGameOver(player) {
            const ctx = this.ctx;
            const w = this.w;
            const h = this.h;

            ctx.fillStyle = 'rgba(0,0,20,0.7)';
            ctx.fillRect(0, 0, w, h);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 36px "Courier New", monospace';
            ctx.fillText('WIPEOUT!', w / 2, h / 2 - 40);

            ctx.fillStyle = '#fff';
            ctx.font = '18px "Courier New", monospace';
            ctx.fillText(`SCORE: ${player.score}`, w / 2, h / 2 + 10);
            ctx.fillStyle = '#8cf';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`DISTANCE: ${Math.floor(player.distance)}m`, w / 2, h / 2 + 35);
        }
    }

    // ===== GAME =====
    class FPSSnowboardGame {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.renderer = null;
            this.running = false;
            this.animFrame = null;
            this.gameOverShown = false;
            this.keys = {};
            this.highScore = parseInt(localStorage.getItem('shredHighScore') || '0');

            // Player state
            this.player = null;
            // World objects
            this.sprites = [];
        }

        init() {
            const section = document.getElementById('shred-game');
            if (!section) return;

            document.getElementById('btn-single')?.addEventListener('click', () => this.startGame('single'));
            document.getElementById('btn-versus')?.addEventListener('click', () => this.startGame('versus'));
            document.getElementById('btn-restart')?.addEventListener('click', () => this.restart());
            document.getElementById('btn-back-menu')?.addEventListener('click', () => this.showMenu());

            window.addEventListener('keydown', e => {
                this.keys[e.key] = true;
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

            this.canvas = document.getElementById('shred-canvas');
            this.ctx = this.canvas.getContext('2d');

            const gameWrapper = container.parentElement;
            const totalWidth = Math.min(gameWrapper.offsetWidth, 900);
            this.canvas.width = totalWidth;
            this.canvas.height = Math.min(500, window.innerHeight * 0.55);

            // Disable image smoothing for retro pixel look
            this.ctx.imageSmoothingEnabled = false;

            this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height);

            // Init player
            this.player = {
                x: 0,            // World X position (centered = 0)
                speed: CFG.baseFallSpeed,
                score: 0,
                distance: 0,
                lives: CFG.lives,
                invincibleTimer: 0,
                starTimer: 0,
                cocoaTimer: 0,
                alive: true,
                frameCount: 0,
                tilt: 0,         // Visual lean (-1 to 1)
                damageFlash: 0,
                nextSpawnFrame: 20,
                moveLeft: false,
                moveRight: false,
            };

            this.sprites = [];

            // Spawn initial tree corridors
            for (let z = 5; z < CFG.maxDist; z += 3) {
                this.sprites.push(this.makeSprite('TREE', -CFG.laneWidth / 2 - 1.5 + Math.random() * 0.5, z));
                this.sprites.push(this.makeSprite('TREE', CFG.laneWidth / 2 + 1.5 - Math.random() * 0.5, z));
            }

            this.running = true;
            this.gameLoop();
        }

        makeSprite(typeName, x, z) {
            return {
                typeName,
                def: OBS_TYPES[typeName],
                x,
                z,
                active: true,
            };
        }

        restart() {
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.startGame(this.mode);
        }

        showMenu() {
            if (this.animFrame) cancelAnimationFrame(this.animFrame);
            this.running = false;
            document.getElementById('game-container').style.display = 'none';
            document.getElementById('game-over-screen').style.display = 'none';
            document.getElementById('game-menu').style.display = '';
        }

        handleInput() {
            const p = this.player;
            p.moveLeft = this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'];
            p.moveRight = this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'];
        }

        update() {
            const p = this.player;
            if (!p.alive) return;

            p.frameCount++;
            p.distance += p.speed * 10;

            // Acceleration
            p.speed = Math.min(CFG.maxFallSpeed, p.speed + CFG.speedIncrease);

            // Cocoa boost
            if (p.cocoaTimer > 0) {
                p.cocoaTimer--;
                p.speed = Math.min(CFG.maxFallSpeed * 1.3, p.speed * CFG.cocoaBoost);
            }

            // Timers
            if (p.invincibleTimer > 0) p.invincibleTimer--;
            if (p.starTimer > 0) p.starTimer--;
            if (p.damageFlash > 0) p.damageFlash -= 0.05;

            // Movement (world X)
            const moveSpeed = 0.18;
            const maxX = CFG.laneWidth / 2 - 0.5;
            if (p.moveLeft) {
                p.x = Math.max(-maxX, p.x - moveSpeed);
                p.tilt = Math.max(-1, p.tilt - 0.1);
            } else if (p.moveRight) {
                p.x = Math.min(maxX, p.x + moveSpeed);
                p.tilt = Math.min(1, p.tilt + 0.1);
            } else {
                p.tilt *= 0.85; // Recenter
            }

            // Move all sprites toward camera
            for (let i = this.sprites.length - 1; i >= 0; i--) {
                const s = this.sprites[i];
                s.z -= p.speed;

                // Remove if behind camera
                if (s.z < -1) {
                    if (!s.def.isPowerup && !s.def.isCollectible && !s.scored) {
                        p.score += 5; // Points for dodging
                        s.scored = true;
                    }
                    this.sprites.splice(i, 1);
                    continue;
                }

                // Collision check (only if close)
                if (s.z > 0 && s.z < 2.5 && s.active) {
                    const dx = Math.abs(s.x - p.x);
                    if (dx < CFG.hitboxRadius && s.z < 1.5) {
                        if (s.def.isCollectible) {
                            p.score += s.def.points;
                            s.active = false;
                            this.sprites.splice(i, 1);
                        } else if (s.def.isPowerup) {
                            this.applyPowerup(s.def.type);
                            s.active = false;
                            this.sprites.splice(i, 1);
                        } else if (p.invincibleTimer <= 0 && p.starTimer <= 0) {
                            this.hit();
                            s.active = false;
                            this.sprites.splice(i, 1);
                        } else if (p.starTimer > 0) {
                            p.score += 20;
                            s.active = false;
                            this.sprites.splice(i, 1);
                        }
                    }
                }
            }

            // Spawn obstacles
            if (p.frameCount >= p.nextSpawnFrame) {
                this.spawnObstacle();
                const interval = Math.max(CFG.minObstacleInterval, CFG.obstacleInterval - p.distance * 0.003);
                p.nextSpawnFrame = p.frameCount + interval + Math.random() * 15;
            }

            // Re-spawn corridor trees
            const maxTreeZ = Math.max(...this.sprites.filter(s => s.typeName === 'TREE' && Math.abs(s.x) > CFG.laneWidth / 2).map(s => s.z), 0);
            if (maxTreeZ < CFG.maxDist - 3) {
                for (let z = maxTreeZ + 3; z < CFG.maxDist; z += 3) {
                    this.sprites.push(this.makeSprite('TREE', -CFG.laneWidth / 2 - 1.5 + Math.random() * 0.5, z));
                    this.sprites.push(this.makeSprite('TREE', CFG.laneWidth / 2 + 1.5 - Math.random() * 0.5, z));
                }
            }
        }

        spawnObstacle() {
            const rand = Math.random();
            let typeName;
            if (rand < 0.10) {
                typeName = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
            } else if (rand < 0.30) {
                typeName = COLLECT_POOL[Math.floor(Math.random() * COLLECT_POOL.length)];
            } else {
                typeName = OBSTACLE_POOL[Math.floor(Math.random() * OBSTACLE_POOL.length)];
            }

            const x = (Math.random() - 0.5) * (CFG.laneWidth - 2);
            this.sprites.push(this.makeSprite(typeName, x, CFG.spawnDist + Math.random() * 5));
        }

        hit() {
            const p = this.player;
            p.lives--;
            p.invincibleTimer = CFG.invincibleFrames;
            p.damageFlash = 1;

            if (p.lives <= 0) {
                p.alive = false;
            }
        }

        applyPowerup(type) {
            if (type === 'speed') this.player.cocoaTimer = CFG.cocoaDuration;
            else if (type === 'invincible') this.player.starTimer = CFG.starDuration;
            else if (type === 'life') this.player.lives = Math.min(this.player.lives + 1, 5);
        }

        render() {
            const r = this.renderer;
            const p = this.player;

            r.clear();
            r.renderSky(p.distance);
            r.renderFloor(p.distance, p.speed);
            r.renderSprites(this.sprites, p.x, p.invincibleTimer > 0 ? (Math.random() - 0.5) * 4 : 0);
            r.renderWeapon(p.tilt, p.speed, p.frameCount);
            r.renderSpeedLines(p.speed, p.frameCount);
            r.renderDamageFlash(p.damageFlash);

            // Invincibility blink
            if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 5) % 2 === 0) {
                this.ctx.fillStyle = 'rgba(100,200,255,0.08)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Star glow
            if (p.starTimer > 0) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.03 + 0.05;
                this.ctx.fillStyle = `rgba(255,215,0,${pulse})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            r.renderHUD(p, this.highScore);

            if (!p.alive) {
                r.renderGameOver(p);
                if (!this.gameOverShown) {
                    this.gameOverShown = true;
                    this.showGameOverScreen();
                }
            }
        }

        gameLoop() {
            if (!this.running) return;
            this.handleInput();
            this.update();
            this.render();
            this.animFrame = requestAnimationFrame(() => this.gameLoop());
        }

        showGameOverScreen() {
            setTimeout(() => {
                this.running = false;
                if (this.animFrame) cancelAnimationFrame(this.animFrame);

                const gameOver = document.getElementById('game-over-screen');
                const resultsDiv = document.getElementById('game-results');
                if (!gameOver || !resultsDiv) return;

                const p = this.player;
                let html;
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

                resultsDiv.innerHTML = html;
                gameOver.style.display = 'flex';

                if (window.fireConfetti) {
                    window.fireConfetti(window.innerWidth / 2, window.innerHeight / 3);
                }
            }, 1500);
        }
    }

    // ===== AUTO-INIT =====
    const game = new FPSSnowboardGame();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => game.init());
    } else {
        game.init();
    }
})();
