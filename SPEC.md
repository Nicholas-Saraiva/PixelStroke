# PixelForge: Product Requirements Document & Technical Specification

## 1. MVP Scope Definition

### Core Problem

Web creators, retro enthusiasts, and indie developers lack a lightning-fast, zero-friction, distraction-free environment to quickly draft 32x32 pixel art without the bloat, configuration overhead, or heavy footprint of enterprise desktop software.

### Target Audience

- Indie game developers prototyping 8-bit assets.
    
- Web developers and hobbyists building retro-themed web applications.
    
- Digital artists seeking a rapid ideation scratchpad.
    

### Minimum Features Required for Validation

- **Fixed 32x32 Grid:** Optimized single-layer canvas for classic retro asset constraints.
    
- **Core Toolset:** Pencil, Eraser, Flood Fill, and Eyedropper.
    
- **Color Management:** 16-color preset retro palette alongside a custom RGB color picker.
    
- **History Stack:** Robust undo/redo functionality (Ctrl+Z / Ctrl+Y) powered by a high-performance state stack.
    
- **Persistence & Export:** LocalStorage automatic project saving and crisp nearest-neighbor PNG export with resolution scaling (1x to 16x).
    
- **Aesthetic:** Dark, minimal, retro workspace UI.
    

### Strict "Out of Scope" (Anti-Scope / Feature Creep Blockers)

- Multi-layer support and transparency channels (v1 is strictly single-layer opaque).
    
- Animation frames, timelines, or sprite-sheet export.
    
- Custom canvas resizing or non-square dimensions.
    
- Backend database, user authentication, or cloud sync.
    
- Collaborative real-time multiplayer editing.
    

## 2. Development Phasing & Definition of Done

### Phase 1: Project Setup & Wasm Toolchain Integration

- **Milestone:** Establish the hybrid React + TypeScript + Rust compilation pipeline.
    
- **Definition of Done:**
    
    - Vite project configured with TypeScript and the Rust-Wasm plugin (`wasm-pack`).
        
    - A test function written in Rust successfully communicates a primitive value to the React UI.
        
    - Basic Tailwind CSS dark theme layout shell rendered on screen.
        

### Phase 2: Core Grid & State Engine (Rust + Wasm)

- **Milestone:** Implement the 32x32 pixel grid data structure and undo/redo history inside Rust.
    
- **Definition of Done:**
    
    - Rust struct representing a 32x32 pixel grid buffer (flat array of color indices/RGBA values).
        
    - Command pattern or snapshot history stack implemented in Rust for undo/redo actions.
        
    - Wasm bindings exposed for setting pixels, getting pixel data, and triggering undo/redo states.
        

### Phase 3: Canvas Rendering & Basic Tools (React + Canvas)

- **Milestone:** Build the HTML5 Canvas viewport and primary drawing tools (Pencil and Eraser).
    
- **Definition of Done:**
    
    - HTML5 Canvas configured with `image-rendering: pixelated` to guarantee crisp nearest-neighbor display.
        
    - Mouse/touch interaction translating coordinates directly to 32x32 grid indices.
        
    - Pencil and Eraser tools actively mutating the Rust Wasm state buffer in real time at 60 FPS.
        

### Phase 4: Advanced Tools & Color Management

- **Milestone:** Implement Flood Fill, Eyedropper, and the Color Palette system.
    
- **Definition of Done:**
    
    - High-performance flood-fill (bucket fill) algorithm executed in Rust.
        
    - Eyedropper tool extracting active color from any canvas coordinate.
        
    - UI panel featuring a 16-color preset retro palette and a custom hex/RGB color picker.
        

### Phase 5: Local Persistence & PNG Export

- **Milestone:** Implement LocalStorage autosave and nearest-neighbor PNG rendering export.
    
- **Definition of Done:**
    
    - Project state serialized and auto-saved to `localStorage` on every stroke modification, with load-on-startup.
        
    - Export utility generating scaled PNG images using nearest-neighbor scaling algorithms to prevent blurring.
        

### Phase 6: Retro UI Polish & UX Refinement

- **Milestone:** Finalize the dark minimal aesthetic, keyboard shortcuts, and UX feedback loops.
    
- **Definition of Done:**
    
    - Keyboard shortcuts operational (`Ctrl+Z`, `Ctrl+Y`, tool selection hotkeys).
        
    - Polished tooltips, active tool indicators, and responsive layout adjustments.
        
    - Zero console errors and clean build production bundle.
        

