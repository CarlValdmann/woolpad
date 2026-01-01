// ============================================
// TOOLS - Tööriistade funktsioonid
// ============================================

import { state, getCurrentStitches, setCurrentToolMode } from './state.js';
import { getCenter, getAngleFromCenter, redrawStitches, getSelectedStitchesCenter } from './canvas.js';
import { applySymmetry, analyzePattern } from './pattern.js';
import { updateRoundsList, updateAlignmentButtons } from './ui.js';
import { DEFAULT_MIN_DISTANCE } from './config.js';
import { saveState } from './history.js';

export function setToolMode(mode) {
    setCurrentToolMode(mode);
    document.querySelectorAll('.tool-icon[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === mode);
    });
    
    const canvas = document.getElementById('canvas');
    if (mode === 'erase') {
        canvas.style.cursor = 'not-allowed';
    } else if (mode === 'move') {
        canvas.style.cursor = 'default';
    } else if (mode === 'select') {
        canvas.style.cursor = 'crosshair';
    } else if (mode === 'note') {
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

export function handleDrawMode(x, y) {
    const stitches = getCurrentStitches();
    let stitchAdded = false;
    
    let clickedSuggestion = null;
    for (let i = 0; i < state.suggestions.length; i++) {
        const s = state.suggestions[i];
        const dist = Math.sqrt(Math.pow(x - s.x, 2) + Math.pow(y - s.y, 2));
        if (dist < DEFAULT_MIN_DISTANCE) {
            clickedSuggestion = i;
            break;
        }
    }
    
    if (clickedSuggestion !== null) {
        const suggestion = state.suggestions[clickedSuggestion];
        stitches.push({
            x: suggestion.x,
            y: suggestion.y,
            stitch: suggestion.stitch,
            color: suggestion.color,
            size: suggestion.size,
            rotation: suggestion.rotation
        });
        state.suggestions.splice(clickedSuggestion, 1);
        stitchAdded = true;
    } else {
        // Check if point is too close to existing stitches
        let tooClose = false;
        
        for (let i = 0; i < stitches.length; i++) {
            const stitch = stitches[i];
            const dist = Math.sqrt(Math.pow(x - stitch.x, 2) + Math.pow(y - stitch.y, 2));
            if (dist < DEFAULT_MIN_DISTANCE) {
                tooClose = true;
                break;
            }
        }
        
        // Only add stitch if it's not too close to existing stitches
        if (!tooClose) {
            const points = applySymmetry(x, y);
            
            points.forEach(point => {
                // Check distance for each symmetry point as well
                let pointTooClose = false;
                for (let i = 0; i < stitches.length; i++) {
                    const stitch = stitches[i];
                    const dist = Math.sqrt(Math.pow(point.x - stitch.x, 2) + Math.pow(point.y - stitch.y, 2));
                    if (dist < DEFAULT_MIN_DISTANCE) {
                        pointTooClose = true;
                        break;
                    }
                }
                
                if (!pointTooClose) {
                    const center = getCenter();
                    const angleFromCenter = Math.atan2(point.y - center.y, point.x - center.x);
                    const rotationTowardsCenter = (angleFromCenter * 180 / Math.PI) + 180 + state.currentRotation;
                    
                    stitches.push({
                        x: point.x,
                        y: point.y,
                        stitch: state.currentStitch,
                        color: state.currentColor,
                        size: state.currentStitchSize,
                        rotation: rotationTowardsCenter
                    });
                    stitchAdded = true;
                }
            });
        }
    }
    
    try {
        if (stitchAdded) {
            markChangesMade();
        }
        analyzePattern();
        redrawStitches();
        updateRoundsList();
        // Don't save state here - will be saved on mouseup
    } catch (error) {
        console.error('Error in handleDrawMode:', error);
        alert('Viga joonistamisel: ' + error.message);
    }
}

// Track if any changes were made during drawing
let hasChanges = false;

export function markChangesMade() {
    hasChanges = true;
}

export function clearChangesFlag() {
    hasChanges = false;
}

export function hasChangesBeenMade() {
    return hasChanges;
}

export function handleEraseMode(x, y) {
    try {
        const stitches = getCurrentStitches();
        let removed = false;
        
        for (let i = stitches.length - 1; i >= 0; i--) {
            const s = stitches[i];
            const dist = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2);
            if (dist < DEFAULT_MIN_DISTANCE) {
                stitches.splice(i, 1);
                removed = true;
            }
        }
        
        if (removed) {
            markChangesMade();
            analyzePattern();
            redrawStitches();
            updateRoundsList();
            // Don't save state here - will be saved on mouseup
        }
    } catch (error) {
        console.error('Error in handleEraseMode:', error);
        alert('Viga kustutamisel: ' + error.message);
    }
}

