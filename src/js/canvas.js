// ============================================
// CANVAS RENDERING - Canvas joonistamise funktsioonid
// ============================================

import { state, getCurrentLayer, getCurrentStitches } from './state.js';
import { stitchSymbols, getStitchSymbol, stitchSvgFiles } from './config.js';

let canvas, ctx;
let canvasContainer = null;
let panOffset = { x: 0, y: 0 };
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

// SVG image cache
const svgImageCache = new Map();

// ============================================
// PERFORMANCE: Offscreen grid cache
// ============================================
let gridCacheCanvas = null;
let gridCacheCtx = null;
let gridDirty = true;

// ============================================
// PERFORMANCE: Stitch sprite cache
// ============================================
const spriteCacheMap = new Map();
const SPRITE_PAD = 6;

function getSpriteKey(stitch, color, size, isSuggestion) {
    return `${stitch}|${color}|${size}|${isSuggestion ? 1 : 0}`;
}

function clearSpriteCache() {
    spriteCacheMap.clear();
}

export function clearAllSprites() {
    spriteCacheMap.clear();
}

function getStitchSprite(stitch, color, size, isSuggestion) {
    const key = getSpriteKey(stitch, color, size, isSuggestion);
    let sprite = spriteCacheMap.get(key);
    if (sprite) return sprite;

    const dim = Math.ceil(size * 2.5) + SPRITE_PAD * 2;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = dim;
    offCanvas.height = dim;
    const oc = offCanvas.getContext('2d');

    // Draw the stitch onto this mini-canvas
    oc.translate(dim / 2, dim / 2);
    _drawStitchToCtx(oc, stitch, color, size, isSuggestion);

    sprite = { canvas: offCanvas, halfDim: dim / 2 };
    spriteCacheMap.set(key, sprite);
    return sprite;
}

