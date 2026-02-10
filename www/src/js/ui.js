// ============================================
// UI COMPONENTS - UI komponendid ja event handlerid
// ============================================

import { state, setCurrentStitch, setCurrentColor, setCurrentShape, setCurrentToolMode, setSymmetryMode, setCurrentLayerIndex, addLayer, addCustomStitch, updateCustomStitch, deleteCustomStitch, getCustomStitch, getAllCustomStitches, mergeCustomStitches, loadCustomStitchesFromLocalStorage } from './state.js';
import { stitchNames, stitchSymbols, stitchCategories, getStitchName, getStitchSymbol, getAllStitchSymbols, getAllStitchNames, stitchSvgFiles } from './config.js';
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
window.updateCanvasSize = updateCanvasSize;
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
window.showCustomStitchModal = showCustomStitchModal;
window.closeCustomStitchModal = closeCustomStitchModal;
window.saveCustomStitch = saveCustomStitch;
window.deleteCustomStitchFromModal = deleteCustomStitchFromModal;
window.selectSymbolFromDropdown = selectSymbolFromDropdown;
window.updateCustomStitchPreview = updateCustomStitchPreview;
window.handleCustomCategoryInput = handleCustomCategoryInput;
window.toggleSidebarDrawer = toggleSidebarDrawer;

