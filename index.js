export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        // Camera State (The "Universe" Controller)
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        
        // Configuration
        this.fusionRadius = options.fusionRadius || 50;
        this.spokeLength = options.spokeLength || 100;
        this.categoryColors = options.categoryColors || { default: '#818cf8' };
        
        this._initListeners();
    }

    _initListeners() {
        // Zoom logic (Mouse Wheel)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.targetZoom *= delta;
            this.camera.targetZoom = Math.max(0.2, Math.min(this.camera.targetZoom, 5));
        });
    }

    render(data) {
        // Smooth Interpolation for Zoom
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        // Apply Camera Transformation
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);

        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const isZoomedIn = this.camera.zoom > 0.8;
            const labelOpacity = Math.max(0, Math.min(1, (this.camera.zoom - 0.6) * 2));

            // 1. Draw Gravity Well (Nebula)
            const nebulaSize = this.fusionRadius * (1.5 / this.camera.zoom);
            const grad = this.ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, nebulaSize);
            grad.addColorStop(0, 'rgba(129, 140, 248, 0.2)');
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, nebulaSize, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Draw Spokes (Only if zoomed in enough)
            if (n > 1 && isZoomedIn) {
                this.ctx.globalAlpha = labelOpacity;
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const endX = cluster.x + this.spokeLength * Math.cos(angle);
                    const endY = cluster.y + this.spokeLength * Math.sin(angle);
                    const pColor = this.categoryColors[p.category] || this.categoryColors.default;

                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = pColor;
                    this.ctx.lineWidth = 1 / this.camera.zoom; // Keep lines crisp
                    this.ctx.stroke();

                    // Label
                    this.ctx.fillStyle = "#ffffff";
                    this.ctx.font = `${12 / this.camera.zoom}px "Inter", sans-serif`;
                    this.ctx.textAlign = endX > cluster.x ? 'left' : 'right';
                    this.ctx.fillText(p.label, endX + (endX > cluster.x ? 5 : -5), endY);
                });
                this.ctx.globalAlpha = 1;
            }

            // 3. Draw Core Star
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, (4 + n) / this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = "#ffffff";
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = "#818cf8";
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
        
        // Request next frame for smooth zoom animation
        requestAnimationFrame(() => this.render(data));
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
            if (!assigned) clusters.push({ x: point.x, y: point.y, points: [point] });
        });
        return clusters;
    }
}