// Internal: draw a single stitch onto any context (centered at 0,0)
function _drawStitchToCtx(c, stitch, color, size, isSuggestion) {
    const scale = size / 22;
    const bgRadius = size * 0.7;

    c.lineWidth = 2;
    c.strokeStyle = color;
    c.fillStyle = color;

    if (isSuggestion) {
        c.fillStyle = 'rgba(40, 167, 69, 0.3)';
        c.beginPath();
        c.arc(0, 0, bgRadius, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#28a745';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, bgRadius, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = '#28a745';
        c.fillStyle = '#28a745';
        color = '#28a745';
    }

    // Check if we have a cached SVG for this stitch
    const svgFile = stitchSvgFiles[stitch];
    if (svgFile && svgImageCache.has(svgFile)) {
        const img = svgImageCache.get(svgFile);
        if (img && img.complete) {
            const svgViewBox = {
                'Frame 1.svg': { width: 68, height: 62 },
                'Frame 2.svg': { width: 26, height: 11 },
                'Frame 3.svg': { width: 26, height: 11 },
                'Frame 4.svg': { width: 33, height: 112 },
                'Frame 5.svg': { width: 44, height: 80 },
                'Frame 6.svg': { width: 32, height: 109 },
                'Frame 7.svg': { width: 33, height: 138 },
                'Frame 8.svg': { width: 64, height: 46 },
                'Frame 9.svg': { width: 32, height: 109 },
                'Frame 10.svg': { width: 64, height: 85 },
                'Frame 11.svg': { width: 36, height: 70 },
                'Frame 12.svg': { width: 170, height: 79 },
                'Frame 13.svg': { width: 52, height: 47 },
                'Frame 14.svg': { width: 33, height: 84 },
                'Frame 15.svg': { width: 33, height: 66 },
                'Frame 16.svg': { width: 30, height: 42 },
                'Frame 17.svg': { width: 40, height: 20 },
                'Frame 18.svg': { width: 16, height: 16 },
                'Frame 19.svg': { width: 45, height: 82 },
                'Frame 20.svg': { width: 35, height: 35 }
            };
            const viewBox = svgViewBox[svgFile] || { width: 50, height: 50 };
            const aspectRatio = viewBox.width / viewBox.height;
            const drawHeight = size * 1.2;
            const drawWidth = drawHeight * aspectRatio;

            if (color !== '#000000' && color !== '#2C2E35') {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewBox.width;
                tempCanvas.height = viewBox.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = color;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                c.drawImage(tempCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            } else {
                c.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            }
            return;
        }
    }

    // Fallback: Canvas API drawing (same switch-case as before)
    _drawStitchFallback(c, stitch, color, scale, size);
}

function _drawStitchFallback(c, stitch, color, scale, size) {
    c.strokeStyle = color;
    c.fillStyle = color;

    switch(stitch) {
        case 'chain':
            c.lineWidth = 4 * scale;
            c.beginPath();
            c.ellipse(0, 0, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
            c.stroke();
            break;
        case 'slip':
            c.beginPath();
            c.arc(0, 0, 8 * scale, 0, Math.PI * 2);
            c.fill();
            break;
        case 'sc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-14 * scale, -14 * scale);
            c.lineTo(14 * scale, 14 * scale);
            c.moveTo(14 * scale, -14 * scale);
            c.lineTo(-14 * scale, 14 * scale);
            c.stroke();
            break;
        case 'hdc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-16.5 * scale, -8 * scale);
            c.lineTo(16.5 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-14.8 * scale, -8 * scale);
            c.quadraticCurveTo(-2.8 * scale, 17.5 * scale, 14.5 * scale, 8 * scale);
            c.moveTo(20.95 * scale, -8 * scale);
            c.quadraticCurveTo(38.67 * scale, 17.4 * scale, 21.63 * scale, 8 * scale);
            c.stroke();
            break;
        case 'dc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5 * scale, -2 * scale);
            c.lineTo(5 * scale, 2 * scale);
            c.stroke();
            break;
        case 'tr':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5 * scale, -5 * scale);
            c.lineTo(5 * scale, -1 * scale);
            c.moveTo(-5 * scale, -1 * scale);
            c.lineTo(5 * scale, 3 * scale);
            c.moveTo(-5 * scale, 3 * scale);
            c.lineTo(5 * scale, 7 * scale);
            c.stroke();
            break;
        case 'dtr':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-16 * scale, -8 * scale);
            c.lineTo(16 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5.5 * scale, -1 * scale);
            c.lineTo(5.5 * scale, 2 * scale);
            c.moveTo(-5.5 * scale, 2 * scale);
            c.lineTo(5.5 * scale, 5 * scale);
            c.moveTo(-5.5 * scale, 5 * scale);
            c.lineTo(5.5 * scale, 8 * scale);
            c.stroke();
            break;
        case 'sc2tog': {
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            const sx = -12 * scale, ex = 12 * scale, sy = 4.4 * scale;
            c.moveTo(sx, sy);
            c.quadraticCurveTo(0, -4.4 * scale, ex, sy);
            c.stroke();
            break;
        }
        case 'sc3tog':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(0, -8 * scale);
            c.lineTo(-12 * scale, 8 * scale);
            c.lineTo(12 * scale, 8 * scale);
            c.closePath();
            c.stroke();
            break;
        case 'dc2tog':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-10.5 * scale, -1 * scale);
            c.lineTo(-6.5 * scale, 2 * scale);
            c.moveTo(6.5 * scale, -1 * scale);
            c.lineTo(10.5 * scale, 2 * scale);
            c.moveTo(-21.5 * scale, 8 * scale);
            c.quadraticCurveTo(0, 4 * scale, 21.5 * scale, 8 * scale);
            c.stroke();
            break;
        case 'dc3tog':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-16 * scale, -8 * scale);
            c.lineTo(16 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5.5 * scale, 0.5 * scale);
            c.lineTo(5.5 * scale, 3.5 * scale);
            c.moveTo(-5.5 * scale, 3.5 * scale);
            c.lineTo(5.5 * scale, 6.5 * scale);
            c.moveTo(-5.5 * scale, 6.5 * scale);
            c.lineTo(5.5 * scale, 9.5 * scale);
            c.stroke();
            break;
        case 'cluster-3dc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-17.5 * scale, -8 * scale);
            c.lineTo(17.5 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-8.4 * scale, 0.5 * scale);
            c.lineTo(-5.2 * scale, 3.5 * scale);
            c.moveTo(0, 0.5 * scale);
            c.lineTo(3.2 * scale, 3.5 * scale);
            c.moveTo(8.4 * scale, 0.5 * scale);
            c.lineTo(11.6 * scale, 3.5 * scale);
            c.stroke();
            break;
        case 'cluster-3hdc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.ellipse(0, 0, 5 * scale, 8 * scale, 0, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            c.moveTo(0, -6 * scale);
            c.lineTo(0, 6 * scale);
            c.stroke();
            break;
        case 'popcorn-5dc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.ellipse(0, 0, 4 * scale, 8 * scale, 0, 0, Math.PI * 2);
            c.stroke();
            c.lineWidth = 1.5 * scale;
            c.beginPath();
            for (let i = -2; i <= 2; i++) {
                c.moveTo(i * 1.5 * scale, -6 * scale);
                c.lineTo(i * 1.5 * scale, 6 * scale);
            }
            c.stroke();
            break;
        case 'shell-5dc': {
            c.lineWidth = 3.12 * scale;
            const cx2 = 0, cy2 = 4 * scale, sr = 8 * scale;
            const sa = -Math.PI / 2.5, ea = Math.PI / 2.5;
            for (let i = 0; i < 5; i++) {
                const a = sa + (ea - sa) * (i / 4);
                const ex2 = cx2 + Math.cos(a) * sr;
                const ey2 = cy2 - Math.sin(a) * sr;
                c.beginPath();
                c.moveTo(cx2, cy2);
                c.lineTo(ex2, ey2 - 4 * scale);
                c.moveTo(ex2 - 2.5 * scale, ey2 - 5 * scale);
                c.lineTo(ex2 + 2.5 * scale, ey2 - 3 * scale);
                c.stroke();
            }
            break;
        }
        case 'picot-ch3':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.arc(0, 0, 3 * scale, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.moveTo(2 * scale, -2 * scale);
            c.quadraticCurveTo(4 * scale, -4 * scale, 6 * scale, -2 * scale);
            c.stroke();
            break;
        case 'fpdc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-16 * scale, -8 * scale);
            c.lineTo(16 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5.5 * scale, 0.5 * scale);
            c.lineTo(5.5 * scale, 3.5 * scale);
            c.stroke();
            c.beginPath();
            c.arc(15.5 * scale, 8 * scale, 7.5 * scale, Math.PI, 0, false);
            c.stroke();
            break;
        case 'bpdc':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.moveTo(-16 * scale, -8 * scale);
            c.lineTo(16 * scale, -8 * scale);
            c.moveTo(0, -8 * scale);
            c.lineTo(0, 8 * scale);
            c.moveTo(-5.5 * scale, 0.5 * scale);
            c.lineTo(5.5 * scale, 3.5 * scale);
            c.stroke();
            c.beginPath();
            c.arc(-15.5 * scale, 8 * scale, 7.5 * scale, 0, Math.PI, false);
            c.stroke();
            break;
        case 'blo':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.arc(-3 * scale, 0, 3 * scale, -Math.PI / 2, Math.PI / 2, false);
            c.stroke();
            break;
        case 'flo':
            c.lineWidth = 3.12 * scale;
            c.beginPath();
            c.arc(3 * scale, 0, 3 * scale, Math.PI / 2, -Math.PI / 2, false);
            c.stroke();
            break;
        default: {
            c.font = `bold ${size}px Arial`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            const symbol = getStitchSymbol(stitch);
            c.fillText(symbol && symbol !== '?' ? symbol : '?', 0, 0);
            break;
        }
    }
}

