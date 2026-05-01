// DOM Elements
const elements = {
    video: document.getElementById('camVideo'),
    canvas: document.getElementById('diffCanvas'),
    highlight: document.getElementById('motionHighlight'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    idleOverlay: document.getElementById('idleOverlay'),
    videoBox: document.getElementById('videoBox'),

    // Status
    camStatus: document.getElementById('camStatus'),
    globalStatus: document.getElementById('globalStatus'),
    motionStatusText: document.getElementById('motionStatusText'),
    fpsValue: document.getElementById('fpsValue'),
    motionBarFill: document.getElementById('motionBarFill'),
    motionScoreValue: document.getElementById('motionScoreValue'),

    // Controls
    startBtn: document.getElementById('startCameraBtn'),
    stopBtn: document.getElementById('stopCameraBtn'),
    sensitivityRange: document.getElementById('sensitivityRange'),
    sensitivityDisplay: document.getElementById('sensitivityDisplay'),
    delayRange: document.getElementById('delayRange'),
    delayDisplay: document.getElementById('delayDisplay'),
    thresholdRange: document.getElementById('thresholdRange'),
    thresholdDisplay: document.getElementById('thresholdDisplay'),

    // Logs
    logBox: document.getElementById('logBox'),
    clearLogBtn: document.getElementById('clearLogBtn')
};

// Context
const ctx = elements.canvas.getContext('2d', { willReadFrequently: true });

// State
const state = {
    isCameraOn: false,
    animationFrameId: null,
    previousFrameData: null,
    motionTimeoutId: null,
    lastMotionState: false,
    targetMotionState: false,

    // Settings
    sensitivity: parseInt(elements.sensitivityRange.value),
    humanDelay: parseInt(elements.delayRange.value),
    threshold: parseInt(elements.thresholdRange.value),

    // FPS Tracking
    frames: 0,
    lastFpsTime: Date.now()
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    addLog('System initialized successfully', 'info');
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startCamera);
    elements.stopBtn.addEventListener('click', stopCamera);
    elements.clearLogBtn.addEventListener('click', clearLog);

    // Sliders
    elements.sensitivityRange.addEventListener('input', (e) => {
        state.sensitivity = parseInt(e.target.value);
        elements.sensitivityDisplay.textContent = state.sensitivity;
    });
    elements.sensitivityRange.addEventListener('change', (e) => {
        addLog(`Sensitivity adjusted to ${e.target.value}`, 'info');
    });

    elements.delayRange.addEventListener('input', (e) => {
        state.humanDelay = parseInt(e.target.value);
        elements.delayDisplay.textContent = `${state.humanDelay}ms`;
    });
    elements.delayRange.addEventListener('change', (e) => {
        addLog(`Reaction Delay adjusted to ${e.target.value}ms`, 'info');
    });

    elements.thresholdRange.addEventListener('input', (e) => {
        state.threshold = parseInt(e.target.value);
        elements.thresholdDisplay.textContent = state.threshold;
    });
    elements.thresholdRange.addEventListener('change', (e) => {
        addLog(`Area Threshold adjusted to ${e.target.value}`, 'info');
    });
}

// Camera Operations
async function startCamera() {
    addLog('Initializing optical sensors...', 'info');
    elements.loadingOverlay.classList.remove('hidden');
    elements.idleOverlay.classList.add('hidden');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
        });

        elements.video.srcObject = stream;

        // Wait for metadata to load so we know dimensions
        elements.video.onloadedmetadata = () => {
            elements.video.play().catch(e => console.error("Play failed", e));

            // Set canvas size to match video exactly
            elements.canvas.width = elements.video.videoWidth;
            elements.canvas.height = elements.video.videoHeight;

            // UI Updates
            setTimeout(() => {
                elements.loadingOverlay.classList.add('hidden');
                elements.video.classList.add('active');
            }, 600);

            state.isCameraOn = true;
            updateControlStates(true);

            addLog(`Stream active [${elements.video.videoWidth}x${elements.video.videoHeight}]`, 'info');

            // Reset state
            state.previousFrameData = null;
            state.lastMotionState = false;

            // Start Loop
            detectMotion();
        };

    } catch (err) {
        elements.loadingOverlay.classList.add('hidden');
        elements.idleOverlay.classList.remove('hidden');
        addLog(`Access denied: ${err.message}`, 'error');
        alert('Could not access camera. Please allow permissions.');
    }
}

