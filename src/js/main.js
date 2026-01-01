// ============================================
// MAIN - Peamine entry point, ühendab kõik moodulid
// ============================================

import { initCanvas, setupWheelZoom } from './canvas.js';
import { initUI, initDarkMode, updateAlignmentButtons } from './ui.js';
import { state } from './state.js';
import { setToolMode, handleDrawMode, handleEraseMode, drawLine, findStitchesInSelection, isPointInSelection, handleMoveSingleStitch, handleMoveSelectedStitches, getSelectionCenter, saveStateAfterMove, hasChangesBeenMade, clearChangesFlag, markChangesMade, handleRotateViaHandle, handleResizeViaHandle, addNote, editNote, deleteNote, getNoteAtPoint } from './tools.js';
import { getHandleAtPoint, getSelectedStitchesCenter } from './canvas.js';
import { saveState } from './history.js';
import { analyzePattern } from './pattern.js';
import { redrawStitches, getCanvas } from './canvas.js';
import { getCurrentStitches } from './state.js';
import { undo, redo } from './history.js';

/**
 * Teisendab hiire koordinaadid canvas'i koordinaatideks, arvestades zoom taset
 * Arvestab CSS transform scale ja transform-origin center center
 */
function getCanvasCoordinates(e) {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scale = state.zoomLevel || 1.0;
    
    // Hiire koordinaadid suhtes canvas'i bounding rect'i (scaled space)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Canvas'i keskpunkt scaled rect'is
    const scaledCenterX = rect.width / 2;
    const scaledCenterY = rect.height / 2;
    
    // Teisenda keskpunkti suhtes (transform-origin center center)
    const offsetX = mouseX - scaledCenterX;
    const offsetY = mouseY - scaledCenterY;
    
    // Jagage zoom tasemega, et saada canvas'i koordinaadid keskpunkti suhtes
    // Siis liida canvas'i keskpunkt
    const canvasX = (offsetX / scale) + (canvas.width / 2);
    const canvasY = (offsetY / scale) + (canvas.height / 2);
    
    return { x: canvasX, y: canvasY };
}

// Initialize dark mode first (before UI initialization)
// This will set default color to white if dark mode is active
initDarkMode();

// Initialize UI and Canvas when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initUI();
        const canvas = document.getElementById('canvas');
        if (canvas) {
            initCanvas(canvas);
        }
        setupEventListeners();
    });
} else {
    initUI();
    const canvas = document.getElementById('canvas');
    if (canvas) {
        initCanvas(canvas);
    }
    setupEventListeners();
}