export function invalidateGridCache() {
    gridDirty = true;
}

// Export function to get SVG image from cache
export function getSvgImageFromCache(filename) {
    return svgImageCache.get(filename) || null;
}

// Load SVG file as Image
function loadSvgImage(filename) {
    return new Promise((resolve, reject) => {
        if (svgImageCache.has(filename)) {
            resolve(svgImageCache.get(filename));
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            svgImageCache.set(filename, img);
            resolve(img);
        };
        img.onerror = () => {
            console.error('Error loading SVG:', filename);
            reject(new Error(`Failed to load SVG: ${filename}`));
        };
        img.src = `src/assets/symbols/${filename}`;
    });
}

// Preload all SVG files
export async function preloadSvgSymbols() {
    const svgFiles = Object.values(stitchSvgFiles);
    const uniqueFiles = [...new Set(svgFiles)];
    
    try {
        await Promise.all(uniqueFiles.map(file => loadSvgImage(file)));
        console.log('All SVG symbols preloaded');
    } catch (error) {
        console.error('Error preloading SVG symbols:', error);
    }
}

export function initCanvas(canvasElement) {
    try {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        canvasContainer = canvas.parentElement;
        
        if (!canvas || !ctx) {
            throw new Error('Canvas või context ei leitud');
        }
        
        // Use a balanced canvas size: large enough for ample drawing space
        // but not so large that it causes performance issues
        // 1200x1200 = 1.44M pixels (vs 3000x3000 = 9M pixels — 6x improvement)
        const size = 1200;
        canvas.width = size;
        canvas.height = size;
        state.canvasSize = size;
        
        // Center the view on canvas center initially
        if (canvasContainer) {
            canvasContainer.scrollLeft = (canvas.width - canvasContainer.clientWidth) / 2;
            canvasContainer.scrollTop = (canvas.height - canvasContainer.clientHeight) / 2;
        }
        
        // Initialize zoom to 100%
        state.zoomLevel = 1.0;
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = '100%';
        }
        const drawerZoomEl = document.getElementById('drawerZoomLevel');
        if (drawerZoomEl) {
            drawerZoomEl.textContent = '100%';
        }
        
        // Initialize grid cache
        gridDirty = true;
        redrawStitches();
    } catch (error) {
        console.error('Error initializing canvas:', error);
        alert('Viga canvas\'i initsialiseerimisel: ' + error.message);
    }
}

