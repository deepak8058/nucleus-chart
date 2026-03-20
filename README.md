# 🧬 Nucleus Chart

A deterministic radial-labeling engine for handling perfect data overlaps and "label soup" in scatter plots.

**Stop the Label Soup.** The Nucleus Chart is a new visualization primitive designed specifically for high-density datasets where traditional labeling fails.

---

## 🔴 The Problem: "The Black Hole"
In traditional scatter plots, 100 points at the same $(x, y)$ coordinate look like a single dot. Their labels overlap into an unreadable "black hole" of ink. 

Current solutions like **Jittering** (adding random noise) are imprecise and technically "lie" about the data's true position to create space.

## 🔵 The Solution: The Nucleus Logic
The **Nucleus Chart** maintains data integrity by keeping the coordinates exact but using a deterministic radial-distribution algorithm for the metadata:

1.  **Fuse:** Points within a specific pixel radius merge into a single **Nucleus Hub**.
2.  **Project:** Labels are projected outward along **Symmetrical Spokes**.
3.  **Preserve:** The hub stays at the exact $(x, y)$ location, while the labels rotate to the nearest available space.

---

## 🚀 Quick Start

### Installation
```bash
npm install nucleus-chart

---

## 🚀 Basic Usage (Vanilla JS)
```bash
import { Nucleus } from 'nucleus-chart';

const data = [
  { x: 150, y: 150, label: "User Alpha" },
  { x: 150, y: 150, label: "User Beta" },  // Exact overlap
  { x: 150, y: 150, label: "User Gamma" }, // Exact overlap
  { x: 400, y: 100, label: "Isolated Node" }
];

const chart = new Nucleus('#my-canvas', {
  fusionRadius: 30,
  spokeLength: 70
});

chart.render(data);
🛠 Features
Deterministic Positioning: No Math.random(). Labels always land in the same spot, ensuring your reports look consistent every time.

Collision Detection: Intelligent grouping based on a customizable pixel "Fusion Radius."

Dynamic Hub Scaling: The Nucleus Hub grows visually based on the number of points it contains.

Smart Anchor Flipping: Text automatically aligns left or right based on its angle to prevent overlaps.

🗺 Roadmap
[ ] D3.js Wrapper: Seamless integration with D3 patterns.

[ ] React Hooks: A useNucleus hook for reactive updates.

[ ] Inter-Nucleus Physics: Repulsion logic to prevent clusters from colliding.

[ ] Interactive Explosion: Animate spokes on hover.

📄 License
MIT © 2026 [Your Name]