export function initUI() {
    try {
        // Load custom stitches from localStorage first
        loadCustomStitchesFromLocalStorage();
        
        createLeftToolbar();
        createRightSidebar();
        createBottomToolbar(); // Create mobile bottom toolbar
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

export function createBottomToolbar() {
    const bottomToolbar = document.getElementById('bottomToolbar');
    if (!bottomToolbar) return;
    
    // Clear existing content
    bottomToolbar.innerHTML = '';
    
    // Wrapper for two rows
    const rows = document.createElement('div');
    rows.className = 'toolbar-rows';
    
    // ===== TOP ROW: undo/redo + zoom =====
    const topRow = document.createElement('div');
    topRow.className = 'toolbar-section-secondary';
    
    const undoBtn = document.createElement('div');
    undoBtn.className = 'tool-icon';
    undoBtn.innerHTML = '↶';
    undoBtn.title = 'Tagasi (Undo)';
    undoBtn.onclick = () => {
        if (undo()) {
            redrawStitches();
            updateRoundsList();
        }
    };
    topRow.appendChild(undoBtn);
    
    const redoBtn = document.createElement('div');
    redoBtn.className = 'tool-icon';
    redoBtn.innerHTML = '↷';
    redoBtn.title = 'Uuesti (Redo)';
    redoBtn.onclick = () => {
        if (redo()) {
            redrawStitches();
            updateRoundsList();
        }
    };
    topRow.appendChild(redoBtn);
    
    // Separator
    const sep = document.createElement('div');
    sep.style.cssText = 'width: 1px; height: 20px; background: #ddd; margin: 0 4px;';
    topRow.appendChild(sep);
    
    const zoomOutBtn = document.createElement('div');
    zoomOutBtn.className = 'tool-icon';
    zoomOutBtn.innerHTML = '🔍−';
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.onclick = () => zoom(-0.1);
    topRow.appendChild(zoomOutBtn);
    
    const zoomInBtn = document.createElement('div');
    zoomInBtn.className = 'tool-icon';
    zoomInBtn.innerHTML = '🔍+';
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.onclick = () => zoom(0.1);
    topRow.appendChild(zoomInBtn);
    
    rows.appendChild(topRow);
    
    // ===== BOTTOM ROW: drawing tools =====
    const tools = [
        { id: 'draw', icon: '✏️', title: 'Joonista' },
        { id: 'erase', icon: '🧹', title: 'Kustuta' },
        { id: 'line', icon: '📏', title: 'Joon' },
        { id: 'move', icon: '✋', title: 'Liiguta' },
        { id: 'select', icon: '⬚', title: 'Vali ala' },
        { id: 'note', icon: '📝', title: 'Märkus' },
    ];
    
    const section = document.createElement('div');
    section.className = 'toolbar-section';
    
    tools.forEach((tool, index) => {
        const btn = document.createElement('div');
        btn.className = 'tool-icon' + (index === 0 ? ' active' : '');
        btn.innerHTML = tool.icon;
        btn.title = tool.title;
        btn.onclick = () => {
            setToolMode(tool.id);
            // Update active state in bottom toolbar
            section.querySelectorAll('.tool-icon').forEach(icon => icon.classList.remove('active'));
            btn.classList.add('active');
            // Also update left toolbar if it exists
            const leftToolbar = document.getElementById('leftToolbar');
            if (leftToolbar) {
                leftToolbar.querySelectorAll('.tool-icon').forEach(icon => {
                    icon.classList.remove('active');
                    if (icon.dataset.tool === tool.id) {
                        icon.classList.add('active');
                    }
                });
            }
        };
        btn.dataset.tool = tool.id;
        section.appendChild(btn);
    });
    
    rows.appendChild(section);
    bottomToolbar.appendChild(rows);
}

// Toggle sidebar drawer for mobile
export function toggleSidebarDrawer() {
    const drawer = document.getElementById('sidebarDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const hamburger = document.getElementById('hamburgerMenu');
    
    if (!drawer || !overlay || !hamburger) return;
    
    const isOpen = drawer.classList.contains('open');
    
    if (isOpen) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        drawer.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Populate drawer content if empty
        const drawerContent = document.getElementById('drawerContent');
        if (drawerContent && drawerContent.children.length === 0) {
            populateDrawerContent();
        }
    }
}

// Populate drawer content from right sidebar
function populateDrawerContent() {
    const drawerContent = document.getElementById('drawerContent');
    const rightSidebar = document.getElementById('rightSidebar');
    
    if (!drawerContent || !rightSidebar) return;
    
    // Clone sidebar content
    drawerContent.innerHTML = rightSidebar.innerHTML;
    
    // Re-attach event listeners for drawer content
    attachDrawerEventListeners();
}

// Update drawer content when sidebar is updated
export function updateDrawerContent() {
    const drawerContent = document.getElementById('drawerContent');
    const rightSidebar = document.getElementById('rightSidebar');
    
    if (!drawerContent || !rightSidebar) return;
    
    // Only update if drawer is open
    const drawer = document.getElementById('sidebarDrawer');
    if (drawer && drawer.classList.contains('open')) {
        drawerContent.innerHTML = rightSidebar.innerHTML;
        attachDrawerEventListeners();
    }
}

// Attach event listeners to drawer content
function attachDrawerEventListeners() {
    const drawerContent = document.getElementById('drawerContent');
    if (!drawerContent) return;
    
    // Re-attach all event listeners that might be in the sidebar
    // This is a simplified version - you may need to adjust based on your actual sidebar content
    const buttons = drawerContent.querySelectorAll('button, .menu-btn, .icon-btn');
    buttons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            btn.onclick = () => {
                eval(onclick);
                // Close drawer after some actions
                if (onclick.includes('update') || onclick.includes('toggle') || onclick.includes('add')) {
                    // Keep drawer open for these actions
                } else {
                    // Close drawer for other actions
                    setTimeout(() => toggleSidebarDrawer(), 300);
                }
            };
        }
    });
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
            <span class="property-value" id="propCurrentStitch">${getStitchName(state.currentStitch)}</span>
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
        <div class="property-row">
            <span class="property-label">Canvas suurus:</span>
            <select class="property-value" id="propCanvasSize" onchange="updateCanvasSize()">
                <option value="400" ${state.canvasSize === 400 ? 'selected' : ''}>400x400</option>
                <option value="500" ${state.canvasSize === 500 ? 'selected' : ''}>500x500</option>
                <option value="600" ${(!state.canvasSize || state.canvasSize === 600) ? 'selected' : ''}>600x600</option>
                <option value="800" ${state.canvasSize === 800 ? 'selected' : ''}>800x800</option>
                <option value="1000" ${state.canvasSize === 1000 ? 'selected' : ''}>1000x1000</option>
                <option value="1200" ${state.canvasSize === 1200 ? 'selected' : ''}>1200x1200</option>
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

