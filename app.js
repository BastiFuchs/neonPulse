// Game Config
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
const SHIP_RADIUS = 15;
const BASE_OBSTACLE_SPEED = 3.5;
const SPAWN_INTERVAL_BASE = 1200; // ms

const GALAXIES = {
    NEON: {
        name: 'Orion Pulse',
        color: '#00f0ff',
        accentColor: '#ff007f',
        description: 'Der klassische Cyber-Sektor mit strahlenden Nebelwolken.',
        speedMultiplier: 1.0,
        spawnRateMultiplier: 1.0,
        gridColor: 'rgba(0, 240, 255, 0.05)',
        droneFreq: 65.41, // C2
        difficulty: 'NORMAL',
        image: 'galaxy_orion.png',
        speedVal: 50, spawnVal: 40
    },
    TOXIC: {
        name: 'Viper Prime',
        color: '#39ff14',
        accentColor: '#ffff00',
        description: 'Hohes Tempo und giftige Strahlung – die giftigste aller Galaxien.',
        speedMultiplier: 1.55,
        spawnRateMultiplier: 1.25,
        gridColor: 'rgba(57, 255, 20, 0.05)',
        droneFreq: 73.42, // D2
        difficulty: 'SCHNELL',
        image: 'galaxy_viper.png',
        speedVal: 90, spawnVal: 65
    },
    INFERNO: {
        name: 'Helios Void',
        color: '#ff3300',
        accentColor: '#ffaa00',
        description: 'Aggressive Feuer-Horden aus dem Infernokern der Galaxis.',
        speedMultiplier: 1.3,
        spawnRateMultiplier: 1.6,
        gridColor: 'rgba(255, 51, 0, 0.05)',
        droneFreq: 55.00, // A1
        difficulty: 'SCHWER',
        image: 'galaxy_helios.png',
        speedVal: 75, spawnVal: 95
    },
    QUANTUM: {
        name: 'Cygnus Abyss',
        color: '#bd00ff',
        accentColor: '#0088ff',
        description: 'Verzerrte Raumzeit und quantisierte Dimensionssplitter.',
        speedMultiplier: 1.15,
        spawnRateMultiplier: 1.8,
        gridColor: 'rgba(189, 0, 255, 0.05)',
        droneFreq: 48.99, // G1
        difficulty: 'CHAOS',
        image: 'galaxy_cygnus.png',
        speedVal: 60, spawnVal: 100
    }
};

// Audio Controller using Web Audio API (No files needed)
class SoundController {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.droneOsc = null;
        this.droneGain = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    toggle() {
        this.init();
        this.enabled = !this.enabled;
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.enabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.enabled;
    }

    playStart() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playCollect() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        // Cute upward synth beep
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(880.00, now + 0.16); // A5
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playShieldCollect() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // A nice upward chord arpeggio for shield charge
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(440.00, now + 0.08); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.16); // C#5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.35); // A5
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playEmpSound() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Low sub-bass drop oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        // High frequency filter sweep
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
    }

    playLaserSound() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 1.2);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.2);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    playEnemyShoot() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playHit() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playExplosion() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Low pitch sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
        
        // Sad melody arpeggio in minor
        setTimeout(() => {
            if (!this.enabled) return;
            const sadNow = this.ctx.currentTime;
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(220, sadNow); // A3
            osc2.frequency.setValueAtTime(196, sadNow + 0.25); // G3
            osc2.frequency.setValueAtTime(174.61, sadNow + 0.5); // F3
            osc2.frequency.setValueAtTime(146.83, sadNow + 0.75); // D3
            gain2.gain.setValueAtTime(0.15, sadNow);
            gain2.gain.setValueAtTime(0.15, sadNow + 0.75);
            gain2.gain.exponentialRampToValueAtTime(0.001, sadNow + 1.2);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(sadNow);
            osc2.stop(sadNow + 1.2);
        }, 150);
    }

    startMusic() {
        if (!this.enabled || this.musicInterval) return;
        this.init();
        
        // Ensure AudioContext is running
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const tempo = 125;
        const stepTime = (60 / tempo) / 4; // 16th notes ~ 120ms

        // Cyberpunk synthwave bassline
        const scale = [65.41, 77.78, 87.31, 98.00, 116.54, 130.81]; // C2, Eb2, F2, G2, Bb2, C3
        const pattern = [
            0, null, 0, 5, 
            0, null, 4, 3, 
            0, null, 0, 5, 
            0, 1, 2, 4
        ];
        
        let step = 0;
        let nextNoteTime = this.ctx.currentTime + 0.1;

        const schedule = () => {
            if (!this.musicInterval && step !== 0) return; // Prevent extra scheduling
            const now = this.ctx.currentTime;
            
            while (nextNoteTime < now + 0.2) {
                const noteIndex = pattern[step];
                if (noteIndex !== null) {
                    const freq = scale[noteIndex];
                    
                    // Bass pluck
                    const osc = this.ctx.createOscillator();
                    const filter = this.ctx.createBiquadFilter();
                    const gain = this.ctx.createGain();
                    
                    osc.type = 'sawtooth';
                    osc.frequency.value = freq;
                    
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(100, nextNoteTime);
                    filter.frequency.exponentialRampToValueAtTime(800, nextNoteTime + 0.05);
                    filter.frequency.exponentialRampToValueAtTime(100, nextNoteTime + 0.2);
                    
                    gain.gain.setValueAtTime(0, nextNoteTime);
                    gain.gain.linearRampToValueAtTime(0.08, nextNoteTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.25);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start(nextNoteTime);
                    osc.stop(nextNoteTime + 0.3);
                }
                nextNoteTime += stepTime;
                step = (step + 1) % pattern.length;
            }
        };

        schedule();
        this.musicInterval = setInterval(schedule, 50);
        
        // Continuous Pad
        this.padOsc = this.ctx.createOscillator();
        this.padGain = this.ctx.createGain();
        this.padOsc.type = 'square';
        this.padOsc.frequency.value = 65.41; // C2
        
        this.padGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.padGain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 2);
        
        const padFilter = this.ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 300;
        
        this.padLfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        this.padLfo.frequency.value = 0.5; // 0.5 Hz wobble
        lfoGain.gain.value = 150;
        this.padLfo.connect(lfoGain);
        lfoGain.connect(padFilter.frequency);
        
        this.padOsc.connect(padFilter);
        padFilter.connect(this.padGain);
        this.padGain.connect(this.ctx.destination);
        
        this.padOsc.start();
        this.padLfo.start();
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        if (this.padOsc) {
            try { 
                this.padGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.padGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                setTimeout(() => { this.padOsc.stop(); }, 500); 
            } catch(e){}
            this.padOsc = null;
        }
        if (this.padLfo) {
            try { setTimeout(() => { this.padLfo.stop(); }, 500); } catch(e){}
            this.padLfo = null;
        }
    }
}

const sound = new SoundController();

