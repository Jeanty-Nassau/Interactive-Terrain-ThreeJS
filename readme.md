# Displacement Field

An interactive radar-like signal terrain built from animated displacement, contour bands, scanning energy, and direct pointer input.

Originally explored in 2022 and rebuilt in 2026 as one of three focused creative studies.

## Interaction
- Move the pointer to tilt and shift the field
- Click or tap anywhere on the canvas to emit an expanding pulse
- Use the on-screen control to trigger a centred pulse

## Techniques
- custom GLSL vertex displacement
- contour and grid shading
- animated scan band
- pointer-driven surface response
- click-triggered expanding pulse
- additive wireframe layer

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```
