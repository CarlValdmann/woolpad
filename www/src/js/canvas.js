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
        
        // Set canvas to large size for infinite/scrollable canvas
        // Use a large fixed size (3000x3000) for endless drawing
        const size = 3000;
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
        
        drawGrid();
        drawShapeGuide();
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
    const size = canvas.width;
    const center = size / 2;
    const isDark = document.body.classList.contains('dark-mode');
    
    ctx.strokeStyle = isDark ? '#2a2a2a' : '#e9ecef';
    ctx.lineWidth = 1;
    
    if (state.currentShape === 'circle' || state.currentShape === 'hexagon' || state.currentShape === 'octagon') {
        // Draw concentric circles that extend across the entire canvas
        const spacing = 40;
        for (let r = spacing; r < size; r += spacing) {
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw radial lines that extend across the entire canvas
        const divisions = state.currentShape === 'hexagon' ? 6 : state.currentShape === 'octagon' ? 8 : 12;
        for (let i = 0; i < divisions; i++) {
            const angle = (Math.PI * 2 * i) / divisions;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(
                center + Math.cos(angle) * size,
                center + Math.sin(angle) * size
            );
            ctx.stroke();
        }
    } else if (state.currentShape === 'square') {
        // Draw grid lines across the entire canvas
        const spacing = 30;
        for (let i = 0; i <= size; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }
    } else {
        // For freeform, draw a simple grid across entire canvas
        const spacing = 30;
        for (let i = 0; i <= size; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }
    }
}

export function drawShapeGuide() {
    const size = canvas.width;
    const center = size / 2;
    // Use a reasonable radius for the guide (not too large)
    const radius = Math.min(size / 2 - 60, 500);
    
    ctx.strokeStyle = '#6B8CAE';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    switch (state.currentShape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 'square':
            const squareSize = radius * 1.4;
            ctx.strokeRect(
                center - squareSize / 2,
                center - squareSize / 2,
                squareSize,
                squareSize
            );
            break;
            
        case 'hexagon':
            drawPolygon(center, center, radius, 6);
            break;
            
        case 'triangle':
            drawPolygon(center, center, radius, 3);
            break;
            
        case 'octagon':
            drawPolygon(center, center, radius, 8);
            break;
            
        case 'freeform':
            // No guide for freeform
            break;
    }
    
    ctx.setLineDash([]);
}

function drawPolygon(x, y, radius, sides) {
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
}

