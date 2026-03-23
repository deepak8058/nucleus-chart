/**
 * Nucleus Chart Engine v2.0 - "Galactic Edition"
 */
export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        // Advanced Configuration
        this.fusionRadius = options.fusionRadius || 50;
        this.spokeLength = options.spokeLength || 80;
        this.rotationOffset = options.rotationOffset || 0;
        
        // Expert Styling
        this.categoryColors = options.categoryColors || { default: '#818cf8' };
        this.labelColor = options.labelColor || '#ffffff';
    }

    render(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            
            // 1. Draw "Event Horizon" (Glow for the Cluster)
            const gradient = this.ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, this.fusionRadius * 1.5);
            gradient.addColorStop(0, 'rgba(129, 140, 248, 0.1)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.arc(cluster.x, cluster.y, this.fusionRadius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Draw Categorical Spokes
            if (n > 1) {
                cluster.points.forEach((p, i) => {
                    const angle = ((i * 2 * Math.PI) / n) + (this.rotationOffset * Math.PI / 180);
                    const endX = cluster.x + this.spokeLength * Math.cos(angle);
                    const endY = cluster.y + this.spokeLength * Math.sin(angle);

                    // Get Data-Driven Attributes
                    const pColor = this.categoryColors[p.category] || this.categoryColors.default;
                    const pThickness = p.weight || 2; 

                    // Draw Spoke
                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.lineWidth = pThickness; 
                    this.ctx.strokeStyle = pColor;
                    this.ctx.lineCap = 'round';
                    this.ctx.stroke();

                    // Draw Label with matching color glow
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = pColor;
                    this.ctx.fillStyle = this.labelColor;
                    this.ctx.font = '11px "Inter", sans-serif';
                    this.ctx.textAlign = endX > cluster.x ? 'left' : 'right';
                    this.ctx.fillText(p.label.toUpperCase(), endX + (endX > cluster.x ? 12 : -12), endY + 4);
                    this.ctx.shadowBlur = 0; 
                });
            }

            // 3. Draw the Central Hub (The "Star")
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, 4 + (n * 1.2), 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff'; 
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#818cf8';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
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
