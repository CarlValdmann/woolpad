// ============================================
// CANVAS RENDERING - Canvas joonistamise funktsioonid
// ============================================

import { state, getCurrentLayer, getCurrentStitches } from './state.js';
import { stitchSymbols } from './config.js';

let canvas, ctx;
let canvasContainer = null;
let panOffset = { x: 0, y: 0 };
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

export function initCanvas(canvasElement) {
    try {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        canvasContainer = canvas.parentElement;
        
        if (!canvas || !ctx) {
            throw new Error('Canvas või context ei leitud');
        }
        
        // Set canvas size from state (default to 600 if not set)
        const size = state.canvasSize || 600;
        canvas.width = size;
        canvas.height = size;
        state.canvasSize = size;
        
        // Initialize zoom to 100%
        state.zoomLevel = 1.0;
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (zoomLevelEl) {
            zoomLevelEl.textContent = '100%';
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
        for (let r = 30; r < size / 2; r += 40) {
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        const divisions = state.currentShape === 'hexagon' ? 6 : state.currentShape === 'octagon' ? 8 : 12;
        for (let i = 0; i < divisions; i++) {
            const angle = (Math.PI * 2 * i) / divisions;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(
                center + Math.cos(angle) * (size / 2),
                center + Math.sin(angle) * (size / 2)
            );
            ctx.stroke();
        }
    } else if (state.currentShape === 'square') {
        const spacing = 30;
        for (let i = spacing; i < size; i += spacing) {
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
    const radius = size / 2 - 60;
    
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
    
    // Draw specific symbols using Canvas API to match chart exactly
    switch(stitch) {
        case 'chain':
            ctx.beginPath();
            ctx.ellipse(0, 0, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 'slip':
            ctx.beginPath();
            ctx.arc(0, 0, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'sc':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(-6 * scale, 0);
            ctx.lineTo(6 * scale, 0);
            ctx.moveTo(0, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.stroke();
            break;
            
        case 'hdc':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            ctx.moveTo(-6 * scale, 0);
            ctx.lineTo(6 * scale, 0);
            ctx.stroke();
            break;
            
        case 'dc':
            // Vertical line with single diagonal line crossing the vertical stem
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // Diagonal line (from top-left to bottom-right)
            ctx.moveTo(-5 * scale, -3 * scale);
            ctx.lineTo(5 * scale, 1 * scale);
            ctx.stroke();
            break;
            
        case 'tr':
            // Vertical line with two diagonal lines crossing the vertical stem
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            // First diagonal line (higher)
            ctx.moveTo(-5 * scale, -5 * scale);
            ctx.lineTo(5 * scale, -1 * scale);
            // Second diagonal line (lower)
            ctx.moveTo(-5 * scale, -1 * scale);
            ctx.lineTo(5 * scale, 3 * scale);
            ctx.stroke();
            break;
            
        case 'dtr':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            ctx.moveTo(-6 * scale, -2 * scale);
            ctx.lineTo(6 * scale, -2 * scale);
            ctx.moveTo(-6 * scale, -4 * scale);
            ctx.lineTo(6 * scale, -4 * scale);
            ctx.moveTo(-6 * scale, -6 * scale);
            ctx.lineTo(6 * scale, -6 * scale);
            ctx.stroke();
            break;
            
        case 'sc2tog':
            // Inverted V with two vertical lines converging at top
            // Each vertical line has a short horizontal line crossing it
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            // Left vertical line
            ctx.moveTo(-6 * scale, -6 * scale);
            ctx.lineTo(-3 * scale, 6 * scale);
            // Right vertical line
            ctx.moveTo(6 * scale, -6 * scale);
            ctx.lineTo(3 * scale, 6 * scale);
            ctx.stroke();
            // Horizontal lines crossing each vertical
            ctx.beginPath();
            ctx.moveTo(-7 * scale, 0);
            ctx.lineTo(-5 * scale, 0);
            ctx.moveTo(5 * scale, 0);
            ctx.lineTo(7 * scale, 0);
            ctx.stroke();
            break;
            
        case 'sc3tog':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(-6 * scale, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.lineTo(6 * scale, -6 * scale);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-4 * scale, -2 * scale);
            ctx.lineTo(4 * scale, -2 * scale);
            ctx.moveTo(-4 * scale, 0);
            ctx.lineTo(4 * scale, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-3 * scale, -7 * scale);
            ctx.lineTo(3 * scale, -5 * scale);
            ctx.moveTo(3 * scale, -7 * scale);
            ctx.lineTo(-3 * scale, -5 * scale);
            ctx.stroke();
            break;
            
        case 'dc2tog':
            // Inverted V with two vertical lines converging at top
            // Each vertical line has a short diagonal line crossing it
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            // Left vertical line
            ctx.moveTo(-6 * scale, -6 * scale);
            ctx.lineTo(-3 * scale, 6 * scale);
            // Right vertical line
            ctx.moveTo(6 * scale, -6 * scale);
            ctx.lineTo(3 * scale, 6 * scale);
            ctx.stroke();
            // Diagonal lines crossing each vertical (left side)
            ctx.beginPath();
            ctx.moveTo(-7 * scale, -2 * scale);
            ctx.lineTo(-5 * scale, 0);
            // Diagonal lines crossing each vertical (right side)
            ctx.moveTo(5 * scale, -2 * scale);
            ctx.lineTo(7 * scale, 0);
            ctx.stroke();
            break;
            
        case 'dc3tog':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(-6 * scale, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.lineTo(6 * scale, -6 * scale);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-4 * scale, -2 * scale);
            ctx.lineTo(4 * scale, -2 * scale);
            ctx.moveTo(-4 * scale, 0);
            ctx.lineTo(4 * scale, 0);
            ctx.stroke();
            break;
            
        case 'cluster-3dc':
            // Oval with three vertical lines inside
            // Each vertical line has a short diagonal line crossing it
            ctx.beginPath();
            ctx.ellipse(0, 0, 4 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2 * scale;
            // Three vertical lines
            ctx.beginPath();
            ctx.moveTo(-2 * scale, -6 * scale);
            ctx.lineTo(-2 * scale, 6 * scale);
            ctx.moveTo(0, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.moveTo(2 * scale, -6 * scale);
            ctx.lineTo(2 * scale, 6 * scale);
            ctx.stroke();
            // Diagonal lines on each vertical (from top-left to bottom-right)
            ctx.lineWidth = 1.5 * scale;
            ctx.beginPath();
            // Left vertical diagonal
            ctx.moveTo(-3 * scale, 0);
            ctx.lineTo(-1 * scale, 2 * scale);
            // Center vertical diagonal
            ctx.moveTo(-1 * scale, 0);
            ctx.lineTo(1 * scale, 2 * scale);
            // Right vertical diagonal
            ctx.moveTo(1 * scale, 0);
            ctx.lineTo(3 * scale, 2 * scale);
            ctx.stroke();
            ctx.lineWidth = 2.5 * scale; // Reset
            break;
            
        case 'cluster-3hdc':
            ctx.beginPath();
            ctx.ellipse(0, 0, 5 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -6 * scale);
            ctx.lineTo(0, 6 * scale);
            ctx.stroke();
            break;
            
        case 'popcorn-5dc':
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
            break;
            
        case 'shell-5dc':
            // Fan shape: five individual T shapes with diagonal lines
            // All five T shapes originate from a single point at the bottom
            ctx.lineWidth = 2.5 * scale;
            const fanRadius = 8 * scale;
            const fanStartAngle = -Math.PI / 2.5;
            const fanEndAngle = Math.PI / 2.5;
            const bottomY = 4 * scale;
            const bottomX = 0;
            
            for (let i = 0; i < 5; i++) {
                const angle = fanStartAngle + (fanEndAngle - fanStartAngle) * (i / 4);
                const endX = bottomX + Math.cos(angle) * fanRadius;
                const endY = bottomY - Math.sin(angle) * fanRadius;
                
                ctx.beginPath();
                // Vertical line from bottom point to top
                ctx.moveTo(bottomX, bottomY);
                ctx.lineTo(endX, endY - 4 * scale);
                // Diagonal line crossing the vertical (from top-left to bottom-right)
                ctx.moveTo(endX - 2.5 * scale, endY - 5 * scale);
                ctx.lineTo(endX + 2.5 * scale, endY - 3 * scale);
                ctx.stroke();
            }
            break;
            
        case 'picot-ch3':
            ctx.beginPath();
            ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(2 * scale, -2 * scale);
            ctx.quadraticCurveTo(4 * scale, -4 * scale, 6 * scale, -2 * scale);
            ctx.stroke();
            break;
            
        case 'fpdc':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            ctx.moveTo(-6 * scale, -4 * scale);
            ctx.lineTo(6 * scale, -4 * scale);
            ctx.arc(4 * scale, 6 * scale, 2 * scale, Math.PI, 0, false);
            ctx.stroke();
            break;
            
        case 'bpdc':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -8 * scale);
            ctx.lineTo(0, 8 * scale);
            ctx.moveTo(-6 * scale, -4 * scale);
            ctx.lineTo(6 * scale, -4 * scale);
            ctx.arc(-4 * scale, 6 * scale, 2 * scale, 0, Math.PI, false);
            ctx.stroke();
            break;
            
        case 'blo':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.arc(-3 * scale, 0, 3 * scale, -Math.PI / 2, Math.PI / 2, false);
            ctx.stroke();
            break;
            
        case 'flo':
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.arc(3 * scale, 0, 3 * scale, Math.PI / 2, -Math.PI / 2, false);
            ctx.stroke();
            break;
            
        default:
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const symbol = stitchSymbols[stitch];
            if (symbol) {
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