export function drawLine(x1, y1, x2, y2) {
    try {
        const stitches = getCurrentStitches();
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const steps = Math.max(1, Math.floor(distance / 30));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            const center = getCenter();
            const angleFromCenter = Math.atan2(y - center.y, x - center.x);
            const rotationTowardsCenter = (angleFromCenter * 180 / Math.PI) + 180 + state.currentRotation;
            
            stitches.push({
                x: x,
                y: y,
                stitch: state.currentStitch,
                color: state.currentColor,
                size: state.currentStitchSize,
                rotation: rotationTowardsCenter
            });
        }
        
        markChangesMade();
        analyzePattern();
        redrawStitches();
        updateRoundsList();
        // Save state will be called after line is complete
    } catch (error) {
        console.error('Error in drawLine:', error);
        alert('Viga joone joonistamisel: ' + error.message);
    }
}

export function findStitchesInSelection() {
    if (!state.selectionStart || !state.selectionEnd) return;
    
    const minX = Math.min(state.selectionStart.x, state.selectionEnd.x);
    const maxX = Math.max(state.selectionStart.x, state.selectionEnd.x);
    const minY = Math.min(state.selectionStart.y, state.selectionEnd.y);
    const maxY = Math.max(state.selectionStart.y, state.selectionEnd.y);
    
    const stitches = getCurrentStitches();
    state.selectedStitches = [];
    
    stitches.forEach((stitch, index) => {
        if (stitch.x >= minX && stitch.x <= maxX && 
            stitch.y >= minY && stitch.y <= maxY) {
            state.selectedStitches.push(index);
        }
    });
}

export function isPointInSelection(x, y) {
    if (state.selectedStitches.length === 0) return false;
    
    const stitches = getCurrentStitches();
    const selectedBounds = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
    };
    
    state.selectedStitches.forEach(index => {
        const stitch = stitches[index];
        if (!stitch) return; // Skip if stitch doesn't exist
        selectedBounds.minX = Math.min(selectedBounds.minX, stitch.x - 15);
        selectedBounds.maxX = Math.max(selectedBounds.maxX, stitch.x + 15);
        selectedBounds.minY = Math.min(selectedBounds.minY, stitch.y - 15);
        selectedBounds.maxY = Math.max(selectedBounds.maxY, stitch.y + 15);
    });
    
    // Check if bounds were set (at least one valid stitch found)
    if (selectedBounds.minX === Infinity) return false;
    
    return x >= selectedBounds.minX && x <= selectedBounds.maxX &&
           y >= selectedBounds.minY && y <= selectedBounds.maxY;
}

export function getSelectionCenter() {
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
    
    return {
        x: sumX / count,
        y: sumY / count
    };
}

export function handleMoveSingleStitch(x, y) {
    if (!state.moveStartPoint || !state.movingSingleStitch) return;
    
    const dx = x - state.moveStartPoint.x;
    const dy = y - state.moveStartPoint.y;
    const stitches = getCurrentStitches();
    
    if (stitches[state.movingSingleStitch.index]) {
        stitches[state.movingSingleStitch.index].x = state.movingSingleStitch.originalX + dx;
        stitches[state.movingSingleStitch.index].y = state.movingSingleStitch.originalY + dy;
    }
    
    redrawStitches();
}