function setupEventListeners() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Mouse down
    canvas.addEventListener('mousedown', async (e) => {
        const coords = getCanvasCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        state.isDrawing = true;
        
        if (state.currentToolMode === 'line') {
            state.lineStartPoint = { x, y };
            state.linePreview = { x, y }; // Initialize preview
            state.isDrawing = true; // Set drawing flag for line tool
        } else if (state.currentToolMode === 'move') {
            // First check if clicking on a handle (for rotation)
            const handle = getHandleAtPoint(x, y);
            
            if (handle) {
                // Clicked on a handle
                state.activeHandle = handle;
                state.moveStartPoint = { x, y };
                
                if (handle.type === 'rotate') {
                    // Start rotation
                    state.isRotating = true;
                    state.isResizing = false;
                    
                    const center = getSelectedStitchesCenter();
                    if (center) {
                        const stitches = getCurrentStitches();
                        state.movingStitches = state.selectedStitches.map(index => {
                            const stitch = stitches[index];
                            return {
                                index,
                                originalX: stitch.x,
                                originalY: stitch.y,
                                originalRotation: stitch.rotation || 0
                            };
                        });
                        state.rotateStartAngle = Math.atan2(y - center.y, x - center.x);
                    }
                } else if (handle.type === 'resize') {
                    // Start resizing
                    state.isResizing = true;
                    state.isRotating = false;
                    
                    const center = getSelectedStitchesCenter();
                    if (!center) return;
                    
                    const stitches = getCurrentStitches();
                    state.movingStitches = state.selectedStitches.map(index => {
                        const stitch = stitches[index];
                        if (!stitch) return null;
                        return {
                            index,
                            originalX: stitch.x,
                            originalY: stitch.y,
                            originalDistance: Math.sqrt(
                                Math.pow(stitch.x - center.x, 2) + 
                                Math.pow(stitch.y - center.y, 2)
                            )
                        };
                    }).filter(item => item !== null);
                    
                    // Calculate initial distance from center to handle (use handle position, not mouse position)
                    const handleDistance = Math.sqrt(
                        Math.pow(handle.x - center.x, 2) + 
                        Math.pow(handle.y - center.y, 2)
                    );
                    state.resizeStartDistance = handleDistance > 0 ? handleDistance : 1; // Prevent zero
                }
            } else {
                const stitches = getCurrentStitches();
                let clickedStitchIndex = -1;
                
                // Find clicked stitch
                for (let i = stitches.length - 1; i >= 0; i--) {
                    const stitch = stitches[i];
                    const dist = Math.sqrt(Math.pow(x - stitch.x, 2) + Math.pow(y - stitch.y, 2));
                    if (dist < 20) {
                        clickedStitchIndex = i;
                        break;
                    }
                }
                
                // Check if clicking inside bounding box (for moving)
                const isInBoundingBox = state.selectedStitches.length > 0 && isPointInSelection(x, y);
                
                if (clickedStitchIndex >= 0) {
                    const isSelected = state.selectedStitches.includes(clickedStitchIndex);
                    
                    // If Shift is pressed, toggle selection (don't start moving)
                    if (e.shiftKey) {
                        if (isSelected) {
                            state.selectedStitches = state.selectedStitches.filter(idx => idx !== clickedStitchIndex);
                        } else {
                            state.selectedStitches.push(clickedStitchIndex);
                        }
                        redrawStitches();
                        updateAlignmentButtons();
                    } else {
                        // If clicking on already selected stitch or in bounding box, prepare to move
                        if ((isSelected || isInBoundingBox) && state.selectedStitches.length > 0) {
                            state.moveStartPoint = { x, y };
                            state.isRotating = false;
                            
                            // Prepare for moving selected stitches
                            state.movingStitches = state.selectedStitches.map(index => {
                                const stitch = stitches[index];
                                return {
                                    index,
                                    originalX: stitch.x,
                                    originalY: stitch.y,
                                    originalRotation: stitch.rotation || 0
                                };
                            });
                        } else {
                            // Select only this stitch
                            state.selectedStitches = [clickedStitchIndex];
                            redrawStitches();
                            updateAlignmentButtons();
                        }
                    }
                } else if (isInBoundingBox) {
                    // Clicked in bounding box but not on a stitch - prepare to move selection
                    state.moveStartPoint = { x, y };
                    state.isRotating = false;
                    
                    state.movingStitches = state.selectedStitches.map(index => {
                        const stitch = stitches[index];
                        return {
                            index,
                            originalX: stitch.x,
                            originalY: stitch.y,
                            originalRotation: stitch.rotation || 0
                        };
                    });
                } else {
                    // Clicked on empty space - clear selection if not Shift
                    if (!e.shiftKey && state.selectedStitches.length > 0) {
                        state.selectedStitches = [];
                        redrawStitches();
                        updateAlignmentButtons();
                    }
                }
            }
        } else if (state.currentToolMode === 'select') {
            if (state.selectedStitches.length > 0 && isPointInSelection(x, y)) {
                // Start moving/rotating selected stitches
                state.moveStartPoint = { x, y };
                state.movingStitches = state.selectedStitches.map(index => {
                    const stitch = getCurrentStitches()[index];
                    return {
                        index,
                        originalX: stitch.x,
                        originalY: stitch.y,
                        originalRotation: stitch.rotation || 0
                    };
                });
                state.isRotating = e.shiftKey;
            } else {
                // Start new selection
                state.selectionStart = { x, y };
                state.selectionEnd = null;
                state.selectedStitches = [];
            }
        } else if (state.currentToolMode === 'note') {
            // Note tool - check if clicking on existing note or add new
            const note = getNoteAtPoint(x, y);
            if (note) {
                // Edit existing note
                const { showEditNoteModal } = await import('./ui.js');
                showEditNoteModal(note.id, note.text);
            } else {
                // Add new note
                const { showAddNoteModal } = await import('./ui.js');
                showAddNoteModal(x, y);
            }
        } else if (state.currentToolMode === 'draw') {
            handleDrawMode(x, y);
        } else if (state.currentToolMode === 'erase') {
            handleEraseMode(x, y);
        }
    });
    
    // Mouse move
    canvas.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        if (state.isDrawing) {
            if (state.currentToolMode === 'draw') {
                handleDrawMode(x, y);
            } else if (state.currentToolMode === 'erase') {
                handleEraseMode(x, y);
            } else if (state.currentToolMode === 'move') {
                // Move, rotate or resize selected stitches
                if (state.activeHandle) {
                    if (state.isRotating) {
                        // Rotating via handle
                        handleRotateViaHandle(x, y);
                    } else if (state.isResizing) {
                        // Resizing via handle
                        handleResizeViaHandle(x, y);
                    }
                } else if (state.moveStartPoint && state.movingStitches.length > 0) {
                    handleMoveSelectedStitches(x, y);
                } else if (state.movingSingleStitch && state.moveStartPoint) {
                    handleMoveSingleStitch(x, y);
                }
            } else if (state.currentToolMode === 'select') {
                if (state.moveStartPoint && state.movingStitches.length > 0) {
                    handleMoveSelectedStitches(x, y);
                } else if (state.selectionStart) {
                    state.selectionEnd = {x, y};
                    redrawStitches();
                }
            } else if (state.currentToolMode === 'line' && state.lineStartPoint) {
                // Update line preview
                state.linePreview = { x, y };
                redrawStitches();
            }
        } else if (state.currentToolMode === 'move') {
            const stitches = getCurrentStitches();
            let isOverStitch = false;
            
            // Check if over any stitch
            for (let i = stitches.length - 1; i >= 0; i--) {
                const stitch = stitches[i];
                const dist = Math.sqrt(Math.pow(x - stitch.x, 2) + Math.pow(y - stitch.y, 2));
                if (dist < 20) {
                    isOverStitch = true;
                    break;
                }
            }
            
            // Check if over handle
            if (state.selectedStitches.length > 0) {
                const handle = getHandleAtPoint(x, y);
                if (handle) {
                    if (handle.type === 'rotate') {
                        canvas.style.cursor = 'grab'; // Rotate cursor
                    } else if (handle.type === 'resize') {
                        canvas.style.cursor = 'nwse-resize'; // Resize cursor (diagonal)
                    } else {
                        canvas.style.cursor = 'grab';
                    }
                } else {
                    const isOverSelection = isPointInSelection(x, y);
                    if (isOverSelection) {
                        canvas.style.cursor = 'move';
                    } else if (isOverStitch) {
                        canvas.style.cursor = 'pointer';
                    } else {
                        canvas.style.cursor = 'default';
                    }
                }
            } else if (isOverStitch) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
        } else if (state.currentToolMode === 'select') {
            if (state.selectedStitches.length > 0) {
                const isOverSelection = isPointInSelection(x, y);
                if (isOverSelection) {
                    canvas.style.cursor = e.shiftKey ? 'grab' : 'move';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    });
    
    // Mouse up
    canvas.addEventListener('mouseup', (e) => {
        const coords = getCanvasCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        if (state.currentToolMode === 'line' && state.lineStartPoint) {
            // Only draw line if there's a meaningful distance
            const distance = Math.sqrt(
                Math.pow(x - state.lineStartPoint.x, 2) + 
                Math.pow(y - state.lineStartPoint.y, 2)
            );
            if (distance > 10) {
                drawLine(state.lineStartPoint.x, state.lineStartPoint.y, x, y);
            }
            state.lineStartPoint = null;
            state.linePreview = null;
            state.isDrawing = false;
            // Save state after line is complete
            if (hasChangesBeenMade()) {
                saveState();
                clearChangesFlag();
            }
            redrawStitches(); // Redraw to remove preview
        } else if (state.currentToolMode === 'move') {
            // Finish moving, rotating or resizing selected stitches
            if (state.activeHandle) {
                saveStateAfterMove();
                state.activeHandle = null;
                state.moveStartPoint = null;
                state.movingStitches = [];
                state.isRotating = false;
                state.isResizing = false;
                state.resizeStartDistance = 0;
            } else if (state.moveStartPoint && state.movingStitches.length > 0) {
                saveStateAfterMove();
                state.moveStartPoint = null;
                state.movingStitches = [];
                state.isRotating = false;
            } else if (state.movingSingleStitch) {
                saveStateAfterMove();
                state.movingSingleStitch = null;
                state.moveStartPoint = null;
            }
        } else if (state.currentToolMode === 'select') {
            if (state.selectionStart && state.selectionEnd) {
                findStitchesInSelection();
                state.selectionStart = null;
                state.selectionEnd = null;
            } else if (state.selectedStitches.length > 0 && state.moveStartPoint) {
                // Save state after moving selected stitches
                saveStateAfterMove();
                state.moveStartPoint = null;
                state.movingStitches = [];
                state.isRotating = false;
            }
        } else if (state.currentToolMode === 'draw' || state.currentToolMode === 'erase') {
            // Save state after drawing or erasing is complete
            if (hasChangesBeenMade()) {
                saveState();
                clearChangesFlag();
            }
        }
        
        state.isDrawing = false;
        redrawStitches();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', async (e) => {
        // Ignore shortcuts if user is typing in an input/textarea
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            // Allow Ctrl+C, Ctrl+V, Ctrl+A in text inputs
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'x')) {
                return;
            }
            // Allow Delete and Backspace in text inputs
            if (e.key === 'Delete' || e.key === 'Backspace') {
                return;
            }
        }
        
        // Ctrl/Cmd + key combinations
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                const { saveJSON } = await import('./ui.js');
                saveJSON();
            } else if (e.key === 'z' && !e.shiftKey) {
                // Undo (Ctrl+Z)
                e.preventDefault();
                if (undo()) {
                    redrawStitches();
                    const { updateRoundsList } = await import('./ui.js');
                    updateRoundsList();
                }
            } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                // Redo (Ctrl+Y or Ctrl+Shift+Z)
                e.preventDefault();
                if (redo()) {
                    redrawStitches();
                    const { updateRoundsList } = await import('./ui.js');
                    updateRoundsList();
                }
            } else if (e.key === 'c') {
                // Copy (Ctrl+C / Cmd+C)
                e.preventDefault();
                const { copySelectedStitches } = await import('./tools.js');
                copySelectedStitches();
            } else if (e.key === 'v') {
                // Paste (Ctrl+V / Cmd+V)
                e.preventDefault();
                const { pasteStitches } = await import('./tools.js');
                pasteStitches();
            } else if (e.key === 'd') {
                // Duplicate (Ctrl+D / Cmd+D)
                e.preventDefault();
                const { duplicateSelectedStitches } = await import('./tools.js');
                duplicateSelectedStitches();
            }
        } else {
            // Single key shortcuts (only when not in text input)
            if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
                if (e.key === 'v' || e.key === 'V') {
                    // Move tool (V)
                    e.preventDefault();
                    setToolMode('move');
                } else if (e.key === 'b' || e.key === 'B') {
                    // Draw tool (B)
                    e.preventDefault();
                    setToolMode('draw');
                } else if (e.key === 'e' || e.key === 'E') {
                    // Erase tool (E)
                    e.preventDefault();
                    setToolMode('erase');
                } else if (e.key === 'l' || e.key === 'L') {
                    // Line tool (L)
                    e.preventDefault();
                    setToolMode('line');
                } else if (e.key === 's' || e.key === 'S') {
                    // Select tool (S)
                    e.preventDefault();
                    setToolMode('select');
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    // Delete selected stitches
                    e.preventDefault();
                    const { deleteSelectedStitches } = await import('./tools.js');
                    deleteSelectedStitches();
                }
            }
        }
    });
    
    // Close modals when clicking outside
    window.onclick = async function(event) {
        const symmetryModal = document.getElementById('symmetryModal');
        const crochetModal = document.getElementById('crochetChartModal');
        if (event.target === symmetryModal) {
            const { closeSymmetryModal } = await import('./ui.js');
            closeSymmetryModal();
        }
        if (event.target === crochetModal) {
            const { closeCrochetChartModal } = await import('./ui.js');
            closeCrochetChartModal();
        }
        const noteModal = document.getElementById('noteModal');
        const editNoteModal = document.getElementById('editNoteModal');
        if (event.target === noteModal) {
            const { closeNoteModal } = await import('./ui.js');
            closeNoteModal();
        }
        if (event.target === editNoteModal) {
            const { closeEditNoteModal } = await import('./ui.js');
            closeEditNoteModal();
        }
    };
}