function stopCamera() {
    state.isCameraOn = false;

    if (elements.video.srcObject) {
        elements.video.srcObject.getTracks().forEach(track => track.stop());
        elements.video.srcObject = null;
    }

    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
    }

    if (state.motionTimeoutId) {
        clearTimeout(state.motionTimeoutId);
    }

    // Clear canvas
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    // UI Updates
    elements.video.classList.remove('active');
    elements.idleOverlay.classList.remove('hidden');
    elements.highlight.classList.remove('active');

    updateControlStates(false);
    resetStats();

    state.previousFrameData = null;
    addLog('Optical sensors disabled', 'info');
}

function updateControlStates(isActive) {
    elements.startBtn.disabled = isActive;
    elements.stopBtn.disabled = !isActive;

    if (isActive) {
        elements.camStatus.innerHTML = '<i class="fa-solid fa-circle"></i> Live';
        elements.camStatus.className = 'status-indicator on';
        elements.globalStatus.textContent = 'Monitoring';
        elements.globalStatus.className = 'badge badge-active';
    } else {
        elements.camStatus.innerHTML = '<i class="fa-solid fa-circle"></i> Off';
        elements.camStatus.className = 'status-indicator off';
        elements.globalStatus.textContent = 'System Idle';
        elements.globalStatus.className = 'badge badge-inactive';
    }
}

function resetStats() {
    elements.motionStatusText.textContent = 'No Motion';
    elements.motionStatusText.style.color = 'var(--text-main)';
    elements.fpsValue.textContent = '0';
    elements.motionBarFill.style.width = '0%';
    elements.motionBarFill.className = 'progress-bar-fill';
    elements.motionScoreValue.textContent = '0%';
}

// Motion Detection Engine
function detectMotion() {
    if (!state.isCameraOn) return;

    if (elements.video.readyState === elements.video.HAVE_ENOUGH_DATA) {
        const w = elements.canvas.width;
        const h = elements.canvas.height;

        // Draw frame and extract data
        ctx.drawImage(elements.video, 0, 0, w, h);
        const currentFrameData = ctx.getImageData(0, 0, w, h);

        if (state.previousFrameData) {
            processFrames(state.previousFrameData, currentFrameData, w, h);
        }

        state.previousFrameData = currentFrameData;

        // FPS Calc
        state.frames++;
        const now = Date.now();
        if (now - state.lastFpsTime >= 1000) {
            elements.fpsValue.textContent = state.frames;
            state.frames = 0;
            state.lastFpsTime = now;
        }
    }

    state.animationFrameId = requestAnimationFrame(detectMotion);
}