export function handleMoveSelectedStitches(x, y) {
    try {
        if (!state.moveStartPoint || state.movingStitches.length === 0) return;
        
        const stitches = getCurrentStitches();
        
        if (state.isRotating) {
            // Rotate selected stitches around their center
            const center = getSelectionCenter();
            if (!center) return;
            
            const startAngle = Math.atan2(state.moveStartPoint.y - center.y, state.moveStartPoint.x - center.x);
            const currentAngle = Math.atan2(y - center.y, x - center.x);
            const deltaAngle = (currentAngle - startAngle) * 180 / Math.PI;
            
            state.movingStitches.forEach(moveData => {
                const stitch = stitches[moveData.index];
                if (!stitch) return;
                
                const originalAngle = Math.atan2(moveData.originalY - center.y, moveData.originalX - center.x);
                const newAngle = originalAngle + (deltaAngle * Math.PI / 180);
                const distance = Math.sqrt(
                    Math.pow(moveData.originalX - center.x, 2) + 
                    Math.pow(moveData.originalY - center.y, 2)
                );
                
                stitch.x = center.x + Math.cos(newAngle) * distance;
                stitch.y = center.y + Math.sin(newAngle) * distance;
                
                // Also rotate the stitch itself
                stitch.rotation = (moveData.originalRotation || 0) + deltaAngle;
            });
        } else {
            // Move selected stitches
            const dx = x - state.moveStartPoint.x;
            const dy = y - state.moveStartPoint.y;
            
            state.movingStitches.forEach(moveData => {
                const stitch = stitches[moveData.index];
                if (!stitch) return;
                stitch.x = moveData.originalX + dx;
                stitch.y = moveData.originalY + dy;
            });
        }
        
        redrawStitches();
    } catch (error) {
        console.error('Error in handleMoveSelectedStitches:', error);
        alert('Viga pisteide liigutamisel: ' + error.message);
    }
}

// Save state after move is complete (called from main.js)
export function saveStateAfterMove() {
    saveState();
}

/**
 * Kopeerib valitud pisteid clipboard'isse
 */
export function copySelectedStitches() {
    try {
        if (state.selectedStitches.length === 0) return;
        
        const stitches = getCurrentStitches();
        const copiedStitches = [];
        
        // Get bounding box center for offset calculation
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        state.selectedStitches.forEach(index => {
            const stitch = stitches[index];
            if (!stitch) return;
            
            copiedStitches.push({
                x: stitch.x,
                y: stitch.y,
                stitch: stitch.stitch,
                color: stitch.color || state.currentColor,
                size: stitch.size || state.currentStitchSize,
                rotation: stitch.rotation || 0
            });
            
            minX = Math.min(minX, stitch.x);
            minY = Math.min(minY, stitch.y);
            maxX = Math.max(maxX, stitch.x);
            maxY = Math.max(maxY, stitch.y);
        });
        
        if (copiedStitches.length === 0) return;
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        state.clipboard = {
            stitches: copiedStitches,
            centerX: centerX,
            centerY: centerY
        };
        
        console.log(`Copied ${copiedStitches.length} stitches to clipboard`);
    } catch (error) {
        console.error('Error in copySelectedStitches:', error);
    }
}

/**
 * Kleebib pisteid clipboard'ist praegusesse layer'isse
 */
export function pasteStitches(offsetX = 30, offsetY = 30) {
    try {
        if (!state.clipboard || !state.clipboard.stitches || state.clipboard.stitches.length === 0) {
            console.log('Clipboard is empty');
            return;
        }
        
        const stitches = getCurrentStitches();
        const newIndices = [];
        
        // Calculate offset from original center
        const centerX = state.clipboard.centerX;
        const centerY = state.clipboard.centerY;
        
        state.clipboard.stitches.forEach(clipStitch => {
            // Calculate relative position from original center
            const relX = clipStitch.x - centerX;
            const relY = clipStitch.y - centerY;
            
            // Add offset
            const newX = centerX + relX + offsetX;
            const newY = centerY + relY + offsetY;
            
            stitches.push({
                x: newX,
                y: newY,
                stitch: clipStitch.stitch,
                color: clipStitch.color,
                size: clipStitch.size,
                rotation: clipStitch.rotation
            });
            
            newIndices.push(stitches.length - 1);
        });
        
        // Select the newly pasted stitches
        state.selectedStitches = newIndices;
        
        saveState();
        redrawStitches();
        updateRoundsList();
        updateAlignmentButtons();
        
        console.log(`Pasted ${newIndices.length} stitches`);
    } catch (error) {
        console.error('Error in pasteStitches:', error);
    }
}

/**
 * Duplikaadib valitud pisteid kohe samasse layer'isse
 */
export function duplicateSelectedStitches() {
    try {
        if (state.selectedStitches.length === 0) return;
        
        // First copy to clipboard
        copySelectedStitches();
        
        // Then paste with offset
        pasteStitches(30, 0); // Offset only horizontally
        
        console.log(`Duplicated ${state.selectedStitches.length} stitches`);
    } catch (error) {
        console.error('Error in duplicateSelectedStitches:', error);
    }
}

/**
 * Kustutab valitud pisteid
 */