// Expose functions to window for onclick handlers
window.exportToPDF = async function() {
    const { exportToPDF } = await import('./ui.js');
    exportToPDF();
};

window.closeNoteModal = async function() {
    const { closeNoteModal } = await import('./ui.js');
    closeNoteModal();
};

window.closeEditNoteModal = async function() {
    const { closeEditNoteModal } = await import('./ui.js');
    closeEditNoteModal();
};

window.saveNote = async function() {
    const { getNoteModalState, closeNoteModal } = await import('./ui.js');
    const { addNote } = await import('./tools.js');
    const { redrawStitches } = await import('./canvas.js');
    
    const state = getNoteModalState();
    const textarea = document.getElementById('noteText');
    const text = textarea ? textarea.value.trim() : '';
    
    if (text) {
        addNote(state.x, state.y, text);
        redrawStitches();
    }
    
    closeNoteModal();
};

window.saveEditedNote = async function() {
    const { getNoteModalState, closeEditNoteModal } = await import('./ui.js');
    const { editNote } = await import('./tools.js');
    const { redrawStitches } = await import('./canvas.js');
    
    const state = getNoteModalState();
    const textarea = document.getElementById('editNoteText');
    const text = textarea ? textarea.value.trim() : '';
    
    if (text && state.editingNoteId) {
        editNote(state.editingNoteId, text);
        redrawStitches();
    }
    
    closeEditNoteModal();
};

window.deleteCurrentNote = async function() {
    const { getNoteModalState, closeEditNoteModal } = await import('./ui.js');
    const { deleteNote } = await import('./tools.js');
    const { redrawStitches } = await import('./canvas.js');
    
    const state = getNoteModalState();
    
    if (state.editingNoteId) {
        if (confirm('Kas oled kindel, et soovid märkuse kustutada?')) {
            deleteNote(state.editingNoteId);
            redrawStitches();
            closeEditNoteModal();
        }
    }
};

console.log('✓ Professional Crochet Editor Ready!');