// Game State Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neon_high_score')) || 0;
        
        // Player stats
        this.player = {
            x: canvasWidth / 2,
            y: canvasHeight * 0.75,
            targetX: canvasWidth / 2,
            targetY: canvasHeight * 0.75,
            radius: SHIP_RADIUS,
            lives: 3,
            maxLives: 3,
            trail: [],
            angle: -Math.PI / 2
        };
        
        // Game lists
        this.obstacles = [];
        this.orbs = [];
        this.shields = [];
        this.particles = [];
        
        // Grid background offset
        this.gridOffsetY = 0;
        this.offscreenGrid = document.createElement('canvas');
        this.offscreenGridCtx = this.offscreenGrid.getContext('2d');
        this.gridNeedsUpdate = true;
        
        // Dynamic Timings & Speed Modifiers
        this.obstacleSpeedMultiplier = 1.0;
        this.lastSpawnTime = 0;
        this.spawnInterval = SPAWN_INTERVAL_BASE;
        this.slowMoFactor = 1.0; // Time dilation modifier
        
        // Screen effects
        this.shakeIntensity = 0;
        this.slowMoRing = null; // { x, y, radius, alpha }
        this.damageFlash = 0;
        this.healFlash = 0;
        this.powerupFlash = 0;
        
        // EMP Attack stats
        this.empCharge = 0;
        this.empMaxCharge = 100;
        this.empWave = null; // { x, y, radius, maxRadius, alpha, speed }
        
        // Laser Attack stats
        this.laserCharge = 0;
        this.laserMaxCharge = 100;
        this.laserActive = false;
        this.laserTimer = 0;
        this.laserDuration = 90; // frames
        this.enemyProjectiles = [];
        
        // Event states
        this.keys = {};
        
        // Galaxy Selection State
        this.selectedGalaxy = 'NEON';
        this.galaxyKeys = ['NEON', 'TOXIC', 'INFERNO', 'QUANTUM'];
        this.currentGalaxyIndex = 0;

        // UI Elements
        this.hudHeader = document.getElementById('hudHeader');
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('high-score');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.menuTitle = document.getElementById('menuTitle');
        this.menuSubtitle = document.getElementById('menuSubtitle');
        this.statsSummary = document.getElementById('statsSummary');
        this.finalScoreEl = document.getElementById('finalScore');
        this.orbsCollectedEl = document.getElementById('orbsCollected');
        this.startBtn = document.getElementById('startBtn');
        this.toggleAudioBtn = document.getElementById('toggleAudioBtn');
        this.audioStatusText = document.getElementById('audioStatusText');
        this.audioOnIcon = document.querySelector('.audio-icon.on');
        this.audioOffIcon = document.querySelector('.audio-icon.off');
        
        // Floating HUD Buttons
        this.specialAttacksHud = document.getElementById('specialAttacksHud');
        this.empBtn = document.getElementById('empBtn');
        this.laserBtn = document.getElementById('laserBtn');
        this.empProgress = document.getElementById('empProgress');
        this.laserProgress = document.getElementById('laserProgress');
        
        // Galaxy Selector DOM Elements
        this.prevGalaxyBtn = document.getElementById('prevGalaxyBtn');
        this.nextGalaxyBtn = document.getElementById('nextGalaxyBtn');
        this.galaxyNameEl = document.getElementById('galaxyName');
        this.galaxyDifficultyEl = document.getElementById('galaxyDifficulty');
        this.galaxyDescriptionEl = document.getElementById('galaxyDescription');

        // Galaxy Viewer Stats DOM Elements
        this.viewerSpeed = document.getElementById('viewerSpeed');
        this.viewerSpawn = document.getElementById('viewerSpawn');

        // Leaderboard DOM Elements
        this.leaderboardBody = document.getElementById('leaderboardBody');
        this.leaderboardInputContainer = document.getElementById('leaderboardInputContainer');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.submitScoreBtn = document.getElementById('submitScoreBtn');

        // Pause Screen DOM Elements
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.pauseBtn    = document.getElementById('pauseBtn');
        this.resumeBtn   = document.getElementById('resumeBtn');
        this.quitBtn     = document.getElementById('quitBtn');
        this.pauseScore  = document.getElementById('pauseScore');
        this.pauseBest   = document.getElementById('pauseBest');
        this.toggleJoystickBtn = document.getElementById('toggleJoystickBtn');
        this.joystickContainer = document.getElementById('joystickContainer');
        this.joystickStick = document.getElementById('joystickStick');

        // Enemy Codex DOM Elements
        this.codexOverlay = document.getElementById('codexOverlay');
        this.closeCodexBtn = document.getElementById('closeCodexBtn');

        this.controlsHint = document.getElementById('controlsHint');

        // Joystick state
        this.joystickEnabled = localStorage.getItem('neon_joystick_enabled') === 'true';
        this.joystickActive = false;
        this.joystickStartPos = { x: 0, y: 0 };
        this.joystickCurPos = { x: 0, y: 0 };
        this.joystickMaxDist = 45;
        this.joystickVector = { x: 0, y: 0 };
        this.lastJoystickTapTime = 0;
        
        // Canvas click tracking
        this.lastCanvasClickTime = 0;
        this.canvasClickCount = 0;

        // Dash state
        this.dashActive = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDuration = 12; // frames
        this.dashSpeed = 15;
        this.dashVector = { x: 0, y: -1 };

        // Game details counters
        this.orbsCollectedCount = 0;
        
        this.initEventListeners();
        this.initJoystickEvents();
        this.checkFirstVisit();
        this.updateJoystickUI();
        this.updateGalaxyTheme(); // Initial theme setup
        this.updateUI();
        this.renderLeaderboard(); // Populate initial leaderboard
    }

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('neon_pulse_visited');
        if (!hasVisited) {
            if (this.codexOverlay) {
                this.codexOverlay.classList.remove('hidden');
            }
        }
    }

    initEventListeners() {
        // Close Codex
        if (this.closeCodexBtn) {
            this.closeCodexBtn.addEventListener('click', () => {
                if (this.codexOverlay) {
                    this.codexOverlay.classList.add('hidden');
                }
                localStorage.setItem('neon_pulse_visited', 'true');
            });
        }

        // Start game button
        this.startBtn.addEventListener('click', () => {
            if (this.state === 'MENU' || this.state === 'GAMEOVER') {
                this.startGame();
            }
        });

        // Galaxy Cycling
        this.prevGalaxyBtn.addEventListener('click', () => {
            this.currentGalaxyIndex = (this.currentGalaxyIndex - 1 + this.galaxyKeys.length) % this.galaxyKeys.length;
            this.selectedGalaxy = this.galaxyKeys[this.currentGalaxyIndex];
            this.updateGalaxyTheme();
        });

        this.nextGalaxyBtn.addEventListener('click', () => {
            this.currentGalaxyIndex = (this.currentGalaxyIndex + 1) % this.galaxyKeys.length;
            this.selectedGalaxy = this.galaxyKeys[this.currentGalaxyIndex];
            this.updateGalaxyTheme();
        });

        // Leaderboard Score Submit
        this.submitScoreBtn.addEventListener('click', () => {
            this.submitScore();
        });
        this.playerNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });

        const handleCanvasTap = (e) => {
            if (this.state !== 'PLAYING') return;
            // Only left mouse button or touch
            if (e.type === 'mousedown' && e.button !== 0) return;

            const now = performance.now();
            if (now - this.lastCanvasClickTime < 350) {
                this.canvasClickCount++;
            } else {
                this.canvasClickCount = 1;
            }
            this.lastCanvasClickTime = now;

            if (this.canvasClickCount === 2) {
                this.triggerEmp();
            } else if (this.canvasClickCount === 3) {
                this.triggerLaser();
                this.canvasClickCount = 0;
            }
        };

        this.canvas.addEventListener('mousedown', handleCanvasTap);

        // Right Click -> Still trigger Laser as fallback
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.state === 'PLAYING') {
                this.triggerLaser();
            }
        });

        // Floating HUD Buttons (for mobile or fast clicking)
        const handleEmpButton = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.state === 'PLAYING') {
                this.triggerEmp();
            }
        };
        this.empBtn.addEventListener('click', handleEmpButton);
        this.empBtn.addEventListener('touchstart', handleEmpButton, { passive: false });

        const handleLaserButton = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.state === 'PLAYING') {
                this.triggerLaser();
            }
        };
        this.laserBtn.addEventListener('click', handleLaserButton);
        this.laserBtn.addEventListener('touchstart', handleLaserButton, { passive: false });
        
        // Settings Toggle
        this.settingsToggleBtn = document.getElementById('settingsToggleBtn');
        this.settingsDropdown = document.getElementById('settingsDropdown');
        if (this.settingsToggleBtn && this.settingsDropdown) {
            this.settingsToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.settingsDropdown.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!this.settingsDropdown.contains(e.target) && e.target !== this.settingsToggleBtn) {
                    this.settingsDropdown.classList.remove('active');
                }
            });
        }

        // Audio Toggle Button
        this.toggleAudioBtn.addEventListener('click', () => {
            const isEnabled = sound.toggle();
            if (isEnabled) {
                this.audioOnIcon.classList.remove('hidden');
                this.audioOffIcon.classList.add('hidden');
                this.audioStatusText.textContent = "Ton an";
                if (this.state === 'PLAYING' || this.state === 'MENU' || this.state === 'GAMEOVER') {
                    sound.startMusic();
                }
            } else {
                this.audioOnIcon.classList.add('hidden');
                this.audioOffIcon.classList.remove('hidden');
                this.audioStatusText.textContent = "Ton aus";
            }
        });

        // Mouse Controls
        const handlePointerMove = (x, y) => {
            if (this.state !== 'PLAYING') return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = canvasWidth / (rect.width || canvasWidth);
            const scaleY = canvasHeight / (rect.height || canvasHeight);
            
            this.player.targetX = (x - rect.left) * scaleX;
            this.player.targetY = (y - rect.top) * scaleY;
            
            // Hard reset to prevent NaN propagation
            if (isNaN(this.player.targetX) || isNaN(this.player.targetY)) {
                this.player.targetX = canvasWidth / 2;
                this.player.targetY = canvasHeight * 0.75;
            }
            
            // Constrain to canvas boundaries
            this.player.targetX = Math.max(SHIP_RADIUS, Math.min(canvasWidth - SHIP_RADIUS, this.player.targetX));
            this.player.targetY = Math.max(SHIP_RADIUS, Math.min(canvasHeight - SHIP_RADIUS, this.player.targetY));
        };

        this.canvas.addEventListener('mousemove', (e) => {
            handlePointerMove(e.clientX, e.clientY);
        });

        // Touch Controls
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                e.preventDefault(); // Prevent page pull-to-refresh / scroll
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                e.preventDefault();
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                handleCanvasTap(e);
            }
        }, { passive: false });

        // Pause button in HUD
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                if (this.state === 'PLAYING') this.pauseGame();
            });
        }
        // Resume button in pause overlay
        if (this.resumeBtn) {
            this.resumeBtn.addEventListener('click', () => this.resumeGame());
        }

        // Toggle Joystick
        if (this.toggleJoystickBtn) {
            this.toggleJoystickBtn.addEventListener('click', () => {
                this.joystickEnabled = !this.joystickEnabled;
                localStorage.setItem('neon_joystick_enabled', this.joystickEnabled);
                this.updateJoystickUI();
            });
        }

        // Quit button in pause overlay
        if (this.quitBtn) {
            this.quitBtn.addEventListener('click', () => this.quitGame());
        }

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Pause / Resume toggle: Escape or P
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                    return;
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                    return;
                }
            }
            if (e.code === 'Space') {
                if (this.state === 'MENU' || this.state === 'GAMEOVER') {
                    this.startGame();
                } else if (this.state === 'PLAYING') {
                    this.triggerEmp();
                }
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
                if (this.state === 'PLAYING') {
                    this.triggerLaser();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Resize handler to maintain resolution
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    updateJoystickUI() {
        if (this.toggleJoystickBtn) {
            this.toggleJoystickBtn.textContent = `🕹 JOYSTICK: ${this.joystickEnabled ? 'AN' : 'AUS'}`;
            this.toggleJoystickBtn.classList.toggle('joystick-btn-active', this.joystickEnabled);
        }
        if (this.joystickContainer) {
            this.joystickContainer.classList.toggle('hidden', !this.joystickEnabled || (this.state !== 'PLAYING' && this.state !== 'PAUSED'));
            if (this.state !== 'PLAYING') {
                this.joystickContainer.classList.add('hidden');
            }
        }
    }

    initJoystickEvents() {
        if (!this.joystickContainer) return;

        const handleStart = (e) => {
            if (!this.joystickEnabled || this.state !== 'PLAYING') return;

            // Double tap detection for Dash
            const now = performance.now();
            if (now - this.lastJoystickTapTime < 300) {
                this.triggerDash();
            }
            this.lastJoystickTapTime = now;

            this.joystickActive = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.joystickContainer.getBoundingClientRect();
            this.joystickStartPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            handleMove(e);
        };

        const handleMove = (e) => {
            if (!this.joystickActive) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - this.joystickStartPos.x;
            const dy = touch.clientY - this.joystickStartPos.y;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            
            const moveDist = Math.min(dist, this.joystickMaxDist);
            this.joystickCurPos = {
                x: Math.cos(angle) * moveDist,
                y: Math.sin(angle) * moveDist
            };

            if (this.joystickStick) {
                this.joystickStick.style.transform = `translate(${this.joystickCurPos.x}px, ${this.joystickCurPos.y}px)`;
            }

            // Set player movement vector
            this.joystickVector = {
                x: (this.joystickCurPos.x / this.joystickMaxDist),
                y: (this.joystickCurPos.y / this.joystickMaxDist)
            };
        };

        const handleEnd = () => {
            this.joystickActive = false;
            this.joystickCurPos = { x: 0, y: 0 };
            this.joystickVector = { x: 0, y: 0 };
            if (this.joystickStick) {
                this.joystickStick.style.transform = 'translate(0, 0)';
            }
        };

        this.joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStart(e);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                handleMove(e);
            }
        }, { passive: false });

        window.addEventListener('touchend', handleEnd);
        
        // Mouse fallback for testing
        this.joystickContainer.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }

    triggerDash() {
        if (this.dashCooldown > 0 || this.state !== 'PLAYING') return;
        
        this.dashActive = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = 60; // 1 second cooldown at 60fps
        
        // Dash in joystick direction, or up if joystick is neutral
        if (this.joystickVector && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
            this.dashVector = { ...this.joystickVector };
        } else {
            this.dashVector = { x: 0, y: -1 };
        }
        
        this.shakeIntensity = 10;
        this.spawnExplosionParticles(this.player.x, this.player.y, '#ffffff', 20);
    }

    // ─── Pause / Resume / Quit ────────────────────────────────────────
    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.updateJoystickUI();

        // Show overlay, update stats
        if (this.pauseScore) this.pauseScore.textContent = String(this.score).padStart(6, '0');
        if (this.pauseBest)  this.pauseBest.textContent  = String(this.highScore).padStart(6, '0');
        if (this.pauseOverlay)   this.pauseOverlay.classList.remove('hidden');

        // Switch pause icon to play icon
        if (this.pauseBtn) {
            this.pauseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
            this.pauseBtn.setAttribute('aria-label', 'Fortsetzen');
        }
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        sound.startMusic();
        this.updateJoystickUI();

        if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');

        // Restore pause icon
        if (this.pauseBtn) {
            this.pauseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            this.pauseBtn.setAttribute('aria-label', 'Pausieren');
        }
    }

    quitGame() {
        // Hide pause overlay, then trigger game over flow
        if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
        this.state = 'PLAYING'; // Temporarily to allow gameOver() to run
        this.gameOver();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        canvasWidth = this.canvas.width;
        canvasHeight = this.canvas.height;
        this.gridNeedsUpdate = true;
    }

    updateUI() {
        if (this.lastScore === this.score && this.lastHighScore === this.highScore) return;
        
        this.scoreEl.textContent = String(this.score).padStart(6, '0');
        this.highScoreEl.textContent = String(this.highScore).padStart(6, '0');
        
        this.lastScore = this.score;
        this.lastHighScore = this.highScore;
    }

    updateGalaxyTheme() {
        const key = this.selectedGalaxy || 'NEON';
        const galaxy = GALAXIES[key];
        const imgUrl = `url('${galaxy.image}')`;

        // Update texts
        if (this.galaxyNameEl) this.galaxyNameEl.textContent = galaxy.name;
        if (this.galaxyDifficultyEl) {
            this.galaxyDifficultyEl.textContent = galaxy.difficulty;
        }
        if (this.galaxyDescriptionEl) this.galaxyDescriptionEl.textContent = galaxy.description;

        // Update stats
        if (this.viewerSpeed) this.viewerSpeed.style.width = `${galaxy.speedVal}%`;
        if (this.viewerSpawn) this.viewerSpawn.style.width = `${galaxy.spawnVal}%`;

        // Update galaxy background
        const bgPrev = document.getElementById('galaxyBg');
        if (bgPrev) {
            bgPrev.style.backgroundImage = imgUrl;
        }

        // Remove old theme classes and add new one on body
        document.body.className = '';
        document.body.classList.add(`galaxy-${key.toLowerCase()}`);
        this.gridNeedsUpdate = true;
    }

    getLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem('neon_leaderboard')) || [
                { name: 'KRONOS', score: 18500, galaxy: 'NEON' },
                { name: 'VECTOR', score: 14200, galaxy: 'TOXIC' },
                { name: 'PHANTOM', score: 9800, galaxy: 'INFERNO' },
                { name: 'SOLARIS', score: 7600, galaxy: 'QUANTUM' },
                { name: 'APEX', score: 4500, galaxy: 'NEON' }
            ];
        } catch (e) {
            return [];
        }
    }

    saveLeaderboard(data) {
        localStorage.setItem('neon_leaderboard', JSON.stringify(data));
    }

    renderLeaderboard() {
        if (!this.leaderboardBody) return;
        
        const data = this.getLeaderboard();
        data.sort((a, b) => b.score - a.score);
        
        this.leaderboardBody.innerHTML = '';
        data.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            const rank = idx + 1;
            
            if (rank === 1) tr.className = 'rank-row-1';
            else if (rank === 2) tr.className = 'rank-row-2';
            else if (rank === 3) tr.className = 'rank-row-3';
            
            const galaxyConfig = GALAXIES[entry.galaxy] || GALAXIES.NEON;
            
            tr.innerHTML = `
                <td class="rank-col">#${rank}</td>
                <td>${entry.name.toUpperCase()}</td>
                <td class="score-col">${entry.score}</td>
                <td class="sector-col" style="color: ${galaxyConfig.color}">${galaxyConfig.name}</td>
            `;
            this.leaderboardBody.appendChild(tr);
        });
    }

    submitScore() {
        const name = this.playerNameInput.value.trim().toUpperCase();
        if (!name) return;
        
        const data = this.getLeaderboard();
        data.push({
            name: name,
            score: this.score,
            galaxy: this.selectedGalaxy
        });
        
        data.sort((a, b) => b.score - a.score);
        const topScores = data.slice(0, 8);
        
        this.saveLeaderboard(topScores);
        this.playerNameInput.value = '';
        
        if (this.leaderboardInputContainer) {
            this.leaderboardInputContainer.classList.add('hidden');
        }

        this.renderLeaderboard();
        }

    startGame() {
        sound.playStart();
        
        // Reset Stats
        this.score = 0;
        this.orbsCollectedCount = 0;
        this.player.lives = this.player.maxLives;
        this.player.x = canvasWidth / 2;
        this.player.y = canvasHeight * 0.75;
        this.player.targetX = this.player.x;
        this.player.targetY = this.player.y;
        this.player.trail = [];
        this.obstacles = [];
        this.orbs = [];
        this.shields = [];
        this.particles = [];
        this.slowMoRing = null;
        this.empCharge = 0;
        this.empWave = null;
        this.laserCharge = 0;
        this.laserActive = false;
        this.laserTimer = 0;
        this.enemyProjectiles = [];
        this.slowMoFactor = 1.0;
        
        // Set galaxy specific baseline speed & spawn interval
        const galaxy = GALAXIES[this.selectedGalaxy || 'NEON'];
        this.obstacleSpeedMultiplier = galaxy.speedMultiplier;
        this.spawnInterval = SPAWN_INTERVAL_BASE / galaxy.spawnRateMultiplier;
        this.lastSpawnTime = performance.now();

        // Clear name entry field
        if (this.playerNameInput) {
            this.playerNameInput.value = '';
        }
        
        this.state = 'PLAYING';
        this.updateUI();
        this.updateJoystickUI();
        
        // Hide Menu & Show HUD Elements
        this.menuOverlay.classList.add('hidden');
        if (this.hudHeader) this.hudHeader.classList.remove('hidden');
        if (this.specialAttacksHud) {
            this.specialAttacksHud.classList.remove('hidden');
        }
        if (this.pauseBtn) {
            this.pauseBtn.classList.remove('hidden');
            // Ensure pause icon (not play)
            this.pauseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        }

        // Show controls hint briefly
        if (this.controlsHint) {
            this.controlsHint.classList.remove('hidden');
            clearTimeout(this.hintTimeout);
            this.hintTimeout = setTimeout(() => {
                this.controlsHint.classList.add('hidden');
            }, 5000);
        }
        
        // Start Background Synth Drone
        sound.startMusic();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        sound.playExplosion();
        this.updateJoystickUI();
        
        // Save score if Highscore
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_high_score', this.highScore);
            this.updateUI();
        }
        
        // Setup menu title
        this.menuTitle.textContent = "GAME OVER";
        this.menuTitle.style.animation = "none";
        void this.menuTitle.offsetWidth; // Force reflow
        this.menuTitle.style.animation = "neonPulse 1.5s infinite alternate";

        // Show stats summary
        this.finalScoreEl.textContent = this.score;
        this.orbsCollectedEl.textContent = this.orbsCollectedCount;
        this.statsSummary.classList.remove('hidden');

        // Show name entry form on highscore / any positive score
        if (this.score > 0) {
            if (this.leaderboardInputContainer) {
                this.leaderboardInputContainer.classList.remove('hidden');
            }
        } else {
            if (this.leaderboardInputContainer) {
                this.leaderboardInputContainer.classList.add('hidden');
            }
        }

        // Hide HUD Elements
        if (this.hudHeader) this.hudHeader.classList.add('hidden');
        if (this.specialAttacksHud) {
            this.specialAttacksHud.classList.add('hidden');
        }
        if (this.pauseBtn) {
            this.pauseBtn.classList.add('hidden');
        }
        // Ensure pause overlay is hidden too
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.add('hidden');
        }
        if (this.controlsHint) {
            this.controlsHint.classList.add('hidden');
            clearTimeout(this.hintTimeout);
        }
        this.startBtn.textContent = "RETRY";
        this.menuOverlay.classList.remove('hidden');
    }

    // Spawning Functions
    spawnObstacle() {
        const radius = Math.random() * 18 + 12; // Radius 12 to 30
        const x = Math.random() * (canvasWidth - radius * 2) + radius;
        const speed = (Math.random() * 1.8 + BASE_OBSTACLE_SPEED) * this.obstacleSpeedMultiplier;
        
        // Randomize obstacle type
        const rand = Math.random();
        let type = 'STANDARD';
        let color = '#ff007f'; // Standard magenta
        let sides = Math.floor(Math.random() * 3) + 3;
        
        if (this.selectedGalaxy === 'INFERNO') {
            // More shooters in Inferno
            if (rand < 0.15) {
                type = 'SEEKER';
                color = '#ffaa00';
                sides = 3;
            } else if (rand < 0.30) {
                type = 'SPLITTER';
                color = '#bd00ff';
                sides = 4;
            } else if (rand < 0.45) {
                type = 'ZIGZAG';
                color = '#39ff14';
                sides = 6;
            } else if (rand < 0.88) { // 43% chance shooter
                type = 'SHOOTER';
                color = '#ff3300';
                sides = 8;
            }
        } else if (this.selectedGalaxy === 'QUANTUM') {
            // More splitters in Quantum
            if (rand < 0.15) {
                type = 'SEEKER';
                color = '#ffaa00';
                sides = 3;
            } else if (rand < 0.65) { // 50% chance splitter
                type = 'SPLITTER';
                color = '#bd00ff';
                sides = 4;
            } else if (rand < 0.80) {
                type = 'ZIGZAG';
                color = '#39ff14';
                sides = 6;
            } else if (rand < 0.90) {
                type = 'SHOOTER';
                color = '#ff3300';
                sides = 8;
            }
        } else {
            // Standard ratios
            if (rand < 0.25) {
                type = 'SEEKER';
                color = '#ffaa00'; // Neon orange
                sides = 3;
            } else if (rand < 0.48) {
                type = 'SPLITTER';
                color = '#bd00ff'; // Neon purple
                sides = 4;
            } else if (rand < 0.72) {
                type = 'ZIGZAG';
                color = '#39ff14'; // Neon green
                sides = 6;
            } else if (rand < 0.90) {
                type = 'SHOOTER';
                color = '#ff3300'; // Neon red-orange
                sides = 8;
            }
        }

        this.obstacles.push({
            type: type,
            x: x,
            y: -radius,
            radius: radius,
            speed: speed,
            angle: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            sides: sides,
            color: color,
            hasSplit: false
        });
    }

    spawnOrb() {
        // Green energy sphere
        const radius = 8;
        const x = Math.random() * (canvasWidth - radius * 2) + radius;
        const y = -radius;
        const speed = Math.random() * 1.5 + 2.0;
        
        this.orbs.push({
            x: x,
            y: y,
            radius: radius,
            speed: speed,
            pulseTimer: 0,
            color: '#39ff14'
        });
    }

    spawnShield() {
        // Rare Shield Item (glowing neon blue / purple)
        const radius = 10;
        const x = Math.random() * (canvasWidth - radius * 2) + radius;
        const y = -radius;
        const speed = Math.random() * 1.0 + 1.8;
        
        this.shields.push({
            x: x,
            y: y,
            radius: radius,
            speed: speed,
            angle: 0,
            rotationSpeed: 0.03,
            color: '#00a8ff' // Electric blue
        });
    }

    // Particle Burst
    spawnExplosionParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.015,
                color: color
            });
        }
    }

    // Trigger Game Damage Shake
    damagePlayer() {
        this.player.lives--;
        this.shakeIntensity = 12;
        this.damageFlash = 1.0;
        sound.playHit();
        this.spawnExplosionParticles(this.player.x, this.player.y, '#ff007f', 15);
        
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }

    // Collect Power-up / Orb
    collectOrb(orb) {
        this.score += 100;
        this.orbsCollectedCount++;
        this.updateUI();
        this.powerupFlash = 0.8;
        sound.playCollect();
        
        // Boost EMP charge
        this.empCharge = Math.min(this.empMaxCharge, this.empCharge + 20);
        
        // Spawn success particles
        this.spawnExplosionParticles(orb.x, orb.y, '#39ff14', 10);
        
        // Time dilation (Slow-mo) effect
        this.slowMoFactor = 0.35;
        this.slowMoRing = {
            x: orb.x,
            y: orb.y,
            radius: 5,
            alpha: 1.0
        };

        // ── Schockwellen-Abstoßung ──────────────────────────────
        // Stoße alle Hindernisse radial vom Sammelort weg.
        // Kraft nimmt mit Abstand ab (min. Distanz 40px um Division-by-0 zu vermeiden).
        const BLAST_FORCE = 420; // Pixel-Impulsstärke
        const MAX_RANGE   = 650; // Ab dieser Distanz kein Effekt mehr
        this.obstacles.forEach(obs => {
            const dx   = obs.x - orb.x;
            const dy   = obs.y - orb.y;
            const dist = Math.max(Math.hypot(dx, dy), 40);
            if (dist > MAX_RANGE) return;

            const power = BLAST_FORCE / dist; // Stärker je näher
            const nx    = dx / dist;          // Normierter Richtungsvektor
            const ny    = dy / dist;

            // Akkumuliere Impuls (mehrere Orbs kurz hintereinander)
            obs.blastVx = (obs.blastVx || 0) + nx * power;
            obs.blastVy = (obs.blastVy || 0) + ny * power;
        });
    }


    collectShield(shield) {
        // Restore 1 shield/life up to max
        if (this.player.lives < this.player.maxLives) {
            this.player.lives++;
            this.healFlash = 0.8;
        }
        this.score += 150; // Give some extra points
        this.updateUI();
        sound.playShieldCollect();
        
        // Spawn glowing blue particles
        this.spawnExplosionParticles(shield.x, shield.y, '#00a8ff', 18);
        
        // Visual distortion wave
        this.slowMoRing = {
            x: shield.x,
            y: shield.y,
            radius: 5,
            alpha: 1.0
        };
    }

    triggerEmp() {
        if (this.empCharge < this.empMaxCharge) return;
        
        this.empCharge = 0;
        this.shakeIntensity = 20;
        sound.playEmpSound();
        
        // Spawn EMP wave
        this.empWave = {
            x: this.player.x,
            y: this.player.y,
            radius: 5,
            maxRadius: Math.max(canvasWidth, canvasHeight) * 1.3,
            alpha: 1.0,
            speed: 15
        };
        
        // Destroy all obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            this.spawnExplosionParticles(obs.x, obs.y, obs.color, 12);
            this.score += 50;
        }
        this.obstacles = [];
        this.updateUI();
    }

    triggerLaser() {
        if (this.laserCharge < this.laserMaxCharge || this.laserActive) return;
        
        this.laserCharge = 0;
        this.laserActive = true;
        this.laserTimer = this.laserDuration;
        this.shakeIntensity = 15;
        sound.playLaserSound();
    }

    // Main Game Loop (Core updates)
    update(time) {
        // Slow-mo decay
        if (this.slowMoFactor < 1.0) {
            this.slowMoFactor += 0.012; // Return to normal speed gradually
            if (this.slowMoFactor > 1.0) this.slowMoFactor = 1.0;
        }

        // Screen shake decay
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= 0.6;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }

        // Flash decay
        if (this.damageFlash > 0) this.damageFlash -= 0.03;
        if (this.healFlash > 0) this.healFlash -= 0.03;
        if (this.powerupFlash > 0) this.powerupFlash -= 0.03;

        if (this.state === 'PLAYING') {
            // Charge EMP slowly over time
            this.empCharge = Math.min(this.empMaxCharge, this.empCharge + 0.05 * this.slowMoFactor);
            
            // Difficulty scaling (Accelerated)
            const galaxyConfig = GALAXIES[this.selectedGalaxy || 'NEON'];
            this.obstacleSpeedMultiplier = galaxyConfig.speedMultiplier + (this.score / 4000) * 0.35;
            this.spawnInterval = Math.max(380, (SPAWN_INTERVAL_BASE / galaxyConfig.spawnRateMultiplier) - (this.score / 800) * 100);

            // Background Grid offset scrolling
            this.gridOffsetY += 2 * this.slowMoFactor;
            if (this.gridOffsetY >= 40) this.gridOffsetY = 0;

            // Keyboard Controls Fallback
            let keyboardDx = 0;
            let keyboardDy = 0;
            const keyboardSpeed = 6;
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) keyboardDx -= keyboardSpeed;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) keyboardDx += keyboardSpeed;
            if (this.keys['ArrowUp'] || this.keys['KeyW']) keyboardDy -= keyboardSpeed;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) keyboardDy += keyboardSpeed;
            
            if (keyboardDx !== 0 || keyboardDy !== 0) {
                this.player.targetX += keyboardDx;
                this.player.targetY += keyboardDy;
            }

            // Joystick Movement (Add this part)
            if (this.joystickEnabled && this.joystickVector) {
                const moveSpeed = 10;
                this.player.targetX += this.joystickVector.x * moveSpeed;
                this.player.targetY += this.joystickVector.y * moveSpeed;
            }

            this.player.targetX = Math.max(SHIP_RADIUS, Math.min(canvasWidth - SHIP_RADIUS, this.player.targetX));
            this.player.targetY = Math.max(SHIP_RADIUS, Math.min(canvasHeight - SHIP_RADIUS, this.player.targetY));

            // Handle Dash Movement
            if (this.dashActive) {
                this.player.x += this.dashVector.x * this.dashSpeed;
                this.player.y += this.dashVector.y * this.dashSpeed;
                this.player.targetX = this.player.x;
                this.player.targetY = this.player.y;
                this.dashTimer--;
                if (this.dashTimer <= 0) {
                    this.dashActive = false;
                }
            } else {
                // Dynamic ease: slow for joystick, snappy for mouse/touch
                const ease = this.joystickActive ? 0.04 : 0.18;
                const oldX = this.player.x;
                const oldY = this.player.y;
                this.player.x += (this.player.targetX - this.player.x) * ease;
                this.player.y += (this.player.targetY - this.player.y) * ease;
                
                // Calculate movement angle
                const dx = this.player.x - oldX;
                const dy = this.player.y - oldY;
                if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    this.player.angle = Math.atan2(dy, dx);
                } else {
                    const targetAngle = -Math.PI / 2;
                    let angleDiff = targetAngle - this.player.angle;
                    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    this.player.angle += angleDiff * 0.1;
                }
            }

            // Cooldowns
            if (this.dashCooldown > 0) this.dashCooldown--;

            // Trail System
            this.player.trail.push({ x: this.player.x, y: this.player.y });
            if (this.player.trail.length > 12) {
                this.player.trail.shift();
            }

            // Spawn Obstacles, Orbs & Rare Shields
            const elapsed = time - this.lastSpawnTime;
            if (elapsed >= this.spawnInterval) {
                this.spawnObstacle();
                this.lastSpawnTime = time;
                
                const rand = Math.random();
                if (rand < 0.05) {
                    // 5% chance of spawning a rare shield item
                    this.spawnShield();
                } else if (rand < 0.45) {
                    // Spawning standard orb
                    this.spawnOrb();
                }
            }

            // Update Obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                obs.y += obs.speed * this.slowMoFactor;
                obs.angle += obs.rotationSpeed * this.slowMoFactor;

                // Handle Seeker steering towards player
                if (obs.type === 'SEEKER') {
                    obs.x += (this.player.x - obs.x) * 0.012 * this.slowMoFactor;
                    obs.x = Math.max(obs.radius, Math.min(canvasWidth - obs.radius, obs.x));
                }

                // Handle ZigZag Weaver sine movement
                if (obs.type === 'ZIGZAG') {
                    if (obs.initialX === undefined) {
                        obs.initialX = obs.x;
                        obs.phaseOffset = Math.random() * Math.PI * 2;
                    }
                    obs.x = obs.initialX + Math.sin(obs.y * 0.02 + obs.phaseOffset) * 60;
                    obs.x = Math.max(obs.radius, Math.min(canvasWidth - obs.radius, obs.x));
                }

                // Handle Shooter projectile firing
                if (obs.type === 'SHOOTER') {
                    if (obs.lastShot === undefined) {
                        obs.lastShot = time;
                    }
                    if (time - obs.lastShot > 1600) {
                        obs.lastShot = time;
                        sound.playEnemyShoot();
                        this.enemyProjectiles.push({
                            x: obs.x,
                            y: obs.y + obs.radius,
                            radius: 4,
                            speed: 5.0,
                            color: '#ffaa00'
                        });
                        this.spawnExplosionParticles(obs.x, obs.y + obs.radius, '#ffaa00', 4);
                    }
                }

                // Handle Splitter split behaviour
                if (obs.type === 'SPLITTER' && !obs.hasSplit && obs.y > canvasHeight * 0.42) {
                    obs.hasSplit = true;
                    const splitSpeed = obs.speed * 1.15;
                    const splitRadius = obs.radius * 0.65;
                    
                    // Left split
                    this.obstacles.push({
                        type: 'STANDARD',
                        x: obs.x,
                        y: obs.y,
                        radius: splitRadius,
                        speed: splitSpeed,
                        angle: -Math.PI / 4,
                        rotationSpeed: -0.06,
                        sides: 3,
                        color: '#ff007f',
                        dx: -splitSpeed * 0.5
                    });
                    
                    // Right split
                    this.obstacles.push({
                        type: 'STANDARD',
                        x: obs.x,
                        y: obs.y,
                        radius: splitRadius,
                        speed: splitSpeed,
                        angle: Math.PI / 4,
                        rotationSpeed: 0.06,
                        sides: 3,
                        color: '#ff007f',
                        dx: splitSpeed * 0.5
                    });
                    
                    // Spawn particles
                    this.spawnExplosionParticles(obs.x, obs.y, obs.color, 8);
                    
                    // Remove parent splitter
                    this.obstacles.splice(i, 1);
                    continue;
                }

                // Apply diagonal split speed if any
                if (obs.dx) {
                    obs.x += obs.dx * this.slowMoFactor;
                }

                // Apply orb-blast repulsion impulse & decay (0.88 per frame ≈ ~1s fade)
                if (obs.blastVx || obs.blastVy) {
                    obs.x += (obs.blastVx || 0) * this.slowMoFactor;
                    obs.y += (obs.blastVy || 0) * this.slowMoFactor;
                    obs.blastVx = (obs.blastVx || 0) * 0.88;
                    obs.blastVy = (obs.blastVy || 0) * 0.88;
                    // Clamp tiny values to zero
                    if (Math.abs(obs.blastVx) < 0.05) obs.blastVx = 0;
                    if (Math.abs(obs.blastVy) < 0.05) obs.blastVy = 0;
                    // Keep on screen horizontally
                    obs.x = Math.max(obs.radius, Math.min(canvasWidth - obs.radius, obs.x));
                }

                // Collision Detection with Player (Circle vs Polygon approximation via distance)
                const dist = Math.hypot(this.player.x - obs.x, this.player.y - obs.y);
                if (dist < this.player.radius + obs.radius * 0.85) {
                    this.damagePlayer();
                    this.obstacles.splice(i, 1);
                    continue;
                }

                // Remove out of bounds
                if (obs.y - obs.radius > canvasHeight) {
                    this.obstacles.splice(i, 1);
                    this.score += 10; // Evading gives points!
                    this.updateUI();
                    
                    // Dodge charges laser!
                    if (!this.laserActive) {
                        this.laserCharge = Math.min(this.laserMaxCharge, this.laserCharge + 2.5);
                    }
                }
            }

            // Update EMP Wave
            if (this.empWave) {
                this.empWave.radius += this.empWave.speed;
                this.empWave.alpha -= 0.02;
                if (this.empWave.radius >= this.empWave.maxRadius || this.empWave.alpha <= 0) {
                    this.empWave = null;
                }
            }

            // Update Laser Beam
            if (this.laserActive) {
                this.laserTimer--;
                this.shakeIntensity = Math.max(this.shakeIntensity, 6);
                
                // Vaporize obstacles
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    if (Math.abs(obs.x - this.player.x) < obs.radius + 35 && obs.y < this.player.y + 15) {
                        this.spawnExplosionParticles(obs.x, obs.y, obs.color, 12);
                        this.obstacles.splice(i, 1);
                        this.score += 50;
                        this.updateUI();
                    }
                }
                
                if (this.laserTimer <= 0) {
                    this.laserActive = false;
                }
            } else {
                // Charge laser slowly
                this.laserCharge = Math.min(this.laserMaxCharge, this.laserCharge + 0.05 * this.slowMoFactor);
            }

            // Update Enemy Projectiles
            for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
                const proj = this.enemyProjectiles[i];
                proj.y += proj.speed * this.slowMoFactor;
                
                // Collision with player
                const dist = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
                if (dist < this.player.radius + proj.radius) {
                    this.damagePlayer();
                    this.enemyProjectiles.splice(i, 1);
                    continue;
                }
                
                // Remove out of bounds
                if (proj.y > canvasHeight) {
                    this.enemyProjectiles.splice(i, 1);
                }
            }

            // Update Orbs
            for (let i = this.orbs.length - 1; i >= 0; i--) {
                const orb = this.orbs[i];
                orb.y += orb.speed * this.slowMoFactor;
                orb.pulseTimer += 0.1 * this.slowMoFactor;

                // Collision detection with Player
                const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
                if (dist < this.player.radius + orb.radius + 5) {
                    this.collectOrb(orb);
                    this.orbs.splice(i, 1);
                    continue;
                }

                // Remove out of bounds
                if (orb.y - orb.radius > canvasHeight) {
                    this.orbs.splice(i, 1);
                }
            }

            // Update Shields
            for (let i = this.shields.length - 1; i >= 0; i--) {
                const shield = this.shields[i];
                shield.y += shield.speed * this.slowMoFactor;
                shield.angle += shield.rotationSpeed * this.slowMoFactor;

                // Collision detection with Player
                const dist = Math.hypot(this.player.x - shield.x, this.player.y - shield.y);
                if (dist < this.player.radius + shield.radius + 5) {
                    this.collectShield(shield);
                    this.shields.splice(i, 1);
                    continue;
                }

                // Remove out of bounds
                if (shield.y - shield.radius > canvasHeight) {
                    this.shields.splice(i, 1);
                }
            }

            // Update on-screen buttons filling level
            if (this.empBtn) {
                this.empBtn.disabled = this.empCharge < this.empMaxCharge;
                this.empProgress.style.height = `${(this.empCharge / this.empMaxCharge) * 100}%`;
            }
            if (this.laserBtn) {
                this.laserBtn.disabled = this.laserCharge < this.laserMaxCharge;
                this.laserProgress.style.height = `${(this.laserCharge / this.laserMaxCharge) * 100}%`;
            }
        }

        // Update Slow-Mo Ring Effect
        if (this.slowMoRing) {
            this.slowMoRing.radius += 8;
            this.slowMoRing.alpha -= 0.025;
            if (this.slowMoRing.alpha <= 0) {
                this.slowMoRing = null;
            }
        }

        // Update Particles (Fades even when not playing)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * this.slowMoFactor;
            p.y += p.vy * this.slowMoFactor;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Canvas drawing helper
    drawPolygon(ctx, x, y, radius, sides, angle) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const currentAngle = angle + (i * 2 * Math.PI) / sides;
            const px = x + Math.cos(currentAngle) * radius;
            const py = y + Math.sin(currentAngle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    // Render Canvas Frame
    render() {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Screen Shake Translate
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 1. Draw Cyber Grid Background (Optimized)
        if (this.gridNeedsUpdate) {
            this.offscreenGrid.width = canvasWidth;
            this.offscreenGrid.height = 80; // Only need two grid units height
            const gCtx = this.offscreenGridCtx;
            const galaxy = GALAXIES[this.selectedGalaxy || 'NEON'];
            const gridSpacing = 40;
            
            gCtx.strokeStyle = galaxy.gridColor;
            gCtx.lineWidth = 1;
            
            // Vertical lines
            for (let x = 0; x < canvasWidth; x += gridSpacing) {
                gCtx.beginPath();
                gCtx.moveTo(x, 0);
                gCtx.lineTo(x, 80);
                gCtx.stroke();
            }
            // Horizontal lines
            for (let y = 0; y < 80; y += gridSpacing) {
                gCtx.beginPath();
                gCtx.moveTo(0, y);
                gCtx.lineTo(canvasWidth, y);
                gCtx.stroke();
            }
            this.gridNeedsUpdate = false;
        }

        const gridSpacing = 40;
        const totalGridLayers = Math.ceil(canvasHeight / 80) + 1;
        for (let i = 0; i < totalGridLayers; i++) {
            ctx.drawImage(this.offscreenGrid, 0, i * 80 + (this.gridOffsetY % 80) - 80);
        }

        // 2. Draw Slow-Mo Expanded Shockwave Ring
        if (this.slowMoRing) {
            ctx.save();
            ctx.strokeStyle = `rgba(57, 255, 20, ${this.slowMoRing.alpha})`;
            ctx.lineWidth = 3;
            // Only use shadows for high-impact effects
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#39ff14';
            ctx.beginPath();
            ctx.arc(this.slowMoRing.x, this.slowMoRing.y, this.slowMoRing.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 2.5 Draw EMP shockwave
        if (this.empWave) {
            ctx.save();
            ctx.strokeStyle = `rgba(0, 240, 255, ${this.empWave.alpha})`;
            ctx.lineWidth = 6;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.arc(this.empWave.x, this.empWave.y, this.empWave.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 2.8 Draw Plasma Laser Beam
        if (this.laserActive && this.state === 'PLAYING') {
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 15 + Math.random() * 10;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff007f';
            
            ctx.beginPath();
            ctx.moveTo(this.player.x, this.player.y);
            ctx.lineTo(this.player.x, 0);
            ctx.stroke();
            
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 6 + Math.random() * 4;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(this.player.x, this.player.y);
            ctx.lineTo(this.player.x, 0);
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y - 10, 20 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. Draw Player Trail
        if (this.state === 'PLAYING' && this.player.trail.length > 1) {
            ctx.save();
            ctx.lineWidth = 3;
            // Removed shadowBlur from trail for performance
            const galaxy = GALAXIES[this.selectedGalaxy || 'NEON'];
            const rgb = hexToRgb(galaxy.color);
            
            for (let i = 1; i < this.player.trail.length; i++) {
                const p1 = this.player.trail[i - 1];
                const p2 = this.player.trail[i];
                const alpha = (i / this.player.trail.length) * 0.4;
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // 4. Draw Player
        if (this.state === 'PLAYING') {
            const galaxy = GALAXIES[this.selectedGalaxy || 'NEON'];
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            ctx.rotate(this.player.angle);
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = galaxy.color;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = galaxy.color;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(this.player.radius * 1.3, 0);
            ctx.lineTo(-this.player.radius * 0.8, -this.player.radius * 0.8);
            ctx.lineTo(-this.player.radius * 0.4, 0);
            ctx.lineTo(-this.player.radius * 0.8, this.player.radius * 0.8);
            ctx.closePath();
            
            ctx.fill();
            ctx.stroke();
            
            if (Math.random() > 0.3) {
                ctx.shadowColor = '#fffb00';
                ctx.fillStyle = 'rgba(255, 251, 0, 0.8)';
                ctx.beginPath();
                ctx.moveTo(-this.player.radius * 0.5, -this.player.radius * 0.3);
                ctx.lineTo(-this.player.radius * 1.3 - Math.random() * 8, 0);
                ctx.lineTo(-this.player.radius * 0.5, this.player.radius * 0.3);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        // 5. Draw Obstacles (Batch color changes for performance)
        ctx.lineWidth = 3;
        this.obstacles.forEach(obs => {
            ctx.save();
            // Reduced shadowBlur
            ctx.shadowBlur = 8;
            ctx.shadowColor = obs.color;
            ctx.strokeStyle = obs.color;
            ctx.fillStyle = obs.type === 'SEEKER' ? 'rgba(255, 170, 0, 0.15)' : 
                            obs.type === 'SPLITTER' ? 'rgba(189, 0, 255, 0.15)' : 
                            obs.type === 'ZIGZAG' ? 'rgba(57, 255, 20, 0.15)' :
                            obs.type === 'SHOOTER' ? 'rgba(255, 51, 0, 0.15)' : 'rgba(255, 0, 127, 0.15)';
            
            this.drawPolygon(ctx, obs.x, obs.y, obs.radius, obs.sides, obs.angle);
            ctx.fill();
            ctx.stroke();
            
            if (obs.type === 'SEEKER' || obs.type === 'SPLITTER') {
                ctx.fillStyle = '#ffffff';
                if (obs.type === 'SEEKER') {
                    ctx.beginPath();
                    ctx.arc(obs.x, obs.y, obs.radius * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(obs.x - obs.radius * 0.2, obs.y - obs.radius * 0.2, obs.radius * 0.4, obs.radius * 0.4);
                }
            }
            ctx.restore();
        });

        // 6. Draw Orbs
        this.orbs.forEach(orb => {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = orb.color;
            ctx.strokeStyle = orb.color;
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            const scale = 1.0 + Math.sin(orb.pulseTimer) * 0.15;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // 6.5 Draw Shields
        this.shields.forEach(shield => {
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = shield.color;
            ctx.strokeStyle = shield.color;
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(0, 168, 255, 0.2)';
            ctx.translate(shield.x, shield.y);
            ctx.rotate(shield.angle);
            ctx.beginPath();
            ctx.arc(0, 0, shield.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -shield.radius * 0.6); ctx.lineTo(0, shield.radius * 0.6);
            ctx.moveTo(-shield.radius * 0.6, 0); ctx.lineTo(shield.radius * 0.6, 0);
            ctx.stroke();
            ctx.restore();
        });

        // 7. Draw Particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            // Removed shadows from particles
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 7.5 Draw Enemy Projectiles
        this.enemyProjectiles.forEach(proj => {
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = proj.color;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // 8. Draw Player HUD (Optimized positions and state)
        if (this.state === 'PLAYING') {
            ctx.save();
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00f0ff';
            ctx.fillStyle = '#00f0ff';
            ctx.font = "bold 11px 'Share Tech Mono'";
            
            const hudYOffset = 65;
            const barWidthTotal = 85; // Standardized width for all bars
            const labelWidth = 105; // X position where bars start

            // SHIELD (Top)
            ctx.fillStyle = '#00f0ff';
            ctx.fillText("SHIELD:", 20, hudYOffset + 28);
            const shieldBarWidth = (barWidthTotal - 12) / 3; // Calculate segment width
            const barGap = 6;
            for (let i = 0; i < this.player.maxLives; i++) {
                ctx.fillStyle = i < this.player.lives ? '#00f0ff' : 'rgba(255, 255, 255, 0.12)';
                ctx.fillRect(labelWidth + i * (shieldBarWidth + barGap), hudYOffset + 20, shieldBarWidth, 8);
            }

            // EMP NOVA (Middle)
            ctx.fillStyle = '#00f0ff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00f0ff';
            ctx.fillText("EMP NOVA:", 20, hudYOffset + 48);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(labelWidth, hudYOffset + 40, barWidthTotal, 8);
            const empFillWidth = (this.empCharge / this.empMaxCharge) * barWidthTotal;
            ctx.fillStyle = this.empCharge >= this.empMaxCharge ? '#00f0ff' : '#00a8ff';
            ctx.fillRect(labelWidth, hudYOffset + 40, empFillWidth, 8);
            if (this.empCharge >= this.empMaxCharge) {
                ctx.fillStyle = '#00f0ff';
                ctx.fillText("BEREIT", labelWidth + barWidthTotal + 10, hudYOffset + 47);
            }
            
            // PLASMA BEAM (Bottom)
            ctx.fillStyle = '#00f0ff';
            ctx.fillText("PLASMA BEAM:", 20, hudYOffset + 68);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(labelWidth, hudYOffset + 60, barWidthTotal, 8);
            const laserFillWidth = (this.laserCharge / this.laserMaxCharge) * barWidthTotal;
            ctx.fillStyle = this.laserCharge >= this.laserMaxCharge ? '#ff007f' : '#bd00ff';
            ctx.fillRect(labelWidth, hudYOffset + 60, laserFillWidth, 8);
            if (this.laserCharge >= this.laserMaxCharge) {
                ctx.fillStyle = '#ff007f';
                ctx.fillText("BEREIT", labelWidth + barWidthTotal + 10, hudYOffset + 67);
            }
            
            if (this.slowMoFactor < 0.9) {
                ctx.fillStyle = '#39ff14';
                ctx.fillText("ZEITLUPE AKTIV", 20, hudYOffset + 88);
            }
            ctx.restore();
        }

        // 9. Draw Screen Edge Effects (Flash/Vignette)
        if (this.damageFlash > 0 || this.healFlash > 0 || this.powerupFlash > 0) {
            ctx.save();
            const edgeW = 40; // Narrower border
            
            const drawVignette = (color, intensity) => {
                const alpha = intensity * 0.5;
                // Top
                let g = ctx.createLinearGradient(0, 0, 0, edgeW);
                g.addColorStop(0, `rgba(${color}, ${alpha})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, canvasWidth, edgeW);
                // Bottom
                g = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - edgeW);
                g.addColorStop(0, `rgba(${color}, ${alpha})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, canvasHeight - edgeW, canvasWidth, edgeW);
                // Left
                g = ctx.createLinearGradient(0, 0, edgeW, 0);
                g.addColorStop(0, `rgba(${color}, ${alpha})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, edgeW, canvasHeight);
                // Right
                g = ctx.createLinearGradient(canvasWidth, 0, canvasWidth - edgeW, 0);
                g.addColorStop(0, `rgba(${color}, ${alpha})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(canvasWidth - edgeW, 0, edgeW, canvasHeight);
            };

            if (this.damageFlash > 0) drawVignette('255, 0, 127', this.damageFlash);
            if (this.healFlash > 0) drawVignette('0, 168, 255', this.healFlash);
            if (this.powerupFlash > 0) drawVignette('57, 255, 20', this.powerupFlash);
            
            ctx.restore();
        }

        ctx.restore();
    }

    // Entry point loops
    run(timestamp) {
        // When paused: freeze game logic but keep rendering so the
        // blurred canvas background is still visible behind the overlay.
        if (this.state !== 'PAUSED') {
            this.update(timestamp);
        }
        this.render();

        requestAnimationFrame((t) => this.run(t));
    }
}

// Utility helper to convert hex colors to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 240, b: 255 };
}

// ─────────────────────────────────────────────
//  Animated Menu Starfield
// ─────────────────────────────────────────────
class MenuStarfield {
    constructor(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.stars = [];
        this.color = '#00f0ff';
        this.running = true;
        this.resize();
        this.generate(120);
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    resize() {
        this.canvas.width  = this.canvas.offsetWidth  || window.innerWidth;
        this.canvas.height = this.canvas.offsetHeight || window.innerHeight;
    }

    generate(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push(this.newStar(true));
        }
    }

    newStar(anywhere = false) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        return {
            x:     Math.random() * w,
            y:     anywhere ? Math.random() * h : -5,
            r:     Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.6 + 0.2,
            alpha: Math.random() * 0.6 + 0.4,
            twinkle: Math.random() * Math.PI * 2
        };
    }

    setColor(hex) {
        this.color = hex;
    }

    loop() {
        if (!this.running) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        const rgb = hexToRgb(this.color);

        this.stars.forEach((s, i) => {
            s.y += s.speed;
            s.twinkle += 0.04;
            const a = s.alpha * (0.7 + 0.3 * Math.sin(s.twinkle));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
            ctx.fill();

            // Reset stars that fell off-screen
            if (s.y > h + 4) {
                this.stars[i] = this.newStar(false);
            }
        });

        requestAnimationFrame(() => this.loop());
    }

    stop() { this.running = false; }
}

// ─────────────────────────────────────────────
//  Bootstrap
// ─────────────────────────────────────────────
window.addEventListener('load', () => {
    const game = new Game();
    window.activeGameInstance = game;

    // Init menu starfield
    const starCanvas = document.getElementById('menuStarCanvas');
    if (starCanvas) {
        const sf = new MenuStarfield(starCanvas);
        window.menuStarfield = sf;

        // Keep star color in sync with galaxy selection
        const syncStarColor = () => {
            const galaxy = GALAXIES[game.selectedGalaxy || 'NEON'];
            sf.setColor(galaxy.color);
        };
        syncStarColor();

        // Patch galaxy nav buttons to also update star color
        ['prevGalaxyBtn', 'nextGalaxyBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    setTimeout(syncStarColor, 10);
                });
            }
        });
    }

    requestAnimationFrame((t) => game.run(t));
});
