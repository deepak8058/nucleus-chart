export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, lastX: 0, lastY: 0 };
        
        // Configuration
        this.fusionRadius = 50; 
        this.spokeLength = 90;
        this.canvasColor = "#020617";
        this.fontSize = 12;
        this.chartTitle = "Nucleus Engine v5.0";
        this.categoryColors = options.categoryColors || { 'Tech': '#60a5fa', 'Finance': '#4ade80', 'Health': '#f87171' };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.targetZoom = Math.max(0.01, Math.min(this.camera.targetZoom * delta, 50));
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
                const dx = (e.clientX - this.mouse.lastX) / this.camera.zoom;
                const dy = (e.clientY - this.mouse.lastY) / this.camera.zoom;
                this.camera.x -= dx;
                this.camera.y -= dy;
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            }

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

        this._drawDynamicGrid();

        // FIXED: Clustering now correctly identifies overlaps for Spokes
        const clusters = this._clusterData(data);

        clusters.forEach(cluster => {
            const n = cluster.points.length;
            const dist = Math.sqrt(Math.pow(this.mouse.worldX - cluster.x, 2) + Math.pow(this.mouse.worldY - cluster.y, 2));
            const isHovered = dist < (20 / this.camera.zoom);

            if (n > 1) {
                cluster.points.forEach((p, i) => {
                    const angle = (i * 2 * Math.PI) / n;
                    const endX = cluster.x + (this.spokeLength / this.camera.zoom) * Math.cos(angle);
                    const endY = cluster.y + (this.spokeLength / this.camera.zoom) * Math.sin(angle);
                    const pColor = this.categoryColors[p.category] || "#818cf8";

                    this.ctx.beginPath();
                    this.ctx.moveTo(cluster.x, cluster.y);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.strokeStyle = pColor;
                    this.ctx.lineWidth = 1.5 / this.camera.zoom;
                    this.ctx.stroke();

                    this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
                    this.ctx.font = `${this.fontSize / this.camera.zoom}px sans-serif`;
                    this.ctx.fillText(p.label, endX + 5/this.camera.zoom, endY);
                });
            } else {
                // Single Point Label
                const p = cluster.points[0];
                this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
                this.ctx.font = `${this.fontSize / this.camera.zoom}px sans-serif`;
                this.ctx.fillText(p.label, p.x + 10/this.camera.zoom, p.y);
            }

            this.ctx.beginPath();
            this.ctx.arc(cluster.x, cluster.y, (8 + n)/this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? "#ffffff" : (this.categoryColors[cluster.points[0].category] || "#818cf8");
            this.ctx.fill();
        });

        this.ctx.restore();
        this._drawStaticOverlays();
        requestAnimationFrame(() => this.render(data));
    }

    _drawDynamicGrid() {
        let baseStep = 100;
        if (this.camera.zoom > 2) baseStep = 20;
        if (this.camera.zoom > 8) baseStep = 5;

        const isDark = this.canvasColor !== "#ffffff";
        this.ctx.lineWidth = 0.5 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        
        const startX = Math.floor((this.camera.x - 2000/this.camera.zoom) / baseStep) * baseStep;
        const endX = startX + 4000/this.camera.zoom;
        const startY = Math.floor((this.camera.y - 2000/this.camera.zoom) / baseStep) * baseStep;
        const endY = startY + 4000/this.camera.zoom;

        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += baseStep) { this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); }
        for (let y = startY; y <= endY; y += baseStep) { this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); }
        this.ctx.stroke();

        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        this.ctx.beginPath();
        this.ctx.moveTo(-10000, 0); this.ctx.lineTo(10000, 0);
        this.ctx.moveTo(0, -10000); this.ctx.lineTo(0, 10000);
        this.ctx.stroke();
    }

    _drawStaticOverlays() {
        const isDark = this.canvasColor !== "#ffffff";
        this.ctx.fillStyle = isDark ? "#fff" : "#000";
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 20px Inter";
        this.ctx.fillText(this.chartTitle, this.canvas.width/2 + 160, 50);
    }

    _clusterData(data) {
        const clusters = [];
        // CRITICAL FIX: The radius for spokes must be constant in world space 
        // to ensure overlapping dots always trigger a nucleus.
        const clusterThreshold = 5; 

        data.forEach(point => {
            let assigned = false;
            for (let cluster of clusters) {
                const dist = Math.sqrt(Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2));
                if (dist < clusterThreshold) { 
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
