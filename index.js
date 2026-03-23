export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        // Camera & Mouse
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, lastX: 0, lastY: 0 };
        
        // Settings
        this.fusionRadius = 10; // World units
        this.spokeLength = 80;  // World units
        this.canvasColor = "#020617";
        this.fontSize = 12;
        this.chartTitle = "NUCLEUS DATA VIEW";
        this.categoryColors = options.categoryColors || { 'Tech': '#60a5fa', 'Finance': '#4ade80', 'Health': '#f87171' };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.8 : 1.2;
            this.camera.targetZoom = Math.max(0.01, Math.min(this.camera.targetZoom * delta, 100));
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

            // High-precision World Coord Calculation
            this.mouse.worldX = (this.mouse.x - this.canvas.width/2) / this.camera.zoom + this.camera.x;
            this.mouse.worldY = (this.mouse.y - this.canvas.height/2) / this.camera.zoom + this.camera.y;
        });
    }

    render(data) {
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.15;
        this.ctx.fillStyle = this.canvasColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this._drawGrid();

        // 1. Cluster Data in World Space
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const pColor = this.categoryColors[cluster.points[0].category] || "#818cf8";

            // 2. Draw Spokes
            if (n > 1) {
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

                    this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
                    this.ctx.font = `${this.fontSize / this.camera.zoom}px sans-serif`;
                    this.ctx.fillText(p.label, endX + 5/this.camera.zoom, endY);
                });
            } else {
                this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
                this.ctx.font = `${this.fontSize / this.camera.zoom}px sans-serif`;
                this.ctx.fillText(cluster.points[0].label, cluster.x + 10/this.camera.zoom, cluster.y);
            }

            // 3. Draw Hub
            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, (8 + n)/this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = pColor;
            this.ctx.fill();
            this.ctx.strokeStyle = "#fff";
            this.ctx.lineWidth = 1/this.camera.zoom;
            this.ctx.stroke();
        });

        this.ctx.restore();
        this._drawStaticUI();
        requestAnimationFrame(() => this.render(data));
    }

    _drawGrid() {
        const isDark = this.canvasColor !== "#ffffff";
        let step = 100;
        if (this.camera.zoom > 2) step = 50;
        if (this.camera.zoom > 5) step = 10;

        this.ctx.lineWidth = 0.5 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        this.ctx.font = `${10/this.camera.zoom}px monospace`;
        this.ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

        const viewWidth = this.canvas.width / this.camera.zoom;
        const viewHeight = this.canvas.height / this.camera.zoom;
        const startX = Math.floor((this.camera.x - viewWidth) / step) * step;
        const endX = startX + viewWidth * 2;
        const startY = Math.floor((this.camera.y - viewHeight) / step) * step;
        const endY = startY + viewHeight * 2;

        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += step) {
            this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY);
            this.ctx.fillText(x, x + 2/this.camera.zoom, 12/this.camera.zoom);
        }
        for (let y = startY; y <= endY; y += step) {
            this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y);
            this.ctx.fillText(-y, 5/this.camera.zoom, y - 2/this.camera.zoom);
        }
        this.ctx.stroke();

        // Main Axes
        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        this.ctx.beginPath();
        this.ctx.moveTo(-10000, 0); this.ctx.lineTo(10000, 0);
        this.ctx.moveTo(0, -10000); this.ctx.lineTo(0, 10000);
        this.ctx.stroke();
    }

    _drawStaticUI() {
        this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
        this.ctx.font = "bold 20px Inter, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.chartTitle, this.canvas.width/2 + 160, 40);
    }

    _clusterData(data) {
        const clusters = [];
        data.forEach(p => {
            let found = clusters.find(c => Math.sqrt((c.x-p.x)**2 + (c.y-p.y)**2) < this.fusionRadius);
            if (found) found.points.push(p);
            else clusters.push({ x: p.x, y: p.y, points: [p] });
        });
        return clusters;
    }
}
