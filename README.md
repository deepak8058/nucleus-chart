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
```

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