export function deleteSelectedStitches() {
    try {
        if (state.selectedStitches.length === 0) return;
        
        const stitches = getCurrentStitches();
        
        // Sort indices in descending order to delete from end to start
        // This prevents index shifting issues
        const sortedIndices = [...state.selectedStitches].sort((a, b) => b - a);
        
        sortedIndices.forEach(index => {
            if (index >= 0 && index < stitches.length) {
                stitches.splice(index, 1);
            }
        });
        
        // Clear selection
        state.selectedStitches = [];
        
        saveState();
        redrawStitches();
        updateRoundsList();
        updateAlignmentButtons();
        
        console.log(`Deleted ${sortedIndices.length} stitches`);
    } catch (error) {
        console.error('Error in deleteSelectedStitches:', error);
    }
}

/**
 * Joondab valitud pisteid vastavalt suunale
 */
export function alignSelectedStitches(direction) {
    try {
        if (state.selectedStitches.length < 2) return;
        
        const stitches = getCurrentStitches();
        
        // Calculate bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        state.selectedStitches.forEach(index => {
            const stitch = stitches[index];
            if (!stitch) return;
            minX = Math.min(minX, stitch.x);
            minY = Math.min(minY, stitch.y);
            maxX = Math.max(maxX, stitch.x);
            maxY = Math.max(maxY, stitch.y);
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Align stitches
        state.selectedStitches.forEach(index => {
            const stitch = stitches[index];
            if (!stitch) return;
            
            switch (direction) {
                case 'left':
                    stitch.x = minX;
                    break;
                case 'right':
                    stitch.x = maxX;
                    break;
                case 'center-h':
                    stitch.x = centerX;
                    break;
                case 'top':
                    stitch.y = minY;
                    break;
                case 'bottom':
                    stitch.y = maxY;
                    break;
                case 'center-v':
                    stitch.y = centerY;
                    break;
            }
        });
        
        saveState();
        redrawStitches();
        updateAlignmentButtons();
    } catch (error) {
        console.error('Error in alignSelectedStitches:', error);
    }
}

/**
 * Jaotab valitud pisteid ühtlaselt valitud suunas
 */
export function distributeSelectedStitches(direction) {
    try {
        if (state.selectedStitches.length < 3) return;
        
        const stitches = getCurrentStitches();
        const selectedStitchData = state.selectedStitches
            .map(index => ({ index, stitch: stitches[index] }))
            .filter(item => item.stitch)
            .sort((a, b) => {
                if (direction === 'horizontal') {
                    return a.stitch.x - b.stitch.x;
                } else {
                    return a.stitch.y - b.stitch.y;
                }
            });
        
        if (selectedStitchData.length < 3) return;
        
        // Get min and max positions
        let minPos, maxPos;
        if (direction === 'horizontal') {
            minPos = selectedStitchData[0].stitch.x;
            maxPos = selectedStitchData[selectedStitchData.length - 1].stitch.x;
        } else {
            minPos = selectedStitchData[0].stitch.y;
            maxPos = selectedStitchData[selectedStitchData.length - 1].stitch.y;
        }
        
        // Calculate spacing
        const spacing = (maxPos - minPos) / (selectedStitchData.length - 1);
        
        // Distribute stitches evenly
        selectedStitchData.forEach((item, i) => {
            const newPos = minPos + (spacing * i);
            if (direction === 'horizontal') {
                item.stitch.x = newPos;
            } else {
                item.stitch.y = newPos;
            }
        });
        
        saveState();
        redrawStitches();
        updateAlignmentButtons();
    } catch (error) {
        console.error('Error in distributeSelectedStitches:', error);
    }
}

/**
 * Lisab uue märkuse
 */
export function addNote(x, y, text) {
    try {
        if (!text || text.trim() === '') return null;
        
        const note = {
            id: state.nextNoteId++,
            x: x,
            y: y,
            text: text.trim(),
            createdAt: new Date().toISOString()
        };
        
        state.notes.push(note);
        saveState();
        redrawStitches();
        
        return note.id;
    } catch (error) {
        console.error('Error in addNote:', error);
        return null;
    }
}

/**
 * Uuendab märkuse teksti
 */
export function editNote(id, text) {
    try {
        const note = state.notes.find(n => n.id === id);
        if (!note) return false;
        
        note.text = text.trim();
        saveState();
        redrawStitches();
        
        return true;
    } catch (error) {
        console.error('Error in editNote:', error);
        return false;
    }
}

/**
 * Eemaldab märkuse
 */
