// ============================================
// PATTERN ANALYSIS & SYMMETRY - Mustri analüüs ja sümmeetria
// ============================================

import { state, getCurrentStitches } from './state.js';
import { getCenter, getDistanceFromCenter, getAngleFromCenter, redrawStitches } from './canvas.js';
import { updateAutoStatus } from './ui.js';

export function applySymmetry(x, y) {
    try {
        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
            throw new Error('Invalid coordinates for symmetry');
        }
        
        const center = getCenter();
        if (!center) {
            throw new Error('Could not get canvas center');
        }
        
        const points = [{x, y}];
        
        if (state.symmetryMode === 'mirror-h') {
            points.push({x, y: center.y * 2 - y});
        } else if (state.symmetryMode === 'mirror-v') {
            points.push({x: center.x * 2 - x, y});
        } else if (state.symmetryMode === 'mirror-both') {
            points.push({x, y: center.y * 2 - y});
            points.push({x: center.x * 2 - x, y});
            points.push({x: center.x * 2 - x, y: center.y * 2 - y});
        } else if (state.symmetryMode && state.symmetryMode.startsWith('radial-')) {
            const divisions = parseInt(state.symmetryMode.split('-')[1]);
            if (isNaN(divisions) || divisions < 2) {
                console.warn('Invalid radial divisions, defaulting to 4');
                return points;
            }
            
            const angle = Math.atan2(y - center.y, x - center.x);
            const radius = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
            
            for (let i = 1; i < divisions; i++) {
                const newAngle = angle + (Math.PI * 2 * i / divisions);
                points.push({
                    x: center.x + Math.cos(newAngle) * radius,
                    y: center.y + Math.sin(newAngle) * radius
                });
            }
        }
        
        return points;
    } catch (error) {
        console.error('Error in applySymmetry:', error);
        // Return at least the original point
        return [{x, y}];
    }
}

export function analyzePattern() {
    try {
        const stitches = getCurrentStitches();
        
        if (!stitches || !Array.isArray(stitches)) {
            console.warn('Invalid stitches array in analyzePattern');
            state.suggestions = [];
            updateAutoStatus();
            return;
        }
        
        if (!state.autoContinueEnabled || stitches.length < 3) {
            state.suggestions = [];
            updateAutoStatus();
            return;
        }

    const center = getCenter();
    const radiusGroups = {};
    const tolerance = 15;
    
    stitches.forEach(stitch => {
        const radius = getDistanceFromCenter(stitch.x, stitch.y);
        let found = false;
        
        for (let r in radiusGroups) {
            if (Math.abs(radius - r) < tolerance) {
                radiusGroups[r].push(stitch);
                found = true;
                break;
            }
        }
        
        if (!found) {
            radiusGroups[radius] = [stitch];
        }
    });

    state.suggestions = [];
    for (let radius in radiusGroups) {
        const group = radiusGroups[radius];
        
        if (group.length >= 3) {
            const angles = group.map(s => getAngleFromCenter(s.x, s.y)).sort((a, b) => a - b);
            
            let totalDiff = 0;
            for (let i = 1; i < angles.length; i++) {
                totalDiff += angles[i] - angles[i-1];
            }
            const avgDiff = totalDiff / (angles.length - 1);
            
            const avgSize = group.reduce((sum, s) => sum + (s.size || 22), 0) / group.length;
            
            // Use current rotation setting instead of average from existing stitches
            // This ensures suggestions follow the user's rotation preference
            const suggestedRotation = state.currentRotation;
            
            const r = parseFloat(radius);
            let currentAngle = angles[angles.length - 1];
            const maxStitches = Math.floor((Math.PI * 2) / avgDiff);
            
            for (let i = 0; i < maxStitches - group.length; i++) {
                currentAngle += avgDiff;
                if (currentAngle > Math.PI * 2) break;
                
                const x = center.x + Math.cos(currentAngle) * r;
                const y = center.y + Math.sin(currentAngle) * r;
                
                let tooClose = false;
                for (let stitch of stitches) {
                    const dist = Math.sqrt(Math.pow(x - stitch.x, 2) + Math.pow(y - stitch.y, 2));
                    if (dist < 20) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    // Calculate rotation towards center (same logic as in handleDrawMode)
                    const angleFromCenter = Math.atan2(y - center.y, x - center.x);
                    const rotationTowardsCenter = (angleFromCenter * 180 / Math.PI) + 180 + state.currentRotation;
                    
                    state.suggestions.push({
                        x: x,
                        y: y,
                        stitch: group[0].stitch,
                        color: group[0].color,
                        size: avgSize,
                        rotation: rotationTowardsCenter, // Use calculated rotation with currentRotation
                        radius: r,
                        angle: currentAngle
                    });
                }
            }
            
            break;
        }
    }

        updateAutoStatus();
    } catch (error) {
        console.error('Error in analyzePattern:', error);
        state.suggestions = [];
        updateAutoStatus();
    }
}

export function toggleAutoContinue() {
    try {
        const checkbox = document.getElementById('autoContinue');
        if (!checkbox) {
            console.warn('Auto continue checkbox not found');
            return;
        }
        
        state.autoContinueEnabled = checkbox.checked;
        if (!state.autoContinueEnabled) {
            state.suggestions = [];
        } else {
            analyzePattern();
        }
        redrawStitches();
    } catch (error) {
        console.error('Error in toggleAutoContinue:', error);
        alert('Viga automaatse jätkamise seadistamisel: ' + error.message);
    }
}

