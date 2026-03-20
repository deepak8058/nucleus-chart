export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        if (!this.canvas) throw new Error(`Canvas element ${canvasSelector} not found.`);
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration Defaults
        this.fusionRadius = options.fusionRadius || 30;
        this.spokeLength = options.spokeLength || 70;
        this.hubColor = options.hubColor || '#6366f1';
        this.labelColor = options.labelColor || '#1e293b';
    }

    render(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            
            // Draw the Nucleus Hub
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, 6 + (n * 1.5), 0, Math.PI * 2);
            this.ctx.fillStyle = n > 1 ? this.hubColor : '#94a3b8';
            this.ctx.fill();

            if (n > 1) {
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const endX = cluster.x + this.spokeLength * Math.cos(angle);
                    const endY = cluster.y + this.spokeLength * Math.sin(angle);

                    // Draw Spoke Line
                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                    this.ctx.stroke();

                    // Draw Label with Smart Alignment
                    this.ctx.fillStyle = this.labelColor;
                    this.ctx.font = '12px sans-serif';
                    this.ctx.textAlign = endX > cluster.x ? 'left' : 'right';
                    this.ctx.fillText(p.label, endX + (endX > cluster.x ? 5 : -5), endY + 5);
                });
            } else {
                // Single point labeling
                this.ctx.fillStyle = this.labelColor;
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
