# 🧬 Nucleus Chart

A deterministic radial-labeling engine for handling perfect data overlaps and "label soup" in scatter plots.

**Stop the Label Soup.** The Nucleus Chart is a new visualization primitive designed specifically for high-density datasets and perfectly overlapping coordinates.

## 🔴 The Problem: "The Black Hole"
In traditional scatter plots, 100 points at the same $(x, y)$ coordinate look like one point. Their labels overlap into an unreadable "ink smudge." Developers usually solve this with *Jittering* (adding random noise), which technically lies about the data.

## 🔵 The Solution: The Nucleus Logic
The **Nucleus Chart** uses a deterministic radial-distribution algorithm. When points collide:
1.  **Fuse:** They merge into a single, glowing **Nucleus Hub**.
2.  **Project:** Labels are projected outward along **Symmetrical Spokes**.
3.  **Preserve:** Data integrity is maintained while legibility is guaranteed.

---

## 🚀 Quick Start

### Installation
```bash
npm install nucleus-chart

### Basic Usages

import { Nucleus } from 'nucleus-chart';

const data = [
  { x: 100, y: 100, label: "Point A" },
  { x: 100, y: 100, label: "Point B" }, // Exact overlap!
  { x: 102, y: 98,  label: "Point C" }  // Near collision
];

const chart = new Nucleus('#my-canvas', {
  fusionRadius: 30,
  spokeLength: 70
});

chart.render(data);
