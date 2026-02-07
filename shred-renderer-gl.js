/**
 * WebGL2 Renderer for Mountain Shred
 * GPU-accelerated graphics with WASM particle physics
 */

const SHADERS = {
    // === BACKGROUND (SKY + MOUNTAINS) ===
    sky: {
        vs: `#version 300 es
        in vec2 position;
        out vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.999, 1.0); // Far plane
        }`,
        fs: `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform float uTime;
        uniform float uSlopeOffset;
        out vec4 fragColor;

        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(float x) {
            float i = floor(x);
            float f = fract(x);
            float u = f * f * (3.0 - 2.0 * f);
            return mix(hash(i), hash(i + 1.0), u);
        }

        float fbm(float x, int octaves) {
            float v = 0.0;
            float a = 0.5;
            float shift = 0.0;
            for (int i = 0; i < 5; i++) {
                if(i >= octaves) break;
                v += a * noise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            // SKY GRADIENT
            vec3 colorTop = vec3(0.05, 0.1, 0.4); // Deep blue
            vec3 colorBot = vec3(0.6, 0.8, 0.99); // Icy cyan
            
            // Horizon is at y=0.5 in screen space roughly
            float h = smoothstep(0.4, 1.0, vUv.y);
            vec3 sky = mix(colorBot, colorTop, h);
            
            // SUN GLOW
            float sun = 1.0 - distance(vUv, vec2(0.5, 0.8));
            sky += vec3(0.3, 0.2, 0.05) * smoothstep(0.9, 1.0, sun);

            vec3 col = sky;

            // MOUNTAIN LAYERS (Parallax)
            float layers[3];
            layers[0] = 0.55; // Far
            layers[1] = 0.50; // Mid
            layers[2] = 0.45; // Near
            
            vec3 layerCols[3];
            layerCols[0] = vec3(0.6, 0.7, 0.95);
            layerCols[1] = vec3(0.4, 0.5, 0.75);
            layerCols[2] = vec3(0.25, 0.35, 0.6);

            for(int i = 0; i < 3; i++) {
                float speed = 0.0005 + float(i)*0.001;
                // Parallax based on slope offset (player movement)
                float x = (vUv.x + uSlopeOffset * speed * 0.05) * (5.0 + float(i)*3.0);
                float baseH = layers[i];
                float m = fbm(x, 3+i) * 0.15;
                
                if (vUv.y < baseH + m) {
                    float fog = smoothstep(baseH + m, baseH - 0.2, vUv.y);
                    col = mix(layerCols[i], col, fog * 0.5);
                    col = mix(col, layerCols[i], 1.0 - fog); // Solid at bottom
                }
            }
            
            fragColor = vec4(col, 1.0);
        }`
    },

    // === SLOPE (3D PLANE) ===
    slope: {
        vs: `#version 300 es
        in vec2 position;
        out vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5; 
            // We draw a full screen quad, but in FS we only draw bottom half
            gl_Position = vec4(position, 0.99, 1.0);
        }`,
        fs: `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform float uTime;
        uniform float uSlopeOffset;
        out vec4 fragColor;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

        void main() {
            // Horizon line
            float horizon = 0.45;
            if (vUv.y > horizon) discard;

            // Project screen Y to World Z (Depth)
            // Near bottom (y=-1) is Z=0, Horizon (y=0) is Z=inf
            // Simple projection: Z = 1 / (horizon - vUv.y)
            float dist = 0.2 / (horizon - vUv.y);
            
            // Project screen X to World X
            float width = dist * 8.0;
            float worldX = (vUv.x - 0.5) * width;
            float worldZ = dist * 20.0 + uSlopeOffset * 0.2; // Move forward

            // Grid lines
            float gridZ = fract(worldZ);
            float gridX = fract(worldX);
            
            float lineZ = smoothstep(0.9, 0.95, gridZ);
            float lineX = smoothstep(0.95, 0.98, gridX) + smoothstep(0.05, 0.02, gridX);
            
            vec3 snow = vec3(0.95, 0.98, 1.0);
            
            // Sparkles
            float sparkle = hash(floor(vec2(worldX, worldZ)*2.0));
            float glint = step(0.98, sparkle) * (0.5 + 0.5*sin(uTime * 10.0 + sparkle*100.0));

            vec3 col = mix(snow, vec3(0.8, 0.9, 1.0), max(lineZ, lineX) * 0.2);
            col += vec3(glint);

            // Fog / Draw Distance
            float fog = smoothstep(0.0, 5.0, dist);
            col = mix(col, vec3(0.6, 0.8, 0.95), fog);

            fragColor = vec4(col, 1.0);
        }`
    },

    // === PARTICLES (BILLBOARDED 3D) ===
    particles: {
        vs: `#version 300 es
        layout(location = 0) in vec2 aPosition; // x, y (Y is height in 3D?) No, Y is distance
        layout(location = 1) in vec2 aVelocity; 
        layout(location = 2) in float aLife;    
        layout(location = 3) in float aMaxLife; 
        layout(location = 4) in float aSize;    
        layout(location = 5) in float aType;    
        
        uniform vec2 uResolution;
        uniform float uSlopeOffset; // To move particles relative to world
        
        out float vLife;
        out float vMaxLife;
        out float vType;
        out vec2 vUV;
        out float vDepth;

        const vec2 corners[4] = vec2[](
            vec2(-0.5, -0.5), vec2(0.5, -0.5),
            vec2(-0.5, 0.5), vec2(0.5, 0.5)
        );

        void main() {
            vec2 offset = corners[gl_VertexID % 4];
            vUV = offset * 2.0;
            
            // MAPPING 2D GAME TO 3D
            // Game X -> World X
            // Game Y -> World Z (Depth/Distance)
            // Game has player fixed at Y ~ 400. Objects move UP in Y (decreasing Y value coming down?)
            // Actually in Game: Player Y is fixed ~420. Obstacles Y increases (fall down screen).
            // We need to invert this mechanism for 3D logic usually, but let's map:
            // World Z = (GameObject.Y - Player.Y) * Scale
            
            // BUT: The WASM engine and JS game logic are 2D.
            // Let's interpret aPosition.y as 'Distance from Camera'.
            // In 2D game, things fall DOWN (y increases). Player is at bottom.
            // Wait, standard canvas: 0 is top, Height is bottom.
            // Player is at Height-80. Obstacles spawns at -50 and Y increases.
            // So: Distance = (PlayerY - ObjectY).
            // If ObjectY = -50 (top), Distance is Large (Far).
            // If ObjectY = PlayerY, Distance is 0 (Close).
            
            float playerY = uResolution.y - 80.0;
            float worldZ = (playerY - aPosition.y) * 0.02; // Scale down for 3D depth
            
            // If behind camera
            if (worldZ < -1.0) {
                 gl_Position = vec4(0.0, 0.0, 2.0, 1.0); // Clip
                 return;
            }

            // X Mapping: Center is canvasWidth/2
            float worldX = (aPosition.x - uResolution.x * 0.5) * 0.02;

            // Perspective Projection
            // y = height / z. Objects are on ground (y=0) or flying (Snow)
            // Let's simulate height based on type
            float worldY = 0.0; 
            if (aType < 1.0) worldY = 2.0 + sin(aPosition.x)*1.0; // Snow falls from sky? 
            // Actually snow just overlays screen usually. 
            // enhancing: Snow particles are world space.
            if (aType < 0.5) { // Snow
                 worldY = 1.0 + mod(aPosition.y, 5.0); 
                 worldZ = mod(worldZ, 10.0); // Wrap around for infinite snow field?
                 // Let's stick to screen space for snow for now? No, 3D snow is cooler.
                 worldY = 0.0 + (aPosition.y / uResolution.y) * 4.0; 
                 // This is tricky without changing WASM. 
                 // fallback: Map directly to screen quad for snow?
            }
            // Sparkles/Hits are on ground
            
            // Simple Perspective:
            float fov = 1.0;
            float scale = fov / max(0.1, worldZ);
            
            vec2 screenPos = vec2(worldX * scale, (worldY - 1.0) * scale); 
            // -1.0 Y offset to put camera above ground
            
            // Aspect ratio correction
            float aspect = uResolution.x / uResolution.y;
            screenPos.x /= aspect;
            
            // Horizon offset
            screenPos.y += 0.2; 

            // Billboard Size
            float size = aSize * 0.01 * scale;
            if (aType < 0.5) size *= 0.5; // Smaller snow

            gl_Position = vec4(screenPos + offset * size, worldZ * 0.1, 1.0);
            
            vLife = aLife;
            vMaxLife = aMaxLife;
            vType = aType;
            vDepth = worldZ;
            
            // Fade particles too close
            if (worldZ < 0.5) vLife *= worldZ * 2.0;
        }`,
        fs: `#version 300 es
        precision highp float;
        in float vLife;
        in float vMaxLife;
        in float vType;
        in vec2 vUV;
        in float vDepth;
        out vec4 fragColor;

        void main() {
            float dist = length(vUV);
            if (dist > 1.0) discard;

            float alpha = smoothstep(1.0, 0.5, dist);
            vec3 col = vec3(1.0);

            if (vType < 0.5) { // Snow
                col = vec3(0.9, 0.95, 1.0);
                alpha *= 0.6 * min(vLife, 1.0);
            } else if (vType < 1.5) { // Trail
                col = vec3(0.8, 0.9, 1.0);
                alpha *= 0.4 * (vLife / vMaxLife);
            } else if (vType < 2.5) { // Burst
                col = vec3(0.9, 0.95, 1.0);
                alpha *= 0.8 * (vLife / vMaxLife);
            } else if (vType < 3.5) { // Sparkle
                col = vec3(1.0, 0.9, 0.4);
                alpha *= (vLife / vMaxLife);
                float star = max(0.0, 1.0 - abs(vUV.x*vUV.y)*10.0); 
                alpha += star;
            } else { // Hit
                col = vec3(1.0, 0.3, 0.3);
                alpha *= (vLife / vMaxLife);
            }

            // Distance fog
            alpha *= smoothstep(20.0, 10.0, vDepth);

            fragColor = vec4(col, alpha);
        }`
    },

    // === 3D SPRITES (Player, Obstacles) ===
    sprites: {
        vs: `#version 300 es
        in vec2 position;
        
        uniform vec2 uResolution;
        uniform vec2 uPos;       // Game X, Y
        uniform float uSize;     
        uniform float uRotation; 
        uniform float uWobble;   
        uniform int uType;       
        
        out vec2 vUv;
        out float vType;
        out float vWobble;
        out float vDepth;

        void main() {
            vUv = position * 2.0; 
            vType = float(uType);
            vWobble = uWobble;

            // 3D PROJECTION
            // Similar to particles:
            // Game X -> World X
            // Game Y -> World Z
            
            float playerY = uResolution.y - 80.0;
            // The object's Y is its position on the 2D track.
            // If uPos.y < PlayerY (above), it is Far Away.
            // Logic: Distance = (PlayerY - uPos.y)
            // But wait, in 2D game, obstacles fall down (y increases).
            // If ObstacleY = 0 (top), it's far. 
            // If ObstacleY = PlayerY, it's close.
            
            float worldZ = (playerY - uPos.y) * 0.025;
            
            // X Mapping
            float worldX = (uPos.x - uResolution.x * 0.5) * 0.025;
            
            // Player Special Case
            // Player is always at fixed Z relative to camera
            if (uType == 0) {
                worldZ = 1.5; // Fixed distance from camera
                worldX = (uPos.x - uResolution.x * 0.5) * 0.02; // Less parallax for player
            }

            // Perspective
            float fov = 1.2;
            float scale = fov / max(0.1, worldZ);
            
            // Y Position (Height)
            // Player acts as camera target? No, Camera follows player X
            // Let's keep camera centered X.
            // So WorldX is real offset.
            
            // Bounce/Jump effect?
            float worldY = 0.0;
            if (uType == 0) worldY = 0.0; // Player on ground

            vec2 screenPos = vec2(worldX * scale, (worldY - 1.2) * scale);
            
            // Aspect
            float aspect = uResolution.x / uResolution.y;
            screenPos.x /= aspect;
            
            // Horizon
            screenPos.y += 0.3; // Horizon Line height

            // Billboard Size
            float displaySize = uSize * 0.008 * scale;
            
            gl_Position = vec4(screenPos + position * displaySize, worldZ*0.01, 1.0);
            vDepth = worldZ;
        }`,
        fs: `#version 300 es
        precision highp float;
        in vec2 vUv;
        in float vType;
        in float vWobble;
        in float vDepth;
        out vec4 fragColor;

        // SDF Primitives
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        
        float sdBox(vec2 p, vec2 b) {
            vec2 d = abs(p) - b;
            return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        
        float sdTri(vec2 p, float r) {
            const float k = sqrt(3.0);
            p.x = abs(p.x) - r;
            p.y = p.y + r/k;
            if(p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y)/2.0;
            p.x -= clamp(p.x, -2.0*r, 0.0);
            return -length(p) * sign(p.y);
        }

        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
            vec2 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }

        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }

        void main() {
            vec3 col = vec3(0.0);
            float alpha = 0.0;
            int type = int(vType + 0.5);

            if (type == 0) { // PLAYER - HUMANIZED
                // Adjust coordinates for the new model
                vec2 p = vUv + vec2(0.0, 0.5); // Shift up to align board with previous anchor
                
                // Animation / Wobble effect for dynamic feel
                float lean = -sin(vWobble) * 0.1; 
                
                // 1. Snowboard (Bottom)
                vec2 boardP = p - vec2(0.0, -1.2);
                float board = sdBox(boardP, vec2(1.1, 0.12)); // Board deck
                
                // Bindings
                float bindings = sdBox(p - vec2(-0.4, -1.1), vec2(0.15, 0.05));
                bindings = min(bindings, sdBox(p - vec2(0.4, -1.1), vec2(0.15, 0.05)));

                // 2. Legs (Pants) - Squatting stance for snowboarding
                // Knees bent outward slightly
                float legL = sdCapsule(p, vec2(-0.4, -1.1), vec2(-0.25, -0.5), 0.18);
                float legR = sdCapsule(p, vec2(0.4, -1.1), vec2(0.25, -0.5), 0.18);
                float legs = smin(legL, legR, 0.15);

                // 3. Torso (Jacket)
                float torso = sdCapsule(p, vec2(0.0, -0.5), vec2(0.0, 0.2), 0.24);
                float bodyKey = smin(legs, torso, 0.1);

                // 4. Arms - Out for balance
                float armL = sdCapsule(p, vec2(-0.15, 0.15), vec2(-0.6, -0.2), 0.12);
                float armR = sdCapsule(p, vec2(0.15, 0.15), vec2(0.6, -0.2), 0.12);
                float upperBody = smin(bodyKey, smin(armL, armR, 0.1), 0.05);

                // 5. Head & Neck
                float head = sdCircle(p - vec2(0.0, 0.55), 0.22);
                float neck = sdCapsule(p, vec2(0.0, 0.2), vec2(0.0, 0.5), 0.15);
                float fullBody = smin(upperBody, neck, 0.1);

                // Scarf logic
                float scarfShape = sdCapsule(p, vec2(0.1, 0.35), vec2(0.6 + lean*2.0, 0.4 + lean), 0.08);

                // --- Drawing Layers ---

                // Draw Body (Jacket + Pants)
                if (fullBody < 0.0) {
                    // Pants (Lower)
                    if (p.y < -0.4) {
                        col = vec3(0.15, 0.16, 0.2); // Dark Tech Pants
                        // Knee reinforcement
                        if (sdCircle(p - vec2(-0.3, -0.8), 0.08) < 0.0) col *= 0.8;
                        if (sdCircle(p - vec2(0.3, -0.8), 0.08) < 0.0) col *= 0.8;
                    } else {
                        // Jacket (Upper)
                        col = vec3(0.9, 0.35, 0.1); // High-vis Orange Jacket
                        // Zipper detail
                        if (abs(p.x) < 0.02) col = vec3(0.1);
                    }
                    alpha = 1.0;
                }

                // Draw Head (Helmet + Goggles)
                if (head < 0.0) {
                    col = vec3(0.2, 0.2, 0.22); // Matte Black Helmet
                    // Goggles
                    float goggles = sdBox(p - vec2(0.0, 0.55), vec2(0.16, 0.06));
                    if (goggles < 0.0) {
                        col = vec3(1.0, 0.7, 0.1); // Amber lens
                        // Goggle Reflection
                        col += vec3(0.9) * step(0.0, p.x + p.y - 0.5) * 0.5; 
                    }
                    alpha = 1.0;
                }

                // Draw Scarf
                if (scarfShape < 0.0) {
                    col = vec3(0.8, 0.1, 0.1); 
                    alpha = 1.0;
                }

                // Draw Board
                if (board < 0.0) {
                    col = vec3(0.1, 0.5, 0.8); // Cyan/Blue Board
                    // Board graphic stripe
                    if (abs(p.x) < 0.15) col = vec3(0.9); 
                    alpha = 1.0;
                }
                
                // Draw Bindings
                if (bindings < 0.0) {
                    col = vec3(0.1); // Black bindings
                    alpha = 1.0;
                }

            } else if (type == 1) { // TREE
                float t = sdTri(vUv, 0.7);
                float trunk = sdBox(vUv - vec2(0.0, -0.7), vec2(0.1, 0.3));
                if (trunk < 0.0) { col = vec3(0.4, 0.2, 0.0); alpha = 1.0; }
                else if (t < 0.0) { col = vec3(0.1, 0.35, 0.1) * (0.8 + vUv.y*0.4); alpha = 1.0; }
            } else if (type == 2) { // ROCK
                 if (length(vUv) < 0.7) { col = vec3(0.5); alpha=1.0; }
            } else if (type == 3) { // BEAR
                 if (length(vUv) < 0.6) { col = vec3(0.4, 0.2, 0.1); alpha=1.0; } 
            } else if (type == 4) { // COIN
                 if (abs(length(vUv)-0.6) < 0.1) { col = vec3(1.0, 0.8, 0.0); alpha=1.0; }
            } else if (type == 5) { // POWERUP
                 if (sdBox(vUv, vec2(0.5)) < 0.0) { col = vec3(0.0, 0.5, 1.0); alpha=1.0; }
            }

            if (alpha < 0.01) discard;
            
            // Fog on distant sprites
            float fog = smoothstep(15.0, 5.0, vDepth);
            col = mix(vec3(0.7, 0.8, 0.9), col, fog);
            alpha *= fog;

            fragColor = vec4(col, alpha);
        }`
    }
};

