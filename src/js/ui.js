// ============================================
// UI COMPONENTS - UI komponendid ja event handlerid
// ============================================

import { state, setCurrentStitch, setCurrentColor, setCurrentShape, setCurrentToolMode, setSymmetryMode, setCurrentLayerIndex, addLayer } from './state.js';
import { stitchNames, stitchSymbols, stitchCategories } from './config.js';
import { setToolMode } from './tools.js';
import { redrawStitches, zoom, setupWheelZoom } from './canvas.js';
import { analyzePattern, toggleAutoContinue } from './pattern.js';
import { drawStitch } from './canvas.js';
import { undo, redo, initHistory } from './history.js';

// Export functions to global scope for onclick handlers
window.setToolMode = setToolMode;
window.toggleAutoContinue = toggleAutoContinue;
window.addNewLayer = addNewLayer;
window.previousLayer = previousLayer;
window.nextLayer = nextLayer;
window.toggleShowAllLayers = toggleShowAllLayers;
window.updateStitchSize = updateStitchSize;
window.updateRotation = updateRotation;
window.updateColor = updateColor;
window.changeShape = changeShape;
window.savePattern = savePattern;
window.saveJSON = saveJSON;
window.clearAllStitches = clearAllStitches;
window.loadJSON = loadJSON;
window.zoom = zoomWrapper;
window.toggleSymmetryModal = toggleSymmetryModal;
window.closeSymmetryModal = closeSymmetryModal;
window.selectSymmetryMode = selectSymmetryMode;
window.updateSymmetryMode = updateSymmetryMode;
window.openCrochetChartModal = openCrochetChartModal;
window.closeCrochetChartModal = closeCrochetChartModal;
window.selectStitchFromChart = selectStitchFromChart;
window.toggleDarkMode = toggleDarkMode;

export function initUI() {
    try {
        createLeftToolbar();
        createRightSidebar();
        initHistory(); // Initialize history system
        setupWheelZoom(); // Setup mouse wheel zoom
        updateColorPickerForDarkMode(); // Update color picker for dark mode
    } catch (error) {
        console.error('Error initializing UI:', error);
        alert('Viga UI initsialiseerimisel: ' + error.message);
    }
}

export function createLeftToolbar() {
    const toolbar = document.getElementById('leftToolbar');
    
    const tools = [
        { id: 'draw', icon: '✏️', title: 'Joonista' },
        { id: 'erase', icon: '🧹', title: 'Kustuta' },
        { id: 'line', icon: '📏', title: 'Joon' },
        { id: 'move', icon: '✋', title: 'Liiguta' },
        { id: 'select', icon: '⬚', title: 'Vali ala' },
    ];

    const section1 = document.createElement('div');
    section1.className = 'toolbar-section';
    
    tools.forEach((tool, index) => {
        const btn = document.createElement('div');
        btn.className = 'tool-icon' + (index === 0 ? ' active' : '');
        btn.innerHTML = tool.icon;
        btn.title = tool.title;
        btn.onclick = () => setToolMode(tool.id);
        btn.dataset.tool = tool.id;
        section1.appendChild(btn);
    });
    
    toolbar.appendChild(section1);
    
    // Add note tool
    const noteBtn = document.createElement('div');
    noteBtn.className = 'tool-icon';
    noteBtn.innerHTML = '📝';
    noteBtn.title = 'Lisa märkus (Notes tool)';
    noteBtn.onclick = () => setToolMode('note');
    noteBtn.dataset.tool = 'note';
    section1.appendChild(noteBtn);
    
    // Divider
    const div1 = document.createElement('div');
    div1.className = 'toolbar-divider';
    toolbar.appendChild(div1);
    
    // Undo/Redo
    const section3 = document.createElement('div');
    section3.className = 'toolbar-section';
    
            const undoBtn = document.createElement('div');
            undoBtn.className = 'tool-icon';
            undoBtn.innerHTML = '↶';
            undoBtn.title = 'Tagasi (Ctrl+Z)';
            undoBtn.onclick = () => {
                if (undo()) {
                    redrawStitches();
                    updateRoundsList();
                }
            };
            section3.appendChild(undoBtn);
            
            const redoBtn = document.createElement('div');
            redoBtn.className = 'tool-icon';
            redoBtn.innerHTML = '↷';
            redoBtn.title = 'Uuesti (Ctrl+Y)';
            redoBtn.onclick = () => {
                if (redo()) {
                    redrawStitches();
                    updateRoundsList();
                }
            };
            section3.appendChild(redoBtn);
    
    toolbar.appendChild(section3);
}

