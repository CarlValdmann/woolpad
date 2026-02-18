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
    canvasSize: 1200
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

// ============================================
// CUSTOM STITCHES MANAGEMENT
// ============================================

const CUSTOM_STITCHES_STORAGE_KEY = 'heegelmotiivid-customStitches';

export function addCustomStitch(stitch) {
    try {
        if (!stitch.id) {
            stitch.id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        if (!stitch.createdAt) {
            stitch.createdAt = new Date().toISOString();
        }
        
        // Check for duplicates (same name and symbol)
        const duplicate = state.customStitches.find(
            s => s.name === stitch.name && s.symbol === stitch.symbol
        );
        
        if (duplicate && duplicate.id !== stitch.id) {
            throw new Error('Selline piste (nimi ja sümbol) on juba olemas!');
        }
        
        // Check if ID already exists (for updates)
        const existingIndex = state.customStitches.findIndex(s => s.id === stitch.id);
        if (existingIndex >= 0) {
            state.customStitches[existingIndex] = { ...stitch };
        } else {
            state.customStitches.push({ ...stitch });
        }
        
        saveCustomStitchesToLocalStorage();
        return stitch.id;
    } catch (error) {
        console.error('Error in addCustomStitch:', error);
        throw error;
    }
}

export function updateCustomStitch(id, stitch) {
    try {
        const index = state.customStitches.findIndex(s => s.id === id);
        if (index < 0) {
            throw new Error('Custom piste ei leitud');
        }
        
        // Check for duplicates (same name and symbol, but different ID)
        const duplicate = state.customStitches.find(
            s => s.name === stitch.name && s.symbol === stitch.symbol && s.id !== id
        );
        
        if (duplicate) {
            throw new Error('Selline piste (nimi ja sümbol) on juba olemas!');
        }
        
        state.customStitches[index] = { ...state.customStitches[index], ...stitch };
        saveCustomStitchesToLocalStorage();
        return true;
    } catch (error) {
        console.error('Error in updateCustomStitch:', error);
        throw error;
    }
}

export function deleteCustomStitch(id) {
    try {
        const index = state.customStitches.findIndex(s => s.id === id);
        if (index < 0) {
            return false;
        }
        
        state.customStitches.splice(index, 1);
        saveCustomStitchesToLocalStorage();
        return true;
    } catch (error) {
        console.error('Error in deleteCustomStitch:', error);
        return false;
    }
}

export function getCustomStitch(id) {
    try {
        return state.customStitches.find(s => s.id === id) || null;
    } catch (error) {
        console.error('Error in getCustomStitch:', error);
        return null;
    }
}

export function getAllCustomStitches() {
    return [...state.customStitches];
}

export function loadCustomStitchesFromLocalStorage() {
    try {
        const stored = localStorage.getItem(CUSTOM_STITCHES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                state.customStitches = parsed;
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error loading custom stitches from localStorage:', error);
        state.customStitches = [];
        return false;
    }
}

export function saveCustomStitchesToLocalStorage() {
    try {
        localStorage.setItem(CUSTOM_STITCHES_STORAGE_KEY, JSON.stringify(state.customStitches));
        return true;
    } catch (error) {
        console.error('Error saving custom stitches to localStorage:', error);
        return false;
    }
}

export function mergeCustomStitches(projectCustomStitches) {
    try {
        if (!Array.isArray(projectCustomStitches)) {
            return;
        }
        
        // Load existing from localStorage
        loadCustomStitchesFromLocalStorage();
        
        // Merge: project stitches take priority (by ID)
        projectCustomStitches.forEach(projectStitch => {
            const existingIndex = state.customStitches.findIndex(s => s.id === projectStitch.id);
            if (existingIndex >= 0) {
                // Update existing with project version
                state.customStitches[existingIndex] = { ...projectStitch };
            } else {
                // Add new from project
                state.customStitches.push({ ...projectStitch });
            }
        });
        
        // Save merged result
        saveCustomStitchesToLocalStorage();
    } catch (error) {
        console.error('Error merging custom stitches:', error);
    }
}

