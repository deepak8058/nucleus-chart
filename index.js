export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, lastX: 0, lastY: 0 };
        
        // Dynamic Controls
        this.fusionRadius = 20; 
        this.spokeLength = 80;
        this.canvasColor = "#020617";
        this.fontSize = 12;
        this.chartTitle = "NUCLEUS SPATIAL ENGINE";
        
        this.categoryColors = options.categoryColors || { 
            'Tech': '#60a5fa', 'Finance': '#4ade80', 'Health': '#f87171', 'Default': '#818cf8' 
        };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.85 : 1.15;
            this.camera.targetZoom = Math.max(0.01, Math.min(this.camera.targetZoom * delta, 80));
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        });

        window.addEventListener('mouseup', () => this.mouse.isDown = false);

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;

            if (this.mouse.isDown) {
                this.camera.x -= (e.clientX - this.mouse.lastX) / this.camera.zoom;
                this.camera.y -= (e.clientY - this.mouse.lastY) / this.camera.zoom;
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            }

            this.mouse.worldX = (this.mouse.x - this.canvas.width/2) / this.camera.zoom + this.camera.x;
            this.mouse.worldY = (this.mouse.y - this.canvas.height/2) / this.camera.zoom + this.camera.y;
        });
    }

    render(data) {
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.12;
        this.ctx.fillStyle = this.canvasColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this._drawGrid();

        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const pColor = this.categoryColors[cluster.points[0].category] || this.categoryColors['Default'];
            
            // Level of Detail: Only show spokes if zoomed in enough
            const showSpokes = this.camera.zoom > 0.4;

            if (n > 1 && showSpokes) {
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const endX = cluster.x + this.spokeLength * Math.cos(angle);
                    const endY = cluster.y + this.spokeLength * Math.sin(angle);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = this.categoryColors[p.category] || pColor;
                    this.ctx.lineWidth = 1.5 / this.camera.zoom;
                    this.ctx.stroke();

                    // Labels
                    this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
                    this.ctx.font = `${this.fontSize / this.camera.zoom}px sans-serif`;
                    this.ctx.fillText(p.label, endX + 5/this.camera.zoom, endY);
                });
            }

            // Draw Central Hub (Bubbles grow based on mass)
            const hubSize = (showSpokes ? (6 + n) : (12 + n * 2)) / this.camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, hubSize, 0, Math.PI * 2);
            this.ctx.fillStyle = pColor;
            this.ctx.fill();
            
            // Glow Effect
            this.ctx.shadowBlur = showSpokes ? 0 : 15;
            this.ctx.shadowColor = pColor;
            this.ctx.strokeStyle = "#fff";
            this.ctx.lineWidth = 1/this.camera.zoom;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
        this._drawStaticUI();
        requestAnimationFrame(() => this.render(data));
    }

    _drawGrid() {
        const isDark = this.canvasColor !== "#ffffff";
        let step = 100;
        if (this.camera.zoom > 2) step = 50;
        if (this.camera.zoom > 10) step = 10;

        this.ctx.lineWidth = 0.5 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
        
        // Semantic Scaling Grid
        const startX = Math.floor((this.camera.x - 2000/this.camera.zoom) / step) * step;
        const endX = startX + 4000/this.camera.zoom;
        const startY = Math.floor((this.camera.y - 2000/this.camera.zoom) / step) * step;
        const endY = startY + 4000/this.camera.zoom;

        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += step) {
            this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += step) {
            this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();

        // Axis Labels
        this.ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
        this.ctx.font = `${10/this.camera.zoom}px monospace`;
        for (let x = startX; x <= endX; x += step) this.ctx.fillText(x, x + 2/this.camera.zoom, 12/this.camera.zoom);
        for (let y = startY; y <= endY; y += step) this.ctx.fillText(-y, 5/this.camera.zoom, y - 2/this.camera.zoom);
    }

    _drawStaticUI() {
        const isDark = this.canvasColor !== "#ffffff";
        this.ctx.fillStyle = isDark ? "#fff" : "#000";
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 22px 'Inter', sans-serif";
        this.ctx.fillText(this.chartTitle.toUpperCase(), this.canvas.width/2 + 160, 50);
    }

    _clusterData(data) {
        const clusters = [];
        data.forEach(p => {
            // High-precision clustering in World Space
            let found = clusters.find(c => Math.sqrt((c.x-p.x)**2 + (c.y-p.y)**2) < this.fusionRadius);
            if (found) found.points.push(p);
            else clusters.push({ x: p.x, y: p.y, points: [p] });
        });
        return clusters;
    }
}