export function createRightSidebar() {
    const sidebar = document.getElementById('rightSidebar');
    
    // Auto-continue status
    const autoSection = document.createElement('div');
    autoSection.className = 'sidebar-section';
    autoSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3>🤖 Automaatne jätkamine</h3>
            <label class="toggle-switch">
                <input type="checkbox" id="autoContinue" checked onchange="toggleAutoContinue()">
                <span class="slider"></span>
            </label>
        </div>
        <div class="auto-status" id="autoStatus">
            Lisa 3 silmust samal ringil
        </div>
    `;
    sidebar.appendChild(autoSection);
    
    // Rounds section
    const roundsSection = document.createElement('div');
    roundsSection.className = 'sidebar-section';
    roundsSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3>Rounds</h3>
            <label class="toggle-switch" title="Näita kõiki round'e korraga">
                <input type="checkbox" id="showAllLayers" onchange="toggleShowAllLayers()">
                <span class="slider"></span>
            </label>
        </div>
        <div class="round-nav">
            <button class="round-nav-btn" onclick="previousLayer()">◀ Eelmine</button>
            <button class="round-nav-btn" onclick="nextLayer()">Järgmine ▶</button>
        </div>
        <div id="roundsList"></div>
        <button class="add-round-btn" onclick="addNewLayer()">+ Lisa uus round</button>
    `;
    sidebar.appendChild(roundsSection);
    
    // Properties section
    const propsSection = document.createElement('div');
    propsSection.className = 'sidebar-section';
    propsSection.innerHTML = `
        <h3>Properties</h3>
        <div class="property-row">
            <span class="property-label">Praegune pistet:</span>
            <span class="property-value" id="propCurrentStitch">${stitchNames[state.currentStitch]}</span>
        </div>
        <div class="property-row">
            <span class="property-label">Suurus:</span>
            <input type="number" class="property-input" id="propStitchSize" value="${state.currentStitchSize}" min="10" max="50" onchange="updateStitchSize()">
        </div>
        <div class="property-row">
            <span class="property-label">Pööramine:</span>
            <input type="number" class="property-input" id="propRotation" value="${state.currentRotation}" min="-180" max="180" onchange="updateRotation()">
        </div>
        <div class="property-row">
            <span class="property-label">Värv:</span>
            <input type="color" id="propColor" value="${state.currentColor}" onchange="updateColor()" style="width: 50px; height: 30px; border: none; cursor: pointer;">
        </div>
        <div class="property-row">
            <span class="property-label">Kuju:</span>
            <select class="property-value" id="propShape" onchange="changeShape()">
                <option value="circle">Ring</option>
                <option value="square">Ruut</option>
                <option value="hexagon">Kuusnurk</option>
                <option value="triangle">Kolmnurk</option>
                <option value="octagon">Kaheksanurk</option>
                <option value="freeform">Vabakuju</option>
            </select>
        </div>
        <div class="property-row">
            <span class="property-label">Sümmeetria:</span>
            <select class="property-value" id="propSymmetry" onchange="updateSymmetryMode()">
                <option value="none">Väljas</option>
                <option value="mirror-h">Peegel H</option>
                <option value="mirror-v">Peegel V</option>
                <option value="mirror-both">Peegel Mõlemad</option>
                <option value="radial-4">Radiaalne 4</option>
                <option value="radial-6">Radiaalne 6</option>
                <option value="radial-8">Radiaalne 8</option>
            </select>
        </div>
    `;
            sidebar.appendChild(propsSection);
            
            // Alignment Tools Section
            const alignmentSection = document.createElement('div');
            alignmentSection.className = 'sidebar-section';
            alignmentSection.innerHTML = `
                <h3>Joondustööriistad</h3>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="menu-btn align-btn" data-align="left" title="Joonda vasakule" style="padding: 8px 12px; font-size: 16px;">←</button>
                        <button class="menu-btn align-btn" data-align="center-h" title="Joonda horisontaalselt keskele" style="padding: 8px 12px; font-size: 16px;">⬌</button>
                        <button class="menu-btn align-btn" data-align="right" title="Joonda paremale" style="padding: 8px 12px; font-size: 16px;">→</button>
                    </div>
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="menu-btn align-btn" data-align="top" title="Joonda üles" style="padding: 8px 12px; font-size: 16px;">↑</button>
                        <button class="menu-btn align-btn" data-align="center-v" title="Joonda vertikaalselt keskele" style="padding: 8px 12px; font-size: 16px;">⬍</button>
                        <button class="menu-btn align-btn" data-align="bottom" title="Joonda alla" style="padding: 8px 12px; font-size: 16px;">↓</button>
                    </div>
                    <div style="display: flex; gap: 5px; justify-content: center; margin-top: 5px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <button class="menu-btn align-btn" data-distribute="horizontal" title="Jaota horisontaalselt" style="padding: 6px 10px; font-size: 12px;">↔ Jaota H</button>
                        <button class="menu-btn align-btn" data-distribute="vertical" title="Jaota vertikaalselt" style="padding: 6px 10px; font-size: 12px;">↕ Jaota V</button>
                    </div>
                </div>
            `;
            alignmentSection.id = 'alignmentSection';
            sidebar.appendChild(alignmentSection);
            
            // Add event listeners for alignment buttons
            const alignButtons = alignmentSection.querySelectorAll('.align-btn');
            alignButtons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const align = btn.dataset.align;
                    const distribute = btn.dataset.distribute;
                    
                    if (align) {
                        const { alignSelectedStitches } = await import('./tools.js');
                        alignSelectedStitches(align);
                    } else if (distribute) {
                        const { distributeSelectedStitches } = await import('./tools.js');
                        distributeSelectedStitches(distribute);
                    }
                });
            });
            
            // Function to update alignment buttons state
            window.updateAlignmentButtons = function() {
                const hasSelection = state.selectedStitches.length >= 2;
                alignButtons.forEach(btn => {
                    if (btn.dataset.align === 'center-h' || btn.dataset.align === 'center-v') {
                        // Center alignment needs at least 2 items
                        btn.disabled = !hasSelection;
                    } else if (btn.dataset.distribute) {
                        // Distribution needs at least 3 items
                        btn.disabled = state.selectedStitches.length < 3;
                    } else {
                        btn.disabled = !hasSelection;
                    }
                    btn.style.opacity = btn.disabled ? '0.5' : '1';
                    btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
                });
            };
    
    // Stitch Palette
    const paletteSection = document.createElement('div');
    paletteSection.className = 'sidebar-section';
    paletteSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Pistete palett</h3>
            <button class="menu-btn" onclick="openCrochetChartModal()" style="padding: 6px 12px; font-size: 12px;">📋 Chart</button>
        </div>
        <div class="stitch-palette" id="stitchPalette"></div>
    `;
    sidebar.appendChild(paletteSection);
    
    updateStitchPalette();
    updateRoundsList();
}

function drawStitchToCanvas(canvas, stitch, color = '#333', size = 20) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    const scale = size / 22;
    
    // Simplified version - just draw basic symbol
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

export function updateStitchPalette() {
    const palette = document.getElementById('stitchPalette');
    if (!palette) return;
    
    palette.innerHTML = '';
    
    const isDark = document.body.classList.contains('dark-mode');
    const symbolColor = isDark ? '#e0e0e0' : '#333';
    
    Object.keys(stitchSymbols).forEach(stitchId => {
        const item = document.createElement('div');
        const isActive = stitchId === state.currentStitch;
        item.className = 'stitch-palette-item' + (isActive ? ' active' : '');
        item.title = stitchNames[stitchId];
        
        // Create a small canvas for the symbol
        const symbolCanvas = document.createElement('canvas');
        symbolCanvas.width = 40;
        symbolCanvas.height = 40;
        const color = isActive ? '#ffffff' : symbolColor;
        drawStitchToCanvas(symbolCanvas, stitchId, color, 18);
        
        item.appendChild(symbolCanvas);
        item.onclick = () => {
            setCurrentStitch(stitchId);
            updateStitchPalette();
            updateProperties();
        };
        palette.appendChild(item);
    });
}

export function updateAlignmentButtons() {
    if (typeof window.updateAlignmentButtons === 'function') {
        window.updateAlignmentButtons();
    }
}

export function updateRoundsList() {
    const list = document.getElementById('roundsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    state.layers.forEach((layer, index) => {
        const item = document.createElement('div');
        item.className = 'round-item' + (index === state.currentLayerIndex ? ' active' : '');
        item.onclick = () => {
            setCurrentLayerIndex(index);
            updateRoundsList();
            redrawStitches();
        };
        
        const checkbox = document.createElement('div');
        checkbox.className = 'round-checkbox';
        checkbox.innerHTML = '✓';
        
        const text = document.createElement('div');
        text.className = 'round-text';
        text.innerHTML = layer.name + '<br><span class="round-count">' + layer.stitches.length + ' pisteid</span>';
        
        const actions = document.createElement('div');
        actions.className = 'round-actions';
        actions.innerHTML = '<span class="round-status">✓</span>';
        
        item.appendChild(checkbox);
        item.appendChild(text);
        item.appendChild(actions);
        
        list.appendChild(item);
    });
}

export function updateProperties() {
    const prop = document.getElementById('propCurrentStitch');
    if (prop) prop.textContent = stitchNames[state.currentStitch];
}

export function updateAutoStatus() {
    const status = document.getElementById('autoStatus');
    if (!status) return;
    
    const stitches = state.layers[state.currentLayerIndex]?.stitches || [];
    
    if (state.suggestions.length > 0) {
        status.className = 'auto-status active';
        status.innerHTML = `✓ Muster tuvastatud!<br>${state.suggestions.length} soovitust saadaval`;
    } else if (stitches.length >= 3) {
        status.className = 'auto-status';
        status.innerHTML = '⚠️ Muster ei ole veel selge';
    } else {
        status.className = 'auto-status';
        status.innerHTML = 'Lisa 3 silmust samal ringil';
    }
}

// Layer Management
export async function addNewLayer() {
    try {
        const newLayer = {
            id: state.nextLayerId,
            name: `Round ${state.layers.length + 1}`,
            stitches: [],
            visible: true
        };
        
        addLayer(newLayer);
        setCurrentLayerIndex(state.layers.length - 1);
        state.suggestions = [];
        
        updateRoundsList();
        redrawStitches();
        
        // Save state after adding layer
        const { saveState } = await import('./history.js');
        saveState();
    } catch (error) {
        console.error('Error adding new layer:', error);
        alert('Viga uue round\'i lisamisel: ' + error.message);
    }
}

export function previousLayer() {
    if (state.currentLayerIndex > 0) {
        setCurrentLayerIndex(state.currentLayerIndex - 1);
        state.suggestions = [];
        analyzePattern();
        updateRoundsList();
        redrawStitches();
    }
}

export function nextLayer() {
    if (state.currentLayerIndex < state.layers.length - 1) {
        setCurrentLayerIndex(state.currentLayerIndex + 1);
        state.suggestions = [];
        analyzePattern();
        updateRoundsList();
        redrawStitches();
    }
}

export function toggleShowAllLayers() {
    state.showAllLayers = document.getElementById('showAllLayers').checked;
    redrawStitches();
}

// Property Updates
export function updateStitchSize() {
    state.currentStitchSize = parseInt(document.getElementById('propStitchSize').value);
}

export function updateRotation() {
    state.currentRotation = parseInt(document.getElementById('propRotation').value);
}

export function updateColor() {
    const color = document.getElementById('propColor').value;
    setCurrentColor(color);
}

export function changeShape() {
    const shape = document.getElementById('propShape').value;
    setCurrentShape(shape);
    redrawStitches();
}

// Export Functions
export async function exportToPDF() {
    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            alert('PDF export requires jsPDF library. Please check your internet connection.');
            return;
        }
        
        // Try both possible ways jsPDF might be loaded
        const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
        if (!jsPDF) {
            alert('PDF export requires jsPDF library. Please check your internet connection.');
            return;
        }
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        // Get canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Create PDF (A4 size in mm)
        const pdf = new jsPDF({
            orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Convert pixels to mm (assuming 96 DPI / 37.8 pixels per mm)
        const pxToMm = 1 / 3.7795275591;
        
        // Calculate scaling to fit page
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // mm margin
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        // Convert canvas dimensions to mm
        const canvasWidthMm = canvasWidth * pxToMm;
        const canvasHeightMm = canvasHeight * pxToMm;
        
        const scaleX = contentWidth / canvasWidthMm;
        const scaleY = contentHeight / canvasHeightMm;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = canvasWidthMm * scale;
        const scaledHeight = canvasHeightMm * scale;
        const xOffset = (pageWidth - scaledWidth) / 2;
        const yOffset = (pageHeight - scaledHeight) / 2;
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
        
        // Add metadata
        const date = new Date().toLocaleDateString('et-EE');
        pdf.setProperties({
            title: 'Heegelmotiiv',
            subject: 'Heegelmotiivi muster',
            author: 'Heegelmotiivide Redaktor',
            creator: 'Heegelmotiivide Redaktor',
            keywords: 'heegeldamine, crochet, muster'
        });
        
        // Add footer with date
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Loodud: ${date}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        // Generate filename
        const filename = `heegelmotiiv_${date.replace(/\//g, '-')}.pdf`;
        
        // Save PDF
        pdf.save(filename);
        
        console.log('PDF exported successfully');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Viga PDF eksportimisel: ' + error.message);
    }
}

