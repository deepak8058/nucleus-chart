export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        
        this.fusionRadius = 40; // Pixels on screen
        this.categoryColors = options.categoryColors || { default: '#818cf8' };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.targetZoom = Math.max(0.1, Math.min(this.camera.targetZoom * delta, 10));
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            
            // Reverse transform to find "World Coordinates"
            this.mouse.worldX = (this.mouse.x - this.canvas.width/2) / this.camera.zoom + this.camera.x + this.canvas.width/2;
            this.mouse.worldY = (this.mouse.y - this.canvas.height/2) / this.camera.zoom + this.camera.y + this.canvas.height/2;
        });
    }

    render(data) {
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this._drawGrid();

        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);

        // CLUSTERING FIX: Logic now accounts for zoom
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const distToMouse = Math.sqrt(Math.pow(this.mouse.worldX - cluster.x, 2) + Math.pow(this.mouse.worldY - cluster.y, 2));
            const isHovered = distToMouse < (this.fusionRadius / this.camera.zoom);

            // Draw Spokes
            if (n > 1 && this.camera.zoom > 0.5) {
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const len = 80 / this.camera.zoom;
                    const endX = cluster.x + len * Math.cos(angle);
                    const endY = cluster.y + len * Math.sin(angle);

                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = isHovered ? '#fff' : 'rgba(129, 140, 248, 0.4)';
                    this.ctx.stroke();

                    if (this.camera.zoom > 1 || isHovered) {
                        this.ctx.fillStyle = "#fff";
                        this.ctx.font = `${10/this.camera.zoom}px sans-serif`;
                        this.ctx.fillText(p.label, endX + 5, endY);
                    }
                });
            }

            // Draw Core
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, (5 + n)/this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? "#fff" : "#818cf8";
            this.ctx.fill();
        });

        this.ctx.restore();
        this._drawUI();
        requestAnimationFrame(() => this.render(data));
    }

    _drawGrid() {
        const step = 100 * this.camera.zoom;
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        this.ctx.lineWidth = 1;

        for (let x = (this.canvas.width/2) % step; x < this.canvas.width; x += step) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = (this.canvas.height/2) % step; y < this.canvas.height; y += step) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }
    }

    _drawUI() {
        // Crosshair Tooltip
        this.ctx.strokeStyle = "rgba(255,255,255,0.2)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x, 0); this.ctx.lineTo(this.mouse.x, this.canvas.height);
        this.ctx.moveTo(0, this.mouse.y); this.ctx.lineTo(this.canvas.width, this.mouse.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = "#818cf8";
        this.ctx.font = "10px monospace";
        this.ctx.fillText(`X: ${Math.round(this.mouse.worldX)} Y: ${Math.round(this.mouse.worldY)}`, this.mouse.x + 10, this.mouse.y - 10);
    }

    _clusterData(data) {
        const clusters = [];
        // The "Secret Sauce": Divide radius by zoom so it feels consistent to the eye
        const dynamicRadius = this.fusionRadius / this.camera.zoom; 

        data.forEach(point => {
            let assigned = false;
            for (let cluster of clusters) {
                const dist = Math.sqrt(Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2));
                if (dist < dynamicRadius) {
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