export function getCanvas() {
    return canvas;
}

export function getContext() {
    return ctx;
}

export function getCenter() {
    return { x: canvas.width / 2, y: canvas.height / 2 };
}

export function getDistanceFromCenter(x, y) {
    const center = getCenter();
    return Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
}

export function getAngleFromCenter(x, y) {
    const center = getCenter();
    return Math.atan2(y - center.y, x - center.x);
}

export function drawGrid() {
    // Use cached grid if available
    if (!gridDirty && gridCacheCanvas && gridCacheCanvas.width === canvas.width) {
        ctx.drawImage(gridCacheCanvas, 0, 0);
        return;
    }

    // Create or resize offscreen grid canvas
    if (!gridCacheCanvas) {
        gridCacheCanvas = document.createElement('canvas');
        gridCacheCtx = gridCacheCanvas.getContext('2d');
    }
    gridCacheCanvas.width = canvas.width;
    gridCacheCanvas.height = canvas.height;
    const gc = gridCacheCtx;

    const size = canvas.width;
    const center = size / 2;
    const isDark = document.body.classList.contains('dark-mode');

    gc.strokeStyle = isDark ? '#2a2a2a' : '#e9ecef';
    gc.lineWidth = 1;

    if (state.currentShape === 'circle' || state.currentShape === 'hexagon' || state.currentShape === 'octagon') {
        // Batch all concentric circles into one path
        const spacing = 40;
        gc.beginPath();
        for (let r = spacing; r < size; r += spacing) {
            gc.moveTo(center + r, center);
            gc.arc(center, center, r, 0, Math.PI * 2);
        }
        gc.stroke();

        // Batch all radial lines into one path
        const divisions = state.currentShape === 'hexagon' ? 6 : state.currentShape === 'octagon' ? 8 : 12;
        gc.beginPath();
        for (let i = 0; i < divisions; i++) {
            const angle = (Math.PI * 2 * i) / divisions;
            gc.moveTo(center, center);
            gc.lineTo(center + Math.cos(angle) * size, center + Math.sin(angle) * size);
        }
        gc.stroke();
    } else {
        // Square / freeform: batch ALL grid lines into a single path
        const spacing = 30;
        gc.beginPath();
        for (let i = 0; i <= size; i += spacing) {
            gc.moveTo(i, 0);
            gc.lineTo(i, size);
            gc.moveTo(0, i);
            gc.lineTo(size, i);
        }
        gc.stroke();
    }

    // Also draw shape guide into the cache
    _drawShapeGuideToCtx(gc);

    gridDirty = false;
    ctx.drawImage(gridCacheCanvas, 0, 0);
}