export function savePattern() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = `heegelmotiiv_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

export function saveJSON() {
    const canvas = document.getElementById('canvas');
    const data = {
        shape: state.currentShape,
        size: canvas.width,
        layers: state.layers,
        currentLayerIndex: state.currentLayerIndex,
        date: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heegelmotiiv_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function clearAllStitches() {
    const totalStitches = state.layers.reduce((total, layer) => total + layer.stitches.length, 0);
    
    if (totalStitches === 0) {
        return;
    }
    
    const confirmMessage = `Kas oled kindel, et soovid kustutada kõik ${totalStitches} pisteid kõigilt ${state.layers.length} round'ilt?\n\nSee toiming on pöördumatu!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    state.layers.forEach(layer => {
        layer.stitches = [];
    });
    
    state.suggestions = [];
    setCurrentLayerIndex(0);
    
    updateRoundsList();
    redrawStitches();
    analyzePattern();
}

export function loadJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const canvas = document.getElementById('canvas');
                
                setCurrentShape(data.shape);
                canvas.width = data.size;
                canvas.height = data.size;
                
                if (data.layers) {
                    state.layers = data.layers;
                    setCurrentLayerIndex(data.currentLayerIndex || 0);
                    state.nextLayerId = Math.max(...state.layers.map(l => l.id)) + 1;
                }
                
                state.suggestions = [];
                
                document.getElementById('propShape').value = state.currentShape;
                
                analyzePattern();
                updateRoundsList();
                redrawStitches();
            } catch (error) {
                alert('Viga motiivi laadimisel: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Zoom & Other Utilities - now uses canvas.js zoom function
export function zoomWrapper(delta) {
    zoom(delta);
}

// Symmetry Modal
export function toggleSymmetryModal() {
    const modal = document.getElementById('symmetryModal');
    modal.style.display = 'block';
    updateSymmetryModalDisplay();
}

export function closeSymmetryModal() {
    document.getElementById('symmetryModal').style.display = 'none';
}

export function selectSymmetryMode(mode) {
    setSymmetryMode(mode);
    
    const dropdown = document.getElementById('propSymmetry');
    if (dropdown) {
        dropdown.value = mode;
    }
    
    updateSymmetryModalDisplay();
    
    document.querySelectorAll('.symmetry-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`.symmetry-option[data-mode="${mode}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

export function updateSymmetryMode() {
    const mode = document.getElementById('propSymmetry').value;
    setSymmetryMode(mode);
    const modal = document.getElementById('symmetryModal');
    if (modal && modal.style.display === 'block') {
        updateSymmetryModalDisplay();
    }
}

function updateSymmetryModalDisplay() {
    const display = document.getElementById('currentSymmetryDisplay');
    if (!display) return;
    
    const modeNames = {
        'none': 'Väljas',
        'mirror-h': 'Peegel H',
        'mirror-v': 'Peegel V',
        'mirror-both': 'Peegel Mõlemad',
        'radial-4': 'Radiaalne 4',
        'radial-6': 'Radiaalne 6',
        'radial-8': 'Radiaalne 8'
    };
    
    display.textContent = modeNames[state.symmetryMode] || 'Väljas';
    
    document.querySelectorAll('.symmetry-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`.symmetry-option[data-mode="${state.symmetryMode}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// Crochet Chart Modal
let selectedChartStitch = null;
let currentChartCategory = 'basic';

export function openCrochetChartModal() {
    const modal = document.getElementById('crochetChartModal');
    modal.style.display = 'block';
    selectedChartStitch = null;
    renderChartCategories();
    renderChartStitches('basic');
}

export function closeCrochetChartModal() {
    document.getElementById('crochetChartModal').style.display = 'none';
    selectedChartStitch = null;
}

function renderChartCategories() {
    const container = document.getElementById('chartCategories');
    if (!container) return;
    container.innerHTML = '';
    
    Object.keys(stitchCategories).forEach(categoryId => {
        const btn = document.createElement('button');
        btn.className = 'chart-category-btn' + (categoryId === currentChartCategory ? ' active' : '');
        btn.textContent = stitchCategories[categoryId].name;
        btn.onclick = () => {
            currentChartCategory = categoryId;
            renderChartCategories();
            renderChartStitches(categoryId);
        };
        container.appendChild(btn);
    });
}

function renderChartStitches(categoryId) {
    const grid = document.getElementById('chartStitchesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const category = stitchCategories[categoryId];
    if (!category) return;
    
    category.stitches.forEach(stitchId => {
        const item = document.createElement('div');
        item.className = 'chart-stitch-item';
        item.innerHTML = `
            ${stitchSymbols[stitchId] || '?'}
            <div class="stitch-tooltip">${stitchNames[stitchId] || stitchId}</div>
        `;
        item.onclick = () => {
            document.querySelectorAll('.chart-stitch-item').forEach(el => {
                el.classList.remove('selected');
            });
            item.classList.add('selected');
            selectedChartStitch = stitchId;
            
            const info = document.getElementById('selectedStitchInfo');
            if (info) info.textContent = `Valitud: ${stitchNames[stitchId] || stitchId}`;
            
            const addBtn = document.getElementById('addStitchBtn');
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
                addBtn.style.cursor = 'pointer';
            }
        };
        grid.appendChild(item);
    });
    
    const info = document.getElementById('selectedStitchInfo');
    if (info) info.textContent = 'Vali piste...';
    const addBtn = document.getElementById('addStitchBtn');
    if (addBtn) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
    }
}

export function selectStitchFromChart() {
    if (!selectedChartStitch) return;
    
    setCurrentStitch(selectedChartStitch);
    updateStitchPalette();
    updateProperties();
    closeCrochetChartModal();
}

// Dark Mode
export function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    const toggleBtn = document.getElementById('darkModeToggle');
    
    if (isDark) {
        // Switching to light mode
        body.classList.remove('dark-mode');
        if (toggleBtn) {
            toggleBtn.innerHTML = '🌙';
            toggleBtn.title = 'Dark Mode';
        }
        localStorage.setItem('darkMode', 'false');
        
        // If current color is white (dark mode default), change to black (light mode default)
        if (state.currentColor === '#ffffff' || state.currentColor === '#FFFFFF') {
            setCurrentColor('#000000');
            const colorInput = document.getElementById('propColor');
            if (colorInput) {
                colorInput.value = '#000000';
            }
        }
    } else {
        // Switching to dark mode
        body.classList.add('dark-mode');
        if (toggleBtn) {
            toggleBtn.innerHTML = '☀️';
            toggleBtn.title = 'Light Mode';
        }
        localStorage.setItem('darkMode', 'true');
        
        // If current color is black (light mode default), change to white (dark mode default)
        if (state.currentColor === '#000000') {
            setCurrentColor('#ffffff');
            const colorInput = document.getElementById('propColor');
            if (colorInput) {
                colorInput.value = '#ffffff';
            }
        }
    }
    
    updateStitchPalette();
    redrawStitches();
}

export function initDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedDarkMode === 'true' || (savedDarkMode === null && prefersDark);
    
    if (shouldBeDark) {
        document.body.classList.add('dark-mode');
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '☀️';
            toggleBtn.title = 'Light Mode';
        }
        
        // Set default color to white in dark mode if it's still the default black
        // This happens before UI is initialized, so state.currentColor will be set correctly
        if (state.currentColor === '#000000' || state.currentColor === '#000') {
            state.currentColor = '#ffffff';
        }
    }
}

// Update color picker after UI is initialized (called from initUI)
export function updateColorPickerForDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    const colorInput = document.getElementById('propColor');
    if (colorInput && isDark && state.currentColor === '#ffffff') {
        colorInput.value = '#ffffff';
    } else if (colorInput && !isDark && state.currentColor === '#000000') {
        colorInput.value = '#000000';
    }
}