## 3. Tech Stack Recommendation

To maximize developer velocity, type safety, and raw performance for grid calculations, we utilize a hybrid client-side stack:

|**Layer**|**Technology**|**Rationale**|
|---|---|---|
|**Frontend Framework**|React 19 + TypeScript|Componentized UI architecture, robust type safety, and massive ecosystem of UI utilities.|
|**Performance Engine**|Rust (Compiled to WebAssembly via `wasm-pack`)|Lightning-fast execution for grid matrix manipulation, flood-fill algorithms, and history stacks.|
|**Rendering Layer**|HTML5 Canvas API (2D Context)|Direct pixel manipulation with disabled smoothing (`image-rendering: pixelated`) for crisp retro rendering.|
|**Persistence**|Browser LocalStorage API|Zero-infrastructure local persistence for autosaving project states instantly.|
|**Build Tooling**|Vite|Ultra-fast Hot Module Replacement (HMR) and streamlined Wasm integration plugins.|
|**Styling**|Tailwind CSS|Rapid utility-first styling tailored for clean, dark, minimal retro interfaces.|

## 4. Technical Specification

### High-Level System Architecture

```
+-------------------------------------------------------------+
|                      React UI Layer                         |
|  (Toolbar, Color Palette, Canvas Viewport, LocalStorage)    |
+------------------------------+------------------------------+
                               | JS/Wasm Boundary
                               v
+-------------------------------------------------------------+
|                   Rust Core Engine (Wasm)                   |
|  - 32x32 Pixel Grid Buffer (State Matrix)                   |
|  - Flood Fill Algorithm                                     |
|  - Command History Stack (Undo / Redo)                      |
|  - PNG Upscaling & Export Serializer                        |
+-------------------------------------------------------------+
```

### Core Database / State Schema

#### 1. Grid Buffer State (Rust Struct)

|**Field Name**|**Type**|**Description**|
|---|---|---|
|`width`|`u32`|Fixed canvas width (`32`)|
|`height`|`u32`|Fixed canvas height (`32`)|
|`pixels`|`Vec<u32>`|Flat vector of RGBA color values representing each cell|

#### 2. History State Stack

|**Field Name**|**Type**|**Description**|
|---|---|---|
|`undo_stack`|`Vec<Vec<u32>>`|Past grid snapshots for reverting actions|
|`redo_stack`|`Vec<Vec<u32>>`|Future snapshots for redoing reverted actions|
|`max_depth`|`usize`|Memory limit cap (e.g., 30 states)|

#### 3. LocalStorage Project Schema (`pixel_forge_project_v1`)

|**Key**|**Type**|**Description**|
|---|---|---|
|`version`|`string`|Schema version identifier (`"1.0"`)|
|`gridData`|`number[]`|Serialized array of pixel color integers|
|`palette`|`string[]`|Current custom active colors|
|`updatedAt`|`number`|Unix timestamp of last autosave|

### Primary User Flows

#### Flow A: Drawing a Pixel Stroke

1. **User Action:** User clicks and drags the mouse across canvas coordinates `(x, y)`.
    
2. **Event Handling:** React captures mouse movement events and dispatches coordinates to the wrapper hook.
    
3. **Wasm Execution:** Wasm function `set_pixel(x, y, color)` is invoked.
    
4. **State Mutation:** Rust updates the target index in the pixel vector and pushes the delta snapshot to the `undo_stack`.
    
5. **Render Cycle:** React triggers `requestAnimationFrame`, pulling the updated buffer from Wasm and drawing to the HTML5 Canvas context.
    

#### Flow B: Executing Undo / Redo

1. **User Action:** User presses `Ctrl+Z`.
    
2. **Wasm Execution:** Wasm method `undo()` pops the last state from `undo_stack` and pushes current state to `redo_stack`.
    
3. **UI Refresh:** React receives updated buffer pointer and re-renders the canvas instantly.
    

#### Flow C: Exporting Project as PNG

1. **User Action:** User clicks "Export PNG" and selects scaling factor (e.g., 8x / 256px).
    
2. **Wasm/JS Execution:** Rust/Canvas renders the 32x32 buffer onto an offscreen canvas scaled up via nearest-neighbor interpolation (`imageSmoothingEnabled = false`).
    
3. **File Generation:** Canvas outputs a data URL (`image/png`), triggering a programmatic browser download link for `pixelforge-art.png`.