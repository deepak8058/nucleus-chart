/**
 * Nucleus Chart Engine
 * Logic for handling overplotting via deterministic radial projection.
 */
export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        if (!this.canvas) throw new Error(`Canvas element ${canvasSelector} not found.`);
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.fusionRadius = options.fusionRadius || 40;
        this.spokeLength = options.spokeLength || 80;
        this.accentColor = options.hubColor || '#818cf8'; // Primary color for hub/spokes
        this.labelColor = options.labelColor || '#ffffff'; // White labels for dark bg
    }

    render(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            
            // Draw the Nucleus Hub
            this.ctx.beginPath();
            // Hub gets larger with more mass
            const hubRadius = 6 + (n * 1.5);
            this.ctx.arc(cluster.x, cluster.y, hubRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = n > 1 ? this.accentColor : '#64748b'; // Gray for single points
            this.ctx.fill();

            // Symmetrical Spokes (Petals)
            if (n > 1) {
                // Adjust spoke length based on density
                const effectiveSpokeLength = this.spokeLength + (n * 3);
                
                cluster.points.forEach((p, i) => {
                    // Divide 360 degrees by number of points
                    const angle = (i * 2 * Math.PI) / n; 
                    const endX = cluster.x + effectiveSpokeLength * Math.cos(angle);
                    const endY = cluster.y + effectiveSpokeLength * Math.sin(angle);

                    // Draw the Spoke (Wheel Design)
                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.lineWidth = 1.5; // Thicker lines for 'spoke' look
                    this.ctx.strokeStyle = `rgba(129, 140, 248, 0.5)`; // Semi-transparent accent
                    this.ctx.lineCap = 'round'; // Smooth ends
                    this.ctx.stroke();

                    // Draw the Label
                    this.ctx.fillStyle = this.labelColor;
                    this.ctx.font = '12px "Inter", "Segoe UI", sans-serif';
                    // Smart text anchor logic
                    this.ctx.textAlign = endX > cluster.x ? 'left' : 'right';
                    this.ctx.fillText(p.label, endX + (endX > cluster.x ? 8 : -8), endY + 4);
                });
            } else {
                // Single point labeling
                this.ctx.fillStyle = this.labelColor;
                this.ctx.font = '12px "Inter", "Segoe UI", sans-serif';
                this.ctx.fillText(cluster.points[0].label, cluster.x + 10, cluster.y - 10);
            }
        });
    }

    _clusterData(data) {
        const clusters = [];
        data.forEach(point => {
            let assigned = false;
            for (let cluster of clusters) {
                const dist = Math.sqrt(Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2));
                if (dist < this.fusionRadius) {
                    cluster.points.push(point);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                clusters.push({ x: point.x, y: point.y, points: [point] });
            }
        });
        return clusters;
    }
}