class WebGLGameRenderer {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
        if (!this.gl) {
            console.error("WebGL2 not supported");
            throw new Error("WebGL2 not supported");
        }

        this.width = width;
        this.height = height;
        this.resize(width, height);

        // Blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.shaders = {};
        this.buffers = {};

        this.initShaders();
        this.initBuffers();

        // Particle System data (Float32Array view from WASM memory will be passed here)
        this.particleData = null;
    }

    initShaders() {
        const gl = this.gl;

        const compile = (src, type) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const createProgram = (name, vsSrc, fsSrc) => {
            const vs = compile(vsSrc, gl.VERTEX_SHADER);
            const fs = compile(fsSrc, gl.FRAGMENT_SHADER);
            const prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error("Program link error:", gl.getProgramInfoLog(prog));
                return null;
            }
            return prog;
        };

        this.programs = {
            sky: createProgram('sky', SHADERS.sky.vs, SHADERS.sky.fs),
            slope: createProgram('slope', SHADERS.slope.vs, SHADERS.slope.fs),
            particles: createProgram('particles', SHADERS.particles.vs, SHADERS.particles.fs),
            sprite: createProgram('sprite', SHADERS.sprites.vs, SHADERS.sprites.fs),
        };
    }

    initBuffers() {
        const gl = this.gl;

        // Fullscreen Quad (for Sky/Slope)
        const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.quadVBA = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBA);
        gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

        this.quadVAO = gl.createVertexArray();
        gl.bindVertexArray(this.quadVAO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Particle Instancing Buffers
        this.particleVBO = gl.createBuffer(); // Dynamic data
        this.particleVAO = gl.createVertexArray();
        gl.bindVertexArray(this.particleVAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBO);

        // Stride is 32 bytes (8 floats: x, y, vx, vy, life, maxLife, size, type)
        const stride = 32;

        // Attribute 0: Position (x, y) - offset 0
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(0, 1); // Per instance

        // Attribute 1: Velocity (vx, vy) - offset 8 (skipped in shader but needed for alignment)
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
        gl.vertexAttribDivisor(1, 1);

        // Attribute 2: Life - offset 16
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16);
        gl.vertexAttribDivisor(2, 1);

        // Attribute 3: MaxLife - offset 20
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 20);
        gl.vertexAttribDivisor(3, 1);

        // Attribute 4: Size - offset 24
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 24);
        gl.vertexAttribDivisor(4, 1);

        // Attribute 5: Type - offset 28
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 28);
        gl.vertexAttribDivisor(5, 1);
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.width = w;
        this.height = h;
        this.gl.viewport(0, 0, w, h);
    }

    drawSlope(slopeOffset) {
        const gl = this.gl;
        const time = performance.now() / 1000;

        // 1. Draw Sky (Full screen)
        gl.useProgram(this.programs.sky);
        gl.uniform1f(gl.getUniformLocation(this.programs.sky, "uTime"), time);
        gl.uniform1f(gl.getUniformLocation(this.programs.sky, "uSlopeOffset"), slopeOffset);

        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // 2. Draw Slope (Bottom half via shader arithmetic)
        gl.useProgram(this.programs.slope);
        gl.uniform1f(gl.getUniformLocation(this.programs.slope, "uTime"), time);
        gl.uniform1f(gl.getUniformLocation(this.programs.slope, "uSlopeOffset"), slopeOffset);

        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Renders particles from WASM memory
    // instanceCount is returned from WASM exports.getAliveCount()
    drawParticles(wasmMemoryBuffer, instanceCount) {
        if (instanceCount === 0) return;

        const gl = this.gl;
        gl.useProgram(this.programs.particles);

        gl.uniform2f(gl.getUniformLocation(this.programs.particles, "uResolution"), this.width, this.height);

        gl.bindVertexArray(this.particleVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBO);

        // Upload dynamic data - only the active particles part of the buffer
        // memoryView should be a Float32Array View of the WASM memory
        const floatView = new Float32Array(wasmMemoryBuffer, 0, instanceCount * 8);
        gl.bufferData(gl.ARRAY_BUFFER, floatView, gl.DYNAMIC_DRAW);

        // Draw instanced
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
    }

    drawPlayer(player) {
        if (!player.alive) return;
        this.drawSprite({
            x: player.x,
            y: player.y,
            size: player.width * 1.5,
            rotation: player.moveLeft ? -0.1 : player.moveRight ? 0.1 : 0,
            wobble: player.frameCount * 0.1,
            type: 0 // Player
        });

        // Star power particles (handled by WASM, but we can add a glow here)
    }

    drawObstacles(obstacles) {
        for (const ob of obstacles) {
            let type = 1; // Default tree
            if (ob.emoji === '🌲') type = 1;
            else if (ob.emoji === '🪨') type = 2;
            else if (ob.emoji === '🐻' || ob.emoji === '🫎' || ob.emoji === '🐧') type = 3;
            else if (ob.isCollectible) type = 4;
            else if (ob.isPowerup) type = 5;

            this.drawSprite({
                x: ob.x,
                y: ob.y,
                size: ob.size * 1.5,
                rotation: ob.rotation || 0,
                wobble: ob.wobble || 0,
                type: type
            });
        }
    }

    drawSprite(s) {
        const gl = this.gl;
        gl.useProgram(this.programs.sprite);

        gl.uniform2f(gl.getUniformLocation(this.programs.sprite, "uResolution"), this.width, this.height);
        gl.uniform2f(gl.getUniformLocation(this.programs.sprite, "uPos"), s.x, s.y);
        gl.uniform1f(gl.getUniformLocation(this.programs.sprite, "uSize"), s.size);
        gl.uniform1f(gl.getUniformLocation(this.programs.sprite, "uRotation"), s.rotation);
        gl.uniform1f(gl.getUniformLocation(this.programs.sprite, "uWobble"), s.wobble);
        gl.uniform1i(gl.getUniformLocation(this.programs.sprite, "uType"), s.type);

        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    drawHUD(player, offsetX) {
        // We'll use a separate 2D canvas overlay for text to keep it crisp
        // This is handled by a second canvas in the HTML
    }

    drawGameOver(player) {
        // Simple dark overlay
        // Implementation logic handled by DOM elements or 2D overlay
    }
}

// Export to global scope
window.WebGLGameRenderer = WebGLGameRenderer;