export function deleteNote(id) {
    try {
        const index = state.notes.findIndex(n => n.id === id);
        if (index === -1) return false;
        
        state.notes.splice(index, 1);
        saveState();
        redrawStitches();
        
        return true;
    } catch (error) {
        console.error('Error in deleteNote:', error);
        return false;
    }
}

/**
 * Leiab märkuse punkti kohalt
 */
export function getNoteAtPoint(x, y) {
    const threshold = 15; // Click threshold in pixels
    
    for (let i = state.notes.length - 1; i >= 0; i--) {
        const note = state.notes[i];
        const dist = Math.sqrt(Math.pow(x - note.x, 2) + Math.pow(y - note.y, 2));
        if (dist < threshold) {
            return note;
        }
    }
    
    return null;
}

/**
 * Handle rotation via bounding box rotate handle
 */
export function handleRotateViaHandle(x, y) {
    try {
        const center = getSelectedStitchesCenter();
        if (!center || !state.moveStartPoint || state.movingStitches.length === 0) return;
        
        const stitches = getCurrentStitches();
        const startAngle = Math.atan2(state.moveStartPoint.y - center.y, state.moveStartPoint.x - center.x);
        const currentAngle = Math.atan2(y - center.y, x - center.x);
        const deltaAngle = (currentAngle - startAngle) * 180 / Math.PI;
        
        state.movingStitches.forEach(moveData => {
            const stitch = stitches[moveData.index];
            if (!stitch) return;
            
            const originalAngle = Math.atan2(moveData.originalY - center.y, moveData.originalX - center.x);
            const newAngle = originalAngle + (deltaAngle * Math.PI / 180);
            const distance = Math.sqrt(
                Math.pow(moveData.originalX - center.x, 2) + 
                Math.pow(moveData.originalY - center.y, 2)
            );
            
            stitch.x = center.x + Math.cos(newAngle) * distance;
            stitch.y = center.y + Math.sin(newAngle) * distance;
            
            // Also rotate the stitch itself
            stitch.rotation = (moveData.originalRotation || 0) + deltaAngle;
        });
        
        redrawStitches();
    } catch (error) {
        console.error('Error in handleRotateViaHandle:', error);
    }
}

/**
 * Handle resize via bounding box corner handles
 */
export function handleResizeViaHandle(x, y) {
    try {
        const center = getSelectedStitchesCenter();
        if (!center || !state.moveStartPoint || state.movingStitches.length === 0) return;
        
        // If resizeStartDistance is 0 or not set, calculate it from the handle position
        if (!state.resizeStartDistance || state.resizeStartDistance === 0) {
            if (state.activeHandle) {
                state.resizeStartDistance = Math.sqrt(
                    Math.pow(state.activeHandle.x - center.x, 2) + 
                    Math.pow(state.activeHandle.y - center.y, 2)
                );
            } else {
                // Fallback: use mouse position
                state.resizeStartDistance = Math.sqrt(
                    Math.pow(state.moveStartPoint.x - center.x, 2) + 
                    Math.pow(state.moveStartPoint.y - center.y, 2)
                );
            }
        }
        
        const stitches = getCurrentStitches();
        
        // Calculate current distance from center to mouse
        const currentDistance = Math.sqrt(
            Math.pow(x - center.x, 2) + 
            Math.pow(y - center.y, 2)
        );
        
        // Prevent division by zero
        if (state.resizeStartDistance === 0) return;
        
        // Calculate scale factor
        const scale = currentDistance / state.resizeStartDistance;
        
        // Apply scaling to each stitch
        state.movingStitches.forEach(moveData => {
            const stitch = stitches[moveData.index];
            if (!stitch || !moveData.originalDistance) return;
            
            // Calculate angle from center to original position
            const angle = Math.atan2(moveData.originalY - center.y, moveData.originalX - center.x);
            
            // Calculate new position with scaled distance
            const newDistance = moveData.originalDistance * scale;
            stitch.x = center.x + Math.cos(angle) * newDistance;
            stitch.y = center.y + Math.sin(angle) * newDistance;
            
            // Also scale the stitch size (if it has a size property)
            if (stitch.size) {
                // Find original size from first stitch's original distance
                const baseSize = stitch.size / (moveData.originalDistance / state.resizeStartDistance);
                stitch.size = baseSize * scale;
                // Limit size between reasonable bounds
                stitch.size = Math.max(10, Math.min(50, stitch.size));
            }
        });
        
        redrawStitches();
    } catch (error) {
        console.error('Error in handleResizeViaHandle:', error);
    }
}


