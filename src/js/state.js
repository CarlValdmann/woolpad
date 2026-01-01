// ============================================
// STATE MANAGEMENT - Globaalne olek
// ============================================

import { DEFAULT_STITCH, DEFAULT_COLOR, DEFAULT_SHAPE, DEFAULT_STITCH_SIZE, DEFAULT_ROTATION, DEFAULT_TOOL_MODE, DEFAULT_SYMMETRY_MODE } from './config.js';

// Application state
export const state = {
    // Current settings
    currentStitch: DEFAULT_STITCH,
    currentColor: DEFAULT_COLOR,
    currentShape: DEFAULT_SHAPE,
    currentStitchSize: DEFAULT_STITCH_SIZE,
    currentRotation: DEFAULT_ROTATION,
    currentToolMode: DEFAULT_TOOL_MODE,
    symmetryMode: DEFAULT_SYMMETRY_MODE,
    
    // Layers/Rounds
    layers: [{ id: 1, name: 'Round 1', stitches: [], visible: true }],
    currentLayerIndex: 0,
    showAllLayers: false,
    nextLayerId: 2,
    
    // Pattern analysis
    suggestions: [],
    autoContinueEnabled: true,
    customStitches: [],
    
    // Line tool
    lineStartPoint: null,
    linePreview: null,
    
    // Selection tool
    selectionStart: null,
    selectionEnd: null,
    selectedStitches: [],
    clipboard: null,
    
    // Move tool
    moveStartPoint: null,
    movingStitches: [],
    isRotating: false,
    isResizing: false,
    rotateStartAngle: 0,
    resizeStartDistance: 0,
    movingSingleStitch: null,
    activeHandle: null, // Handle, mida lohistatakse (rotate või resize jaoks)
    
    // Drawing state
    isDrawing: false,
    
    // Notes/Annotations
    notes: [],
    nextNoteId: 1,
    
    // Crochet Chart Modal
    selectedChartStitch: null,
    currentChartCategory: 'basic',
    
    // Canvas zoom
    zoomLevel: 1.0,
    
    // Canvas size
    canvasSize: 600
};

// Getters
export function getCurrentLayer() {
    try {
        if (!state.layers || state.layers.length === 0) {
            console.warn('No layers available, creating default layer');
            state.layers = [{ id: 1, name: 'Round 1', stitches: [], visible: true }];
            state.currentLayerIndex = 0;
        }
        
        if (state.currentLayerIndex < 0 || state.currentLayerIndex >= state.layers.length) {
            console.warn('Invalid layer index, resetting to 0');
            state.currentLayerIndex = 0;
        }
        
        return state.layers[state.currentLayerIndex];
    } catch (error) {
        console.error('Error in getCurrentLayer:', error);
        // Return safe default
        return { id: 1, name: 'Round 1', stitches: [], visible: true };
    }
}

export function getCurrentStitches() {
    try {
        const layer = getCurrentLayer();
        if (!layer.stitches || !Array.isArray(layer.stitches)) {
            layer.stitches = [];
        }
        return layer.stitches;
    } catch (error) {
        console.error('Error in getCurrentStitches:', error);
        return [];
    }
}

export function getTotalStitchCount() {
    return state.layers.reduce((total, layer) => total + layer.stitches.length, 0);
}

// Setters
export function setCurrentStitch(stitch) {
    state.currentStitch = stitch;
}

export function setCurrentColor(color) {
    state.currentColor = color;
}

export function setCurrentShape(shape) {
    state.currentShape = shape;
}

export function setCurrentToolMode(mode) {
    state.currentToolMode = mode;
}

export function setSymmetryMode(mode) {
    state.symmetryMode = mode;
}

export function addLayer(layer) {
    state.layers.push(layer);
    state.nextLayerId++;
}

export function setCurrentLayerIndex(index) {
    try {
        if (typeof index !== 'number' || isNaN(index)) {
            console.warn('Invalid layer index:', index);
            return;
        }
        
        if (index >= 0 && index < state.layers.length) {
            state.currentLayerIndex = index;
        } else {
            console.warn('Layer index out of bounds:', index, 'max:', state.layers.length - 1);
        }
    } catch (error) {
        console.error('Error in setCurrentLayerIndex:', error);
    }
}

