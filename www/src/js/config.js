// ============================================
// CONFIGURATION - Konstandid ja stitch sümbolid
// ============================================

import { state, getAllCustomStitches } from './state.js';

export const stitchNames = {
    // Basic Stitches
    'chain': 'Ahelpistet (ch)',
    'slip': 'Kinnispistet (sl st)',
    'sc': 'Ühekordne pööret (sc)',
    'hdc': 'Poolkordne varras (hdc)',
    'dc': 'Topeltvarras (dc)',
    'tr': 'Kolmekordne varras (tr)',
    'dtr': 'Topelt kolmekordne (dtr)',
    
    // Decreases
    'sc2tog': 'Sc2tog',
    'sc3tog': 'Sc3tog',
    'dc2tog': 'Dc2tog',
    'dc3tog': 'Dc3tog',
    
    // Clusters & Special
    'cluster-3dc': '3-dc cluster',
    'cluster-3hdc': '3-hdc cluster/puff st/bobble',
    'popcorn-5dc': '5-dc popcorn',
    'shell-5dc': '5-dc shell',
    'picot-ch3': 'Ch-3 picot',
    
    // Post Stitches
    'fpdc': 'Front post dc (FPdc)',
    'bpdc': 'Back post dc (BPdc)',
    
    // Loop Modifiers
    'blo': 'Worked in back loop only',
    'flo': 'Worked in front loop only'
};

export const stitchSymbols = {
    // Basic Stitches - Standard crochet chart symbols
    'chain': '○',   // Horizontal oval
    'slip': '●',    // Solid circle
    'sc': '+',      // Plus sign (also supports X)
    'hdc': 'T',     // T shape
    'dc': '┴',      // T with one horizontal bar
    'tr': '┬',      // T with two horizontal bars
    'dtr': '┼',     // T with three horizontal bars
    
    // Decreases
    'sc2tog': '∧',  // Inverted V with bar and X at top
    'sc3tog': '∧',  // Inverted V with two bars and X at top
    'dc2tog': '∧',  // Inverted V with bar
    'dc3tog': '∧',  // Inverted V with two bars
    
    // Clusters & Special
    'cluster-3dc': '◉',   // Vertical oval with 3 lines
    'cluster-3hdc': '◐',  // Vertical oval with 1 line (puff/bobble)
    'popcorn-5dc': '◉',   // Vertical oval with 5 lines
    'shell-5dc': '⋏',     // Fan shape with 5 lines
    'picot-ch3': '◊',     // Circle with loop (ch-3 picot)
    
    // Post Stitches
    'fpdc': '┴',    // T with hook to right
    'bpdc': '┴',    // T with hook to left
    
    // Loop Modifiers
    'blo': '(',     // Open parenthesis (back loop only)
    'flo': ')'      // Close parenthesis (front loop only)
};

// Stitch categories for the chart modal
export const stitchCategories = {
    'basic': {
        name: 'Põhilised',
        stitches: ['chain', 'slip', 'sc', 'hdc', 'dc', 'tr', 'dtr']
    },
    'decreases': {
        name: 'Vähendused',
        stitches: ['sc2tog', 'sc3tog', 'dc2tog', 'dc3tog']
    },
    'clusters': {
        name: 'Kobarid ja eripisted',
        stitches: ['cluster-3dc', 'cluster-3hdc', 'popcorn-5dc', 'shell-5dc', 'picot-ch3']
    },
    'post': {
        name: 'Post pisted ja silmused',
        stitches: ['fpdc', 'bpdc', 'blo', 'flo']
    }
};

