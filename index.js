export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        
        this.fusionRadius = 50; 
        this.spokeLength = 90;
        this.categoryColors = options.categoryColors || { 'Default': '#818cf8' };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.targetZoom = Math.max(0.05, Math.min(this.camera.targetZoom * delta, 20));
        }, { passive: false });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.worldX = (this.mouse.x - this.canvas.width/2) / this.camera.zoom + this.camera.x;
            this.mouse.worldY = (this.mouse.y - this.canvas.height/2) / this.camera.zoom + this.camera.y;
        });
    }

    render(data) {
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.15;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this._drawWorldHardware();

        const clusters = this._clusterData(data);
        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const isHovered = Math.sqrt(Math.pow(this.mouse.worldX - cluster.x, 2) + Math.pow(this.mouse.worldY - cluster.y, 2)) < (this.fusionRadius / this.camera.zoom);

            if (n > 1 && this.camera.zoom > 0.4) {
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const endX = cluster.x + this.spokeLength * Math.cos(angle);
                    const endY = cluster.y + this.spokeLength * Math.sin(angle);
                    const pColor = this.categoryColors[p.category] || this.categoryColors['Default'];

                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = pColor;
                    this.ctx.lineWidth = (p.weight || 2) / this.camera.zoom;
                    this.ctx.stroke();

                    if (this.camera.zoom > 0.8 || isHovered) {
                        this.ctx.fillStyle = "#fff";
                        this.ctx.font = `${12/this.camera.zoom}px sans-serif`;
                        this.ctx.fillText(p.label, endX + 10/this.camera.zoom, endY);
                    }
                });
            }

            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, (6 + n)/this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? "#fff" : "#818cf8";
            this.ctx.fill();
        });

        this.ctx.restore();
        this._drawHUD();
        requestAnimationFrame(() => this.render(data));
    }

    _drawWorldHardware() {
        const gridStep = 100;
        this.ctx.lineWidth = 1 / this.camera.zoom;
        
        // Grid
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        for (let x = -5000; x <= 5000; x += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(x, -5000); this.ctx.lineTo(x, 5000); this.ctx.stroke();
        }
        for (let y = -5000; y <= 5000; y += gridStep) {
            this.ctx.beginPath(); this.ctx.moveTo(-5000, y); this.ctx.lineTo(5000, y); this.ctx.stroke();
        }

        // Main Axes
        this.ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.beginPath(); this.ctx.moveTo(-5000, 0); this.ctx.lineTo(5000, 0); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.moveTo(0, -5000); this.ctx.lineTo(0, 5000); this.ctx.stroke();
    }

    _drawHUD() {
        this.ctx.strokeStyle = "rgba(255,255,255,0.2)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x, 0); this.ctx.lineTo(this.mouse.x, this.canvas.height);
        this.ctx.moveTo(0, this.mouse.y); this.ctx.lineTo(this.canvas.width, this.mouse.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    _clusterData(data) {
        const clusters = [];
        const dynamicRadius = this.fusionRadius / this.camera.zoom; 
        data.forEach(point => {
            let assigned = false;
            for (let cluster of clusters) {
                const dist = Math.sqrt(Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2));
                if (dist < dynamicRadius) { cluster.points.push(point); assigned = true; break; }
            }
            if (!assigned) clusters.push({ x: point.x, y: point.y, points: [point] });
        });
        return clusters;
    }
}