async function drawStitchToCanvas(canvas, stitch, color = '#333', size = 20) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Check if we have an SVG file for this stitch
    const svgFile = stitchSvgFiles[stitch];
    
    // Import SVG cache from canvas.js
    // We need to access the SVG image cache
    if (svgFile) {
        try {
            // Dynamically import to get access to SVG cache
            const { getSvgImageFromCache } = await import('./canvas.js');
            const img = getSvgImageFromCache(svgFile);
            
            if (img && img.complete) {
                // SVG viewBox dimensions from files
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
                
                // Scale to fit the palette size
                const drawHeight = size * 1.2;
                const drawWidth = drawHeight * aspectRatio;
                
                // Apply color filter if needed
                if (color !== '#000000' && color !== '#2C2E35' && color !== '#333' && color !== '#ffffff') {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = viewBox.width;
                    tempCanvas.height = viewBox.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                    
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
        } catch (error) {
            console.warn('Failed to load SVG for palette:', stitch, error);
            // Fall through to default rendering
        }
    }
    
    // Fallback: Draw using Canvas API or text symbol
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    const scale = size / 22;
    
    // For custom stitches, use text symbol
    if (stitch && stitch.startsWith('custom-')) {
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = getStitchSymbol(stitch);
        if (symbol && symbol !== '?') {
            ctx.fillText(symbol, 0, 0);
        } else {
            ctx.fillText('?', 0, 0);
        }
    } else {
        // Simplified version for standard stitches (fallback)
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = getStitchSymbol(stitch);
        if (symbol && symbol !== '?') {
            ctx.fillText(symbol, 0, 0);
        } else {
            ctx.fillText('?', 0, 0);
        }
    }
    
    ctx.restore();
}

export async function updateStitchPalette() {
    const palette = document.getElementById('stitchPalette');
    if (!palette) return;
    
    palette.innerHTML = '';
    
    const isDark = document.body.classList.contains('dark-mode');
    const symbolColor = isDark ? '#e0e0e0' : '#333';
    
    // Get all stitch symbols (including custom)
    const allStitchSymbols = getAllStitchSymbols();
    const allStitchNames = getAllStitchNames();
    
    // Standard stitches - use for...of to properly await async operations
    for (const stitchId of Object.keys(stitchSymbols)) {
        const item = document.createElement('div');
        const isActive = stitchId === state.currentStitch;
        item.className = 'stitch-palette-item' + (isActive ? ' active' : '');
        item.title = stitchNames[stitchId];
        
        // Create a small canvas for the symbol
        const symbolCanvas = document.createElement('canvas');
        symbolCanvas.width = 40;
        symbolCanvas.height = 40;
        const color = isActive ? '#ffffff' : symbolColor;
        
        // Draw stitch symbol (will use SVG if available)
        await drawStitchToCanvas(symbolCanvas, stitchId, color, 18);
        
        item.appendChild(symbolCanvas);
        item.onclick = () => {
            setCurrentStitch(stitchId);
            updateStitchPalette();
            updateProperties();
        };
        palette.appendChild(item);
    }
    
    // Custom stitches section
    const customStitches = getAllCustomStitches();
    if (customStitches.length > 0) {
        // Add separator
        const separator = document.createElement('div');
        separator.style.width = '100%';
        separator.style.height = '1px';
        separator.style.backgroundColor = '#ddd';
        separator.style.margin = '10px 0';
        palette.appendChild(separator);
        
        // Add "Custom" label
        const customLabel = document.createElement('div');
        customLabel.style.padding = '5px 0';
        customLabel.style.fontSize = '12px';
        customLabel.style.fontWeight = '600';
        customLabel.style.color = '#666';
        customLabel.textContent = 'Custom';
        palette.appendChild(customLabel);
        
        // Add custom stitches - use for...of to properly await async operations
        for (const customStitch of customStitches) {
            const item = document.createElement('div');
            const isActive = customStitch.id === state.currentStitch;
            item.className = 'stitch-palette-item' + (isActive ? ' active' : '');
            item.title = customStitch.name;
            
            // Create a small canvas for the symbol
            const symbolCanvas = document.createElement('canvas');
            symbolCanvas.width = 40;
            symbolCanvas.height = 40;
            const color = isActive ? '#ffffff' : symbolColor;
            
            // Draw custom stitch symbol using the same function
            await drawStitchToCanvas(symbolCanvas, customStitch.id, color, 18);
            
            item.appendChild(symbolCanvas);
            item.onclick = () => {
                setCurrentStitch(customStitch.id);
                updateStitchPalette();
                updateProperties();
            };
            
            // Add right-click context menu for editing/deleting
            item.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Kas soovid muuta või kustutada "${customStitch.name}"?`)) {
                    showCustomStitchModal(customStitch.id);
                }
            };
            
            palette.appendChild(item);
        }
    }
    
    // Add "+ Lisa custom piste" button
    const addButton = document.createElement('div');
    addButton.style.marginTop = '10px';
    addButton.style.padding = '8px';
    addButton.style.textAlign = 'center';
    addButton.style.cursor = 'pointer';
    addButton.style.border = '1px dashed #6B8CAE';
    addButton.style.borderRadius = '4px';
    addButton.style.color = '#6B8CAE';
    addButton.style.fontSize = '12px';
    addButton.style.fontWeight = '500';
    addButton.textContent = '+ Lisa custom piste';
    addButton.onclick = () => showCustomStitchModal();
    addButton.onmouseover = () => {
        addButton.style.backgroundColor = '#f0f4f8';
    };
    addButton.onmouseout = () => {
        addButton.style.backgroundColor = 'transparent';
    };
    palette.appendChild(addButton);
    
    // Also update drawer if open
    updateDrawerContent();
}

export function updateAlignmentButtons() {
    if (typeof window.updateAlignmentButtons === 'function') {
        window.updateAlignmentButtons();
    }
}

export function updateRoundsList() {
    // Also update drawer if open
    updateDrawerContent();
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
    if (prop) prop.textContent = getStitchName(state.currentStitch);
    
    // Also update drawer if open
    updateDrawerContent();
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

export function updateCanvasSize() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    const newSize = parseInt(document.getElementById('propCanvasSize').value);
    state.canvasSize = newSize;
    
    // Update canvas dimensions
    canvas.width = newSize;
    canvas.height = newSize;
    
    // Redraw everything
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
        customStitches: state.customStitches,
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
                const size = data.size || 600;
                canvas.width = size;
                canvas.height = size;
                state.canvasSize = size;
                
                // Update canvas size dropdown
                const canvasSizeSelect = document.getElementById('propCanvasSize');
                if (canvasSizeSelect) {
                    canvasSizeSelect.value = size;
                }
                
                if (data.layers) {
                    state.layers = data.layers;
                    setCurrentLayerIndex(data.currentLayerIndex || 0);
                    state.nextLayerId = Math.max(...state.layers.map(l => l.id)) + 1;
                }
                
                // Load and merge custom stitches from project file
                if (data.customStitches && Array.isArray(data.customStitches)) {
                    mergeCustomStitches(data.customStitches);
                }
                
                state.suggestions = [];
                
                document.getElementById('propShape').value = state.currentShape;
                
                // Refresh UI to show custom stitches
                updateStitchPalette();
                
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

// ============================================
// CUSTOM STITCH MODAL FUNCTIONS
// ============================================

let customStitchModalState = {
    editingId: null
};

export function showCustomStitchModal(stitchId) {
    const modal = document.getElementById('customStitchModal');
    const title = document.getElementById('customStitchModalTitle');
    const nameInput = document.getElementById('customStitchName');
    const symbolInput = document.getElementById('customStitchSymbol');
    const symbolDropdown = document.getElementById('customStitchSymbolDropdown');
    const categorySelect = document.getElementById('customStitchCategory');
    const categoryNewInput = document.getElementById('customStitchCategoryNew');
    const deleteBtn = document.getElementById('customStitchDeleteBtn');
    
    if (!modal) return;
    
    // Reset form
    customStitchModalState.editingId = null;
    if (nameInput) nameInput.value = '';
    if (symbolInput) symbolInput.value = '';
    if (symbolDropdown) symbolDropdown.value = '';
    if (categorySelect) categorySelect.value = 'custom';
    if (categoryNewInput) {
        categoryNewInput.value = '';
        categoryNewInput.style.display = 'none';
    }
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    // If editing existing stitch
    if (stitchId) {
        const stitch = getCustomStitch(stitchId);
        if (stitch) {
            customStitchModalState.editingId = stitchId;
            if (title) title.textContent = '✏️ Muuda custom heegelpiste';
            if (nameInput) nameInput.value = stitch.name || '';
            if (symbolInput) symbolInput.value = stitch.symbol || '';
            if (categorySelect) {
                if (stitch.category && ['basic', 'decreases', 'clusters', 'post'].includes(stitch.category)) {
                    categorySelect.value = stitch.category;
                } else {
                    categorySelect.value = 'custom';
                    if (categoryNewInput && stitch.category) {
                        categoryNewInput.value = stitch.category;
                        categoryNewInput.style.display = 'block';
                    }
                }
            }
            if (deleteBtn) deleteBtn.style.display = 'block';
        }
    } else {
        if (title) title.textContent = '🎨 Loo custom heegelpiste';
    }
    
    updateCustomStitchPreview();
    modal.style.display = 'flex';
}

export function closeCustomStitchModal() {
    const modal = document.getElementById('customStitchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    customStitchModalState.editingId = null;
}

export function selectSymbolFromDropdown() {
    const dropdown = document.getElementById('customStitchSymbolDropdown');
    const symbolInput = document.getElementById('customStitchSymbol');
    
    if (dropdown && symbolInput && dropdown.value) {
        symbolInput.value = dropdown.value;
        updateCustomStitchPreview();
    }
}

export function handleCustomCategoryInput() {
    const categorySelect = document.getElementById('customStitchCategory');
    const categoryNewInput = document.getElementById('customStitchCategoryNew');
    
    if (categoryNewInput && categoryNewInput.value.trim()) {
        if (categorySelect) {
            categorySelect.value = 'custom';
            categorySelect.disabled = true;
        }
    } else {
        if (categorySelect) {
            categorySelect.disabled = false;
        }
    }
}

export function updateCustomStitchPreview() {
    const nameInput = document.getElementById('customStitchName');
    const symbolInput = document.getElementById('customStitchSymbol');
    const previewCanvas = document.getElementById('customStitchPreview');
    const previewText = document.getElementById('customStitchPreviewText');
    
    if (!previewCanvas) return;
    
    const name = nameInput ? nameInput.value.trim() : '';
    const symbol = symbolInput ? symbolInput.value.trim() : '';
    
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    if (symbol) {
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(symbol, previewCanvas.width / 2, previewCanvas.height / 2);
    }
    
    if (previewText) {
        previewText.textContent = name || symbol || 'Sisesta nimi ja sümbol';
    }
}

export function saveCustomStitch() {
    const nameInput = document.getElementById('customStitchName');
    const symbolInput = document.getElementById('customStitchSymbol');
    const categorySelect = document.getElementById('customStitchCategory');
    const categoryNewInput = document.getElementById('customStitchCategoryNew');
    
    if (!nameInput || !symbolInput) return;
    
    const name = nameInput.value.trim();
    const symbol = symbolInput.value.trim();
    
    // Validation
    if (!name) {
        alert('Palun sisesta piste nimi!');
        nameInput.focus();
        return;
    }
    
    if (!symbol) {
        alert('Palun sisesta või vali piste sümbol!');
        symbolInput.focus();
        return;
    }
    
    // Determine category
    let category = 'custom';
    if (categoryNewInput && categoryNewInput.value.trim()) {
        category = categoryNewInput.value.trim();
    } else if (categorySelect && categorySelect.value) {
        category = categorySelect.value;
    }
    
    try {
        const stitchData = {
            name: name,
            symbol: symbol,
            category: category
        };
        
        if (customStitchModalState.editingId) {
            // Update existing
            updateCustomStitch(customStitchModalState.editingId, stitchData);
        } else {
            // Add new
            addCustomStitch(stitchData);
        }
        
        // Refresh UI
        updateStitchPalette();
        updateProperties();
        closeCustomStitchModal();
    } catch (error) {
        alert('Viga: ' + error.message);
    }
}

export function deleteCustomStitchFromModal() {
    if (!customStitchModalState.editingId) return;
    
    if (!confirm('Kas oled kindel, et soovid selle custom piste kustutada?\n\nSee toiming on pöördumatu!')) {
        return;
    }
    
    if (deleteCustomStitch(customStitchModalState.editingId)) {
        // If deleted stitch was selected, switch to default
        if (state.currentStitch === customStitchModalState.editingId) {
            setCurrentStitch('chain');
            updateProperties();
        }
        
        // Refresh UI
        updateStitchPalette();
        closeCustomStitchModal();
    }
}