function _drawShapeGuideToCtx(c) {
    const size = canvas.width;
    const center = size / 2;
    const radius = Math.min(size / 2 - 60, 500);

    c.strokeStyle = '#6B8CAE';
    c.lineWidth = 2;
    c.setLineDash([5, 5]);

    switch (state.currentShape) {
        case 'circle':
            c.beginPath();
            c.arc(center, center, radius, 0, Math.PI * 2);
            c.stroke();
            break;
        case 'square': {
            const sq = radius * 1.4;
            c.strokeRect(center - sq / 2, center - sq / 2, sq, sq);
            break;
        }
        case 'hexagon':
            _drawPolygonToCtx(c, center, center, radius, 6);
            break;
        case 'triangle':
            _drawPolygonToCtx(c, center, center, radius, 3);
            break;
        case 'octagon':
            _drawPolygonToCtx(c, center, center, radius, 8);
            break;
        case 'freeform':
            break;
    }
    c.setLineDash([]);
}

function _drawPolygonToCtx(c, x, y, radius, sides) {
    c.beginPath();
    for (let i = 0; i <= sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
    }
    c.stroke();
}

// drawShapeGuide is now integrated into the grid cache (see _drawShapeGuideToCtx)
// This stub is kept for backward compatibility with callers
export function drawShapeGuide() {
    // Shape guide is now drawn as part of the grid cache
    // If grid is fresh, the shape guide is already there
    // This is called separately only in edge cases
}

export function drawStitch(x, y, stitch, color, isSuggestion = false, size = 22, rotation = 0) {
    const sprite = getStitchSprite(stitch, color, size, isSuggestion);
    const hd = sprite.halfDim;

    if (rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(sprite.canvas, -hd, -hd);
        ctx.restore();
    } else {
        // No rotation — skip save/restore entirely (fastest path)
        ctx.drawImage(sprite.canvas, x - hd, y - hd);
    }
}

