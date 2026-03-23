export class Nucleus {
    constructor(canvasSelector, options = {}) {
        this.canvas = document.querySelector(canvasSelector);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, lastX: 0, lastY: 0 };
        
        // Configurable Props
        this.fusionRadius = 50;
        this.canvasColor = "#020617";
        this.fontSize = 12;
        this.chartTitle = "Nucleus Dataset";
        this.xAxisName = "X-Axis";
        this.yAxisName = "Y-Axis";
        this.categoryColors = options.categoryColors || { 'Default': '#818cf8' };
        
        this._initListeners();
    }

    _initListeners() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
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

        data.forEach(p => {
            const isHovered = Math.sqrt(Math.pow(this.mouse.worldX - p.x, 2) + Math.pow(this.mouse.worldY - p.y, 2)) < (15 / this.camera.zoom);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 6/this.camera.zoom, 0, Math.PI*2);
            this.ctx.fillStyle = isHovered ? "#fff" : (this.categoryColors[p.category] || "#818cf8");
            this.ctx.fill();
            
            this.ctx.fillStyle = this.canvasColor === "#ffffff" ? "#000" : "#fff";
            this.ctx.font = `${this.fontSize/this.camera.zoom}px sans-serif`;
            this.ctx.fillText(p.label, p.x + 10/this.camera.zoom, p.y);
        });

        this.ctx.restore();
        this._drawStaticOverlays();
        requestAnimationFrame(() => this.render(data));
    }

    _drawDynamicGrid() {
        // Logic: Decide step size based on zoom
        let baseStep = 100;
        if (this.camera.zoom > 2) baseStep = 20;
        if (this.camera.zoom > 5) baseStep = 10;
        if (this.camera.zoom > 15) baseStep = 2;

        const isDark = this.canvasColor !== "#ffffff";
        this.ctx.lineWidth = 0.5 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
        
        this.ctx.beginPath();
        const startX = Math.floor((this.camera.x - 2000/this.camera.zoom) / baseStep) * baseStep;
        const endX = startX + 4000/this.camera.zoom;
        for (let x = startX; x <= endX; x += baseStep) {
            this.ctx.moveTo(x, this.camera.y - 2000/this.camera.zoom);
            this.ctx.lineTo(x, this.camera.y + 2000/this.camera.zoom);
        }
        this.ctx.stroke();

        // Origin Axes
        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        this.ctx.beginPath();
        this.ctx.moveTo(-10000, 0); this.ctx.lineTo(10000, 0);
        this.ctx.moveTo(0, -10000); this.ctx.lineTo(0, 10000);
        this.ctx.stroke();

        // Labels
        this.ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
        this.ctx.font = `${10/this.camera.zoom}px monospace`;
        for (let x = startX; x <= endX; x += baseStep) {
            this.ctx.fillText(x, x + 2/this.camera.zoom, 12/this.camera.zoom);
        }
    }

    _drawStaticOverlays() {
        const isDark = this.canvasColor !== "#ffffff";
        this.ctx.fillStyle = isDark ? "#fff" : "#000";
        this.ctx.textAlign = "center";
        
        // Chart Title
        this.ctx.font = "bold 18px Inter";
        this.ctx.fillText(this.chartTitle, this.canvas.width/2, 40);

        // Axis Names
        this.ctx.font = "12px Inter";
        this.ctx.fillText(this.xAxisName, this.canvas.width/2, this.canvas.height - 20);
        
        this.ctx.save();
        this.ctx.translate(20, this.canvas.height/2);
        this.ctx.rotate(-Math.PI/2);
        this.ctx.fillText(this.yAxisName, 0, 0);
        this.ctx.restore();
    }
}