// SVG symbol file mapping - maps stitch IDs to Frame SVG files
export const stitchSvgFiles = {
    'chain': 'Frame 17.svg',
    'slip': 'Frame 18.svg',
    'sc': 'Frame 16.svg',
    'hdc': 'Frame 11.svg',
    'dc': 'Frame 14.svg',
    'tr': 'Frame 19.svg',
    'dtr': 'Frame 7.svg',
    'sc2tog': 'Frame 2.svg',
    'sc3tog': 'Frame 3.svg',
    'dc2tog': 'Frame 5.svg',
    'dc3tog': 'Frame 4.svg',
    'cluster-3dc': 'Frame 20.svg',
    'cluster-3hdc': 'Frame 20.svg', // Using same as 3dc for now
    'popcorn-5dc': 'Frame 20.svg', // Using same as 3dc for now
    'shell-5dc': 'Frame 8.svg',
    'picot-ch3': 'Frame 18.svg', // Using slip for now
    'fpdc': 'Frame 6.svg',
    'bpdc': 'Frame 9.svg',
    'blo': 'Frame 17.svg', // Using chain for now
    'flo': 'Frame 17.svg'  // Using chain for now
};

// Default values
export const DEFAULT_STITCH = 'chain';
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_SHAPE = 'circle';
export const DEFAULT_STITCH_SIZE = 22;
export const DEFAULT_ROTATION = 0;
export const DEFAULT_TOOL_MODE = 'draw';
export const DEFAULT_SYMMETRY_MODE = 'none';
export const DEFAULT_MIN_DISTANCE = 20;

// ============================================
// CUSTOM STITCHES INTEGRATION
// ============================================

export function isCustomStitch(stitchId) {
    if (!stitchId || typeof stitchId !== 'string') {
        return false;
    }
    return stitchId.startsWith('custom-');
}

export function getStitchName(stitchId) {
    if (!stitchId) {
        return '';
    }
    
    // Check custom stitches first
    if (isCustomStitch(stitchId)) {
        const customStitch = getAllCustomStitches().find(s => s.id === stitchId);
        if (customStitch) {
            return customStitch.name;
        }
    }
    
    // Check standard stitches
    return stitchNames[stitchId] || stitchId;
}

export function getStitchSymbol(stitchId) {
    if (!stitchId) {
        return '?';
    }
    
    // Check custom stitches first
    if (isCustomStitch(stitchId)) {
        const customStitch = getAllCustomStitches().find(s => s.id === stitchId);
        if (customStitch && customStitch.symbol) {
            return customStitch.symbol;
        }
    }
    
    // Check standard stitches
    return stitchSymbols[stitchId] || '?';
}

export function getAllStitches() {
    const standardStitches = Object.keys(stitchSymbols);
    const customStitches = getAllCustomStitches().map(s => s.id);
    return [...standardStitches, ...customStitches];
}

export function getStitchCategories() {
    const categories = { ...stitchCategories };
    
    // Add custom stitches category if there are any
    const customStitches = getAllCustomStitches();
    if (customStitches.length > 0) {
        // Group custom stitches by category
        const customByCategory = {};
        customStitches.forEach(stitch => {
            const category = stitch.category || 'custom';
            if (!customByCategory[category]) {
                customByCategory[category] = [];
            }
            customByCategory[category].push(stitch.id);
        });
        
        // Add each custom category
        Object.keys(customByCategory).forEach(categoryKey => {
            if (!categories[categoryKey]) {
                categories[categoryKey] = {
                    name: categoryKey === 'custom' ? 'Custom' : categoryKey,
                    stitches: []
                };
            }
            categories[categoryKey].stitches = [
                ...(categories[categoryKey].stitches || []),
                ...customByCategory[categoryKey]
            ];
        });
    }
    
    return categories;
}

export function getAllStitchSymbols() {
    const symbols = { ...stitchSymbols };
    
    // Add custom stitch symbols
    const customStitches = getAllCustomStitches();
    customStitches.forEach(stitch => {
        symbols[stitch.id] = stitch.symbol;
    });
    
    return symbols;
}

export function getAllStitchNames() {
    const names = { ...stitchNames };
    
    // Add custom stitch names
    const customStitches = getAllCustomStitches();
    customStitches.forEach(stitch => {
        names[stitch.id] = stitch.name;
    });
    
    return names;
}