export function drawStitch(x, y, stitch, color, isSuggestion = false, size = 22, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    const bgRadius = size * 0.7;
    const scale = size / 22; // Scale factor based on size
    
    if (isSuggestion) {
        ctx.fillStyle = 'rgba(40, 167, 69, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, bgRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, bgRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#28a745';
        ctx.fillStyle = '#28a745';
    }
    
    // Check if we have an SVG file for this stitch and it's already loaded
    const svgFile = stitchSvgFiles[stitch];
    
    if (svgFile && svgImageCache.has(svgFile)) {
        // Use SVG file directly from cache
        const img = svgImageCache.get(svgFile);
        if (img && img.complete) {
            // Calculate dimensions to fit the size
            // SVG viewBox dimensions from files (approximate)
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
            
            // Scale to fit the desired size (use height as reference)
            const drawHeight = size * 1.2;
            const drawWidth = drawHeight * aspectRatio;
            
            // Apply color filter if needed (for non-black colors)
            if (color !== '#000000' && color !== '#2C2E35') {
                // Create a temporary canvas to apply color
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewBox.width;
                tempCanvas.height = viewBox.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Apply color overlay
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = color;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                ctx.drawImage(tempCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            } else {
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            }
            
            ctx.restore();
            return;
        }
    }
    
    // Fallback: Draw using Canvas API (for custom stitches or if SVG fails)
    // Draw specific symbols using Canvas API to match SVG files exactly
    // Based on Frame 1-20.svg from /Users/admin/Downloads/Untitled-2/
    switch(stitch) {
        case 'chain':
            // Frame 17: Simple horizontal ellipse (for basic chain)
            // Frame 1: 3 ellipses + filled circle at bottom (for complex chain representation)
            // Using Frame 17 for standard chain symbol
            ctx.lineWidth = 4 * scale;
            ctx.beginPath();
            ctx.ellipse(0, 0, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 'slip':
            // Frame 18: Filled circle
            ctx.beginPath();
            ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'sc':
            // Frame 16: X shape (diagonal cross)
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.moveTo(-14 * scale, -14 * scale);
            ctx.lineTo(14 * scale, 14 * scale);
            ctx.moveTo(14 * scale, -14 * scale);
            ctx.lineTo(-14 * scale, 14 * scale);
            ctx.stroke();
            break;
            
        case 'hdc':
            // Frame 11: Vertical line with 2 curved lines (left and right)
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-16.5 * scale, -8 * scale);
            ctx.lineTo(16.5 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Left curved line
            ctx.moveTo(-14.8 * scale, -8 * scale);
            ctx.quadraticCurveTo(-2.8 * scale, 17.5 * scale, 14.5 * scale, 8 * scale);
            // Right curved line
            ctx.moveTo(20.95 * scale, -8 * scale);
            ctx.quadraticCurveTo(38.67 * scale, 17.4 * scale, 21.63 * scale, 8 * scale);
            ctx.stroke();
            break;
            
        case 'dc':
            // Frame 14: Vertical line with single diagonal
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Diagonal line
            ctx.moveTo(-5 * scale, -2 * scale);
            ctx.lineTo(5 * scale, 2 * scale);
            ctx.stroke();
            break;
            
        case 'tr':
            // Frame 19: Vertical line with 3 diagonals
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Three diagonal lines
            ctx.moveTo(-5 * scale, -5 * scale);
            ctx.lineTo(5 * scale, -1 * scale);
            ctx.moveTo(-5 * scale, -1 * scale);
            ctx.lineTo(5 * scale, 3 * scale);
            ctx.moveTo(-5 * scale, 3 * scale);
            ctx.lineTo(5 * scale, 7 * scale);
            ctx.stroke();
            break;
            
        case 'dtr':
            // Frame 7: Vertical line with 3 diagonals
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-16 * scale, -8 * scale);
            ctx.lineTo(16 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Three diagonal lines
            ctx.moveTo(-5.5 * scale, -1 * scale);
            ctx.lineTo(5.5 * scale, 2 * scale);
            ctx.moveTo(-5.5 * scale, 2 * scale);
            ctx.lineTo(5.5 * scale, 5 * scale);
            ctx.moveTo(-5.5 * scale, 5 * scale);
            ctx.lineTo(5.5 * scale, 8 * scale);
            ctx.stroke();
            break;
            
        case 'sc2tog':
            // Frame 2: Curved inverted V
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Curved path from bottom-left to bottom-right
            const sc2togStartX = -12 * scale;
            const sc2togEndX = 12 * scale;
            const sc2togY = 4.4 * scale;
            ctx.moveTo(sc2togStartX, sc2togY);
            ctx.quadraticCurveTo(0, -4.4 * scale, sc2togEndX, sc2togY);
            ctx.stroke();
            break;
            
        case 'sc3tog':
            // Frame 3: Curved inverted V (other direction) or Frame 13: Triangle
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Triangle shape
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(-12 * scale, 8 * scale);
            ctx.lineTo(12 * scale, 8 * scale);
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'dc2tog':
            // Frame 5: Inverted V with vertical line and 2 diagonals + curve
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Main vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Left diagonal
            ctx.moveTo(-10.5 * scale, -1 * scale);
            ctx.lineTo(-6.5 * scale, 2 * scale);
            // Right diagonal
            ctx.moveTo(6.5 * scale, -1 * scale);
            ctx.lineTo(10.5 * scale, 2 * scale);
            // Curved bottom
            ctx.moveTo(-21.5 * scale, 8 * scale);
            ctx.quadraticCurveTo(0, 4 * scale, 21.5 * scale, 8 * scale);
            ctx.stroke();
            break;
            
        case 'dc3tog':
            // Frame 4: Vertical line with 3 diagonals
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-16 * scale, -8 * scale);
            ctx.lineTo(16 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Three diagonal lines
            ctx.moveTo(-5.5 * scale, 0.5 * scale);
            ctx.lineTo(5.5 * scale, 3.5 * scale);
            ctx.moveTo(-5.5 * scale, 3.5 * scale);
            ctx.lineTo(5.5 * scale, 6.5 * scale);
            ctx.moveTo(-5.5 * scale, 6.5 * scale);
            ctx.lineTo(5.5 * scale, 9.5 * scale);
            ctx.stroke();
            break;
            
        case 'cluster-3dc':
            // Frame 20: Vertical line with 3 diagonals + horizontal
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-17.5 * scale, -8 * scale);
            ctx.lineTo(17.5 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Three diagonal lines
            ctx.moveTo(-8.4 * scale, 0.5 * scale);
            ctx.lineTo(-5.2 * scale, 3.5 * scale);
            ctx.moveTo(0, 0.5 * scale);
            ctx.lineTo(3.2 * scale, 3.5 * scale);
            ctx.moveTo(8.4 * scale, 0.5 * scale);
            ctx.lineTo(11.6 * scale, 3.5 * scale);
            ctx.stroke();
            break;
            
        case 'cluster-3hdc':
            // Similar to cluster-3dc but simpler
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.stroke();
            break;
            
        case 'popcorn-5dc':
            // Similar to cluster but with 5 vertical lines
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.ellipse(0, 0, 4 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            for (let i = -2; i <= 2; i++) {
                ctx.moveTo(i * 1.5 * scale, -6 * scale);
                ctx.lineTo(i * 1.5 * scale, 6 * scale);
            }
            ctx.stroke();
            ctx.lineWidth = 3.12 * scale; // Reset
            break;
            
        case 'shell-5dc':
            // Frame 8, 10, 12: Fan shape with 5 DC stitches
            ctx.lineWidth = 3.12 * scale;
            const centerX = 0;
            const centerY = 4 * scale;
            const shellRadius = 8 * scale;
            const shellStartAngle = -Math.PI / 2.5;
            const shellEndAngle = Math.PI / 2.5;
            
            for (let i = 0; i < 5; i++) {
                const angle = shellStartAngle + (shellEndAngle - shellStartAngle) * (i / 4);
                const endX = centerX + Math.cos(angle) * shellRadius;
                const endY = centerY - Math.sin(angle) * shellRadius;
                
                ctx.beginPath();
                // Vertical line from center to top
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(endX, endY - 4 * scale);
                // Diagonal line crossing
                ctx.moveTo(endX - 2.5 * scale, endY - 5 * scale);
                ctx.lineTo(endX + 2.5 * scale, endY - 3 * scale);
                ctx.stroke();
            }
            break;
            
        case 'picot-ch3':
            // Circle with loop
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(2 * scale, -2 * scale);
            ctx.quadraticCurveTo(4 * scale, -4 * scale, 6 * scale, -2 * scale);
            ctx.stroke();
            break;
            
        case 'fpdc':
            // Frame 6: Vertical line + horizontal + curve to right
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-16 * scale, -8 * scale);
            ctx.lineTo(16 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Diagonal line
            ctx.moveTo(-5.5 * scale, 0.5 * scale);
            ctx.lineTo(5.5 * scale, 3.5 * scale);
            // Curve to right
            ctx.arc(15.5 * scale, 8 * scale, 7.5 * scale, Math.PI, 0, false);
            ctx.stroke();
            break;
            
        case 'bpdc':
            // Frame 9: Vertical line + horizontal + curve to left
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            // Horizontal line at top
            ctx.moveTo(-16 * scale, -8 * scale);
            ctx.lineTo(16 * scale, -8 * scale);
            // Vertical line
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Diagonal line
            ctx.moveTo(-5.5 * scale, 0.5 * scale);
            ctx.lineTo(5.5 * scale, 3.5 * scale);
            // Curve to left
            ctx.arc(-15.5 * scale, 8 * scale, 7.5 * scale, 0, Math.PI, false);
            ctx.stroke();
            break;
            
        case 'blo':
            // Left parenthesis (back loop only)
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.arc(-3 * scale, 0, 3 * scale, -Math.PI / 2, Math.PI / 2, false);
            ctx.stroke();
            break;
            
        case 'flo':
            // Right parenthesis (front loop only)
            ctx.lineWidth = 3.12 * scale;
            ctx.beginPath();
            ctx.arc(3 * scale, 0, 3 * scale, Math.PI / 2, -Math.PI / 2, false);
            ctx.stroke();
            break;
            
        default:
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Use getStitchSymbol to support both standard and custom stitches
            const symbol = getStitchSymbol(stitch);
            if (symbol && symbol !== '?') {
                ctx.fillText(symbol, 0, 0);
            } else {
                ctx.fillText('?', 0, 0);
            }
    }
    
    ctx.restore();
}

export function redrawStitches() {
    try {
        if (!canvas || !ctx) {
            console.error('Canvas või context puudub');
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawShapeGuide();
    
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
        
        // Apply zoom to canvas
        if (canvas && canvasContainer) {
            const scale = state.zoomLevel;
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'center center';
        }
        
        // Redraw if zoom changed
        if (oldZoom !== state.zoomLevel) {
            redrawStitches();
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
        
        redrawStitches();
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
        redrawStitches();
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

