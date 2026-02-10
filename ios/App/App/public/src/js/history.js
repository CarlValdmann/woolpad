// ============================================
// HISTORY - Undo/Redo funktsioonid
// ============================================

import { state } from './state.js';

const MAX_HISTORY_SIZE = 50;

// History stack
let historyStack = [];
let historyIndex = -1;

/**
 * Salvestab praeguse oleku history stack'i
 */
export function saveState() {
    try {
        // Eemalda kõik olekud praegusest indeksist edasi (kui tehti undo ja siis uus muudatus)
        historyStack = historyStack.slice(0, historyIndex + 1);
        
        // Salvesta praegune olek
        const currentState = {
            layers: JSON.parse(JSON.stringify(state.layers)), // Deep copy
            currentLayerIndex: state.currentLayerIndex,
            currentStitch: state.currentStitch,
            currentColor: state.currentColor,
            currentShape: state.currentShape,
            currentStitchSize: state.currentStitchSize,
            currentRotation: state.currentRotation,
            symmetryMode: state.symmetryMode,
            timestamp: Date.now()
        };
        
        historyStack.push(currentState);
        historyIndex++;
        
        // Piira history suurust
        if (historyStack.length > MAX_HISTORY_SIZE) {
            historyStack.shift();
            historyIndex--;
        }
        
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Error saving state to history:', error);
    }
}

/**
 * Taastab eelmise oleku (Undo)
 */
export function undo() {
    try {
        if (historyIndex <= 0) {
            console.log('Nothing to undo');
            return false;
        }
        
        historyIndex--;
        restoreState(historyStack[historyIndex]);
        updateUndoRedoButtons();
        return true;
    } catch (error) {
        console.error('Error during undo:', error);
        return false;
    }
}

/**
 * Taastab järgmise oleku (Redo)
 */
export function redo() {
    try {
        if (historyIndex >= historyStack.length - 1) {
            console.log('Nothing to redo');
            return false;
        }
        
        historyIndex++;
        restoreState(historyStack[historyIndex]);
        updateUndoRedoButtons();
        return true;
    } catch (error) {
        console.error('Error during redo:', error);
        return false;
    }
}

/**
 * Taastab oleku history stack'ist
 */
function restoreState(savedState) {
    try {
        state.layers = JSON.parse(JSON.stringify(savedState.layers)); // Deep copy
        state.currentLayerIndex = savedState.currentLayerIndex;
        state.currentStitch = savedState.currentStitch;
        state.currentColor = savedState.currentColor;
        state.currentShape = savedState.currentShape;
        state.currentStitchSize = savedState.currentStitchSize;
        state.currentRotation = savedState.currentRotation;
        state.symmetryMode = savedState.symmetryMode;
        state.suggestions = []; // Clear suggestions when restoring
    } catch (error) {
        console.error('Error restoring state:', error);
        throw error;
    }
}

/**
 * Uuendab Undo/Redo nuppude olekut
 */
function updateUndoRedoButtons() {
    const undoBtn = document.querySelector('.tool-icon[title="Tagasi"]');
    const redoBtn = document.querySelector('.tool-icon[title="Uuesti"]');
    
    if (undoBtn) {
        undoBtn.style.opacity = historyIndex > 0 ? '1' : '0.5';
        undoBtn.style.cursor = historyIndex > 0 ? 'pointer' : 'not-allowed';
    }
    
    if (redoBtn) {
        redoBtn.style.opacity = historyIndex < historyStack.length - 1 ? '1' : '0.5';
        redoBtn.style.cursor = historyIndex < historyStack.length - 1 ? 'pointer' : 'not-allowed';
    }
}

/**
 * Initsialiseerib history süsteemi
 */
export function initHistory() {
    // Salvesta algne olek
    saveState();
    updateUndoRedoButtons();
}

/**
 * Kontrollib, kas on võimalik undo teha
 */
export function canUndo() {
    return historyIndex > 0;
}

/**
 * Kontrollib, kas on võimalik redo teha
 */
export function canRedo() {
    return historyIndex < historyStack.length - 1;
}

/**
 * Tühjendab history stack'i
 */
export function clearHistory() {
    historyStack = [];
    historyIndex = -1;
    updateUndoRedoButtons();
}