function processFrames(prevFrame, currFrame, width, height) {
    const prevData = prevFrame.data;
    const currData = currFrame.data;

    let changedPixels = 0;
    let totalDiff = 0;
    
    const step = 4;
    
    // Advanced Grid-Based Noise Filtering
    const gridCols = 32;
    const gridRows = 24;
    const cellW = width / gridCols;
    const cellH = height / gridRows;
    const grid = new Int32Array(gridCols * gridRows);
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            
            const rDiff = Math.abs(prevData[i] - currData[i]);
            const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
            const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);

            const pixelDiff = rDiff + gDiff + bDiff;
            
            if (pixelDiff > state.sensitivity) {
                changedPixels++;
                totalDiff += pixelDiff;
                
                // Map pixel to grid cell
                const gridX = Math.floor(x / cellW);
                const gridY = Math.floor(y / cellH);
                grid[gridY * gridCols + gridX]++;
            }
        }
    }
    
    // Calculate Bounding Box strictly from noisy-filtered grid cells
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let activeCells = 0;

    // A cell must have multiple changed pixels to be considered "real" motion
    const noiseThreshold = 2; 

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        if (grid[gy * gridCols + gx] >= noiseThreshold) {
          activeCells++;
          const cellX = gx * cellW;
          const cellY = gy * cellH;
          
          if (cellX < minX) minX = cellX;
          if (cellX + cellW > maxX) maxX = cellX + cellW;
          if (cellY < minY) minY = cellY;
          if (cellY + cellH > maxY) maxY = cellY + cellH;
        }
      }
    }

    // Scale up pixel count
    const actualChangedPixels = changedPixels * (step * step);
    const score = Math.min(100, Math.floor(totalDiff / 2000));

    updateScoreUI(score);

    const isMotion = actualChangedPixels > state.threshold;
    const hasValidBounds = isMotion && activeCells > 0 && maxX > minX && maxY > minY;

    if (isMotion !== state.targetMotionState) {
        state.targetMotionState = isMotion;
        if (state.motionTimeoutId) clearTimeout(state.motionTimeoutId);

        const variance = Math.random() * 100 - 50;
        const delay = Math.max(50, state.humanDelay + variance);

        state.motionTimeoutId = setTimeout(() => {
            if (!state.isCameraOn) return;

            state.lastMotionState = isMotion;
            if (isMotion) {
                addLog(`Subject detected [Mass: ${actualChangedPixels}px]`, 'motion');
                elements.motionStatusText.textContent = 'DETECTED';
                elements.motionStatusText.style.color = 'var(--accent-danger)';
            } else {
                addLog('Subject lost / Area clear', 'nomotion');
                elements.motionStatusText.textContent = 'Clear';
                elements.motionStatusText.style.color = 'var(--text-main)';
                elements.highlight.classList.remove('active');
            }
        }, delay);
    }

    if (state.lastMotionState && hasValidBounds) {
        positionHighlightBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
}

function updateScoreUI(score) {
    elements.motionScoreValue.textContent = `${score}%`;
    elements.motionBarFill.style.width = `${score}%`;

    if (score > 60) elements.motionBarFill.className = 'progress-bar-fill danger';
    else if (score > 30) elements.motionBarFill.className = 'progress-bar-fill warning';
    else elements.motionBarFill.className = 'progress-bar-fill';
}

function positionHighlightBox(bounds) {
    const videoRect = elements.videoBox.getBoundingClientRect();
    const canvasW = elements.canvas.width;
    const canvasH = elements.canvas.height;

    // Scale percentages
    const scaleX = videoRect.width / canvasW;
    const scaleY = videoRect.height / canvasH;

    const padding = 15; // Visual padding

    const bW = (bounds.w * scaleX) + (padding * 2);
    const bH = (bounds.h * scaleY) + (padding * 2);

    // Mirror X position because video is mirrored
    // Left = TotalWidth - (OriginalBoxX * ScaleX) - BoxWidth + Padding
    const rawLeft = bounds.x * scaleX;
    const mirroredLeft = videoRect.width - rawLeft - bW + (padding * 2);

    const bT = (bounds.y * scaleY) - padding;

    elements.highlight.style.width = `${bW}px`;
    elements.highlight.style.height = `${bH}px`;
    elements.highlight.style.left = `${mirroredLeft}px`;
    elements.highlight.style.top = `${bT}px`;

    elements.highlight.classList.add('active');
}

// Logs
function addLog(msg, type) {
    const d = new Date();
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;

    if (elements.logBox.children.length === 0 || elements.logBox.querySelector('.log-placeholder')) {
        elements.logBox.innerHTML = '';
    }

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let msgClass = 'log-msg-info';
    if (type === 'motion') msgClass = 'log-msg-motion';
    if (type === 'nomotion') msgClass = 'log-msg-nomotion';
    if (type === 'error') msgClass = 'log-msg-error';

    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="${msgClass}">${msg}</span>`;

    elements.logBox.appendChild(entry);

    // Keep only last 50 logs to prevent DOM bloat
    if (elements.logBox.children.length > 50) {
        elements.logBox.removeChild(elements.logBox.firstChild);
    }

    elements.logBox.scrollTop = elements.logBox.scrollHeight;
}

function clearLog() {
    elements.logBox.innerHTML = '<div class="log-placeholder">Waiting for events...</div>';
}