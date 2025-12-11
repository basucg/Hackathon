# Hackathon

## Construction Site Package

This repository now includes both a 2D planning diagram and a lightweight 3D model that you can hand off to designers, superintendents, or visualization tools.

| Asset | Path | Notes |
| --- | --- | --- |
| Site diagram (Mermaid) | `docs/site-diagram.md` | Logical zoning for circulation, safety buffers, staging, and utilities. |
| Construction 3D model (OBJ) | `models/site-model.obj` | Simple geometry for ground plane, main building core, tower crane, material storage, and office. |

## Simple Home Package

| Asset | Path | Notes |
| --- | --- | --- |
| Home diagram (Mermaid) | `docs/home-diagram.md` | Single-story layout showing public, private, and service zones. |
| Home 3D model (OBJ) | `models/home-model.obj` | User-friendly grouped mesh with floor, walls, gable roof, garage, porch, windows, and interior partitions. |

## Viewing the Diagram

1. Open `docs/site-diagram.md` in any Mermaid-enabled Markdown preview (VS Code, GitHub, Obsidian, or <https://mermaid.live>).
2. Tweak node labels or subgraphs to match your project specifics.

## Viewing the 3D Model

1. Import `models/site-model.obj` into your tool of choice (Blender, SketchUp, Rhino, or any viewer that supports Wavefront OBJ).
2. Units are meters; relocate or scale components as needed:
   - `MainBuilding` approximates a 10 m × 10 m core rising 8 m.
   - `TowerCrane` mast is 15 m tall with a jib extending east.
   - `MaterialContainer` and `SiteOffice` sit along the western edge for logistics and admin needs.
3. Apply custom materials/textures inside your modeling software if desired.

## Customizing Tips

- Relocate vertices in the OBJ to match your true site coordinates. The file is organized by `o` groups so you can move entire elements quickly.
- Add more subgraphs or nodes to the Mermaid diagram when you introduce additional laydown areas, visitor parking, or temporary utilities.

## Viewing the Home Diagram

1. Open `docs/home-diagram.md` with a Mermaid previewer to see the zone layout.
2. Rename rooms or edges to mirror the wayfinding and adjacencies you need.

## Viewing the Home 3D Model

1. Import `models/home-model.obj` into Blender, SketchUp, Rhino, or any OBJ-compatible viewer.
2. Components are grouped (`FloorPlate`, `ExteriorWalls`, `Roof`, `Garage`, `Door`, `Windows`, `InteriorCore`) so you can toggle visibility or assign materials quickly.
3. Everything is modeled in meters: walls are 3 m tall, the roof ridge is 4.5 m, and the garage extends 4.5 m off the main volume.
4. Move or scale groups to match your actual footprint, or extrude additional rooms using the existing vertices as references.