export function redrawStitches() {
    try {
        if (!canvas || !ctx) {
            console.error('Canvas või context puudub');
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(); // Uses cached offscreen canvas (includes shape guide)
    
    // Draw suggestions
    state.suggestions.forEach(s => {
        drawStitch(s.x, s.y, s.stitch, s.color, true, s.size, s.rotation);
    });
    
    // Draw stitches
    if (state.showAllLayers) {
        state.layers.forEach((layer, index) => {
            if (layer.visible) {
                const isActive = index === state.currentLayerIndex;
                layer.stitches.forEach((s, stitchIndex) => {
                    const isSelected = state.selectedStitches.includes(stitchIndex);
                    if (!isActive) {
                        ctx.globalAlpha = 0.3;
                        drawStitch(s.x, s.y, s.stitch, s.color, false, s.size || 22, s.rotation || 0);
                        ctx.globalAlpha = 1.0;
                    } else {
                        drawStitch(s.x, s.y, s.stitch, s.color, false, s.size || 22, s.rotation || 0);
                    }
                    // Highlight selected stitches
                    if (isSelected && isActive) {
                        ctx.strokeStyle = '#0066ff';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(s.x - 15, s.y - 15, 30, 30);
                        ctx.setLineDash([]);
                    }
                });
            }
        });
    } else {
        const currentLayer = getCurrentLayer();
        currentLayer.stitches.forEach((s, stitchIndex) => {
            const isSelected = state.selectedStitches.includes(stitchIndex);
            drawStitch(s.x, s.y, s.stitch, s.color, false, s.size || 22, s.rotation || 0);
            // Highlight selected stitches
            if (isSelected) {
                ctx.strokeStyle = '#0066ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(s.x - 15, s.y - 15, 30, 30);
                ctx.setLineDash([]);
            }
        });
    }
    
    // Draw selection rectangle (for select tool)
    if (state.selectionStart && state.selectionEnd && state.currentToolMode === 'select') {
        const minX = Math.min(state.selectionStart.x, state.selectionEnd.x);
        const maxX = Math.max(state.selectionStart.x, state.selectionEnd.x);
        const minY = Math.min(state.selectionStart.y, state.selectionEnd.y);
        const maxY = Math.max(state.selectionStart.y, state.selectionEnd.y);
        
        ctx.strokeStyle = '#0066ff';
        ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
    }
    
    // Draw bounding box with handles for selected stitches (move tool)
    if (state.currentToolMode === 'move' && state.selectedStitches.length > 0) {
        drawSelectionBoundingBox();
    }
    
    // Draw notes
    drawNotes();
    
    // Draw line preview (when drawing a line)
    if (state.currentToolMode === 'line' && state.lineStartPoint && state.linePreview) {
        ctx.strokeStyle = state.currentColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(state.lineStartPoint.x, state.lineStartPoint.y);
        ctx.lineTo(state.linePreview.x, state.linePreview.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw preview stitches along the line
        const distance = Math.sqrt(
            Math.pow(state.linePreview.x - state.lineStartPoint.x, 2) + 
            Math.pow(state.linePreview.y - state.lineStartPoint.y, 2)
        );
        const steps = Math.max(1, Math.floor(distance / 30));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = state.lineStartPoint.x + (state.linePreview.x - state.lineStartPoint.x) * t;
            const y = state.lineStartPoint.y + (state.linePreview.y - state.lineStartPoint.y) * t;
            
            // Draw preview stitch (semi-transparent)
            ctx.save();
            ctx.globalAlpha = 0.5;
            const center = getCenter();
            const angleFromCenter = Math.atan2(y - center.y, x - center.x);
            const rotationTowardsCenter = (angleFromCenter * 180 / Math.PI) + 180 + state.currentRotation;
            
            drawStitch(x, y, state.currentStitch, state.currentColor, false, state.currentStitchSize, rotationTowardsCenter);
            ctx.restore();
        }
    }
    } catch (error) {
        console.error('Error in redrawStitches:', error);
    }
}

/**
 * Joonistab märkused canvas'ile
 */
function drawNotes() {
    if (!state.notes || state.notes.length === 0) return;
    
    state.notes.forEach(note => {
        // Draw note icon (small circle with text icon)
        ctx.fillStyle = '#FFA500';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;
        
        // Draw circle background
        ctx.beginPath();
        ctx.arc(note.x, note.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw text icon (📝 symbol or simple "N")
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📝', note.x, note.y);
    });
}

/**
 * Joonistab valitud pisteide ümber bounding box'i koos handle'itega
 */
function drawSelectionBoundingBox() {
    if (state.selectedStitches.length === 0) return;
    
    const stitches = getCurrentStitches();
    if (stitches.length === 0) return;
    
    // Arvuta bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    state.selectedStitches.forEach(index => {
        const stitch = stitches[index];
        if (!stitch) return;
        minX = Math.min(minX, stitch.x - 15);
        minY = Math.min(minY, stitch.y - 15);
        maxX = Math.max(maxX, stitch.x + 15);
        maxY = Math.max(maxY, stitch.y + 15);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Joonista bounding box (katkendjoon)
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(minX, minY, width, height);
    ctx.setLineDash([]);
    
    // Joonista 4 handle'i nurkades (resize jaoks - sinised ruudud)
    const handleSize = 8;
    const resizeHandles = [
        { x: minX, y: minY, type: 'resize' },           // Üleval vasakul
        { x: maxX, y: minY, type: 'resize' },           // Üleval paremal
        { x: maxX, y: maxY, type: 'resize' },           // All paremal
        { x: minX, y: maxY, type: 'resize' }            // All vasakul
    ];
    
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Joonista resize handle'id (ruudud)
    resizeHandles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
        ctx.strokeRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
    });
    
    // Joonista rotate handle (üleval keskel - ring)
    const rotateHandleY = minY - 25; // Üleval katkendjoone kohal
    ctx.beginPath();
    ctx.arc(centerX, rotateHandleY, handleSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Joonista joon rotate handle'i ja katkendjoone vahel
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX, minY);
    ctx.lineTo(centerX, rotateHandleY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Joonista ka keskpunkt (valikuline, kui rohkem kui üks element)
    if (state.selectedStitches.length > 1) {
        ctx.fillStyle = '#0066ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Kontrollib, kas punkt on handle'i peal
 * Tagastab handle'i objekti või null
 */
export function getHandleAtPoint(x, y) {
    if (state.selectedStitches.length === 0) return null;
    
    const stitches = getCurrentStitches();
    if (stitches.length === 0) return null;
    
    // Arvuta bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    state.selectedStitches.forEach(index => {
        const stitch = stitches[index];
        if (!stitch) return;
        minX = Math.min(minX, stitch.x - 15);
        minY = Math.min(minY, stitch.y - 15);
        maxX = Math.max(maxX, stitch.x + 15);
        maxY = Math.max(maxY, stitch.y + 15);
    });
    
    const centerX = (minX + maxX) / 2;
    
    // Arvuta rotate handle (üleval keskel)
    const rotateHandleY = minY - 25;
    
    const handles = [
        { x: minX, y: minY, type: 'resize', index: 0 },      // Üleval vasakul (resize)
        { x: maxX, y: minY, type: 'resize', index: 1 },      // Üleval paremal (resize)
        { x: maxX, y: maxY, type: 'resize', index: 2 },      // All paremal (resize)
        { x: minX, y: maxY, type: 'resize', index: 3 },      // All vasakul (resize)
        { x: centerX, y: rotateHandleY, type: 'rotate', index: 4 }  // Üleval keskel (rotate)
    ];
    
    const handleSize = 12; // Slightly larger for easier clicking
    
    for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        const dist = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
        if (dist < handleSize) {
            return { index: handle.index, type: handle.type, x: handle.x, y: handle.y };
        }
    }
    
    return null;
}

/**
 * Arvutab valitud pisteide keskpunkti
 */
export function getSelectedStitchesCenter() {
    if (state.selectedStitches.length === 0) return null;
    
    const stitches = getCurrentStitches();
    let sumX = 0, sumY = 0;
    let count = 0;
    
    state.selectedStitches.forEach(index => {
        const stitch = stitches[index];
        if (stitch) {
            sumX += stitch.x;
            sumY += stitch.y;
            count++;
        }
    });
    
    if (count === 0) return null;
    
    return { x: sumX / count, y: sumY / count };
}

// ============================================
// ZOOM FUNCTIONS
// ============================================

/**
 * Zoom in/out funktsioon
 */
export function zoom(delta) {
    try {
        const oldZoom = state.zoomLevel;
        state.zoomLevel += delta;
        state.zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoomLevel));
        
        // Update zoom display
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = Math.round(state.zoomLevel * 100) + '%';
        }
        const drawerZoomEl = document.getElementById('drawerZoomLevel');
        if (drawerZoomEl) {
            drawerZoomEl.textContent = Math.round(state.zoomLevel * 100) + '%';
        }
        
        // Apply zoom to canvas via CSS transform (no redraw needed)
        if (canvas && canvasContainer) {
            const scale = state.zoomLevel;
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'center center';
        }
    } catch (error) {
        console.error('Error in zoom:', error);
        alert('Viga zoom\'i muutmisel: ' + error.message);
    }
}

/**
 * Zoom to fit screen
 */
export function zoomToFit() {
    try {
        if (!canvas || !canvasContainer) return;
        
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const scaleX = containerWidth / canvasWidth;
        const scaleY = containerHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
        
        state.zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
        
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = Math.round(state.zoomLevel * 100) + '%';
        }
        const drawerZoomEl2 = document.getElementById('drawerZoomLevel');
        if (drawerZoomEl2) {
            drawerZoomEl2.textContent = Math.round(state.zoomLevel * 100) + '%';
        }
        
        canvas.style.transform = `scale(${state.zoomLevel})`;
        canvas.style.transformOrigin = 'center center';
    } catch (error) {
        console.error('Error in zoomToFit:', error);
    }
}

/**
 * Reset zoom to 100%
 */
export function zoomReset() {
    try {
        state.zoomLevel = 1.0;
        
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = '100%';
        }
        const drawerZoomEl3 = document.getElementById('drawerZoomLevel');
        if (drawerZoomEl3) {
            drawerZoomEl3.textContent = '100%';
        }
        
        if (canvas) {
            canvas.style.transform = 'scale(1)';
            canvas.style.transformOrigin = 'center center';
        }
        
        panOffset = { x: 0, y: 0 };
    } catch (error) {
        console.error('Error in zoomReset:', error);
    }
}

/**
 * Handle mouse wheel zoom
 */
export function setupWheelZoom() {
    try {
        const canvasArea = document.querySelector('.canvas-area');
        if (!canvasArea) return;
        
        canvasArea.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                zoom(delta);
            }
        }, { passive: false });
    } catch (error) {
        console.error('Error setting up wheel zoom:', error);
    }
}

