use wasm_bindgen::prelude::*;

pub const WIDTH: u32 = 32;
pub const HEIGHT: u32 = 32;
const MAX_DEPTH: usize = 30;
const EMPTY_COLOR: u32 = 0xFFFFFFFF; // opaque white (RRGGBBAA)

struct History {
    undo_stack: Vec<Vec<u32>>,
    redo_stack: Vec<Vec<u32>>,
    max_depth: usize,
}

impl History {
    fn new(max_depth: usize) -> Self {
        History {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_depth,
        }
    }

    fn push(&mut self, snapshot: Vec<u32>) {
        self.undo_stack.push(snapshot);
        if self.undo_stack.len() > self.max_depth {
            self.undo_stack.remove(0);
        }
    }
}

#[wasm_bindgen]
pub struct Grid {
    width: u32,
    height: u32,
    pixels: Vec<u32>,
    history: History,
}

#[wasm_bindgen]
impl Grid {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Grid {
            width: WIDTH,
            height: HEIGHT,
            pixels: vec![EMPTY_COLOR; (WIDTH * HEIGHT) as usize],
            history: History::new(MAX_DEPTH),
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn pixels_len(&self) -> usize {
        self.pixels.len()
    }

    /// Zero-copy live view of the pixel buffer (one u32 per cell, RRGGBBAA).
    /// The grid's own mutations are all in place (this Vec is never
    /// reassigned, reallocated, or resized), but stroke snapshots churn the
    /// Wasm heap, so the linear memory CAN grow — detaching every view
    /// returned before the growth. Callers must re-fetch this view when its
    /// `byteLength` becomes 0.
    pub fn pixels_view(&self) -> js_sys::Uint32Array {
        // SAFETY: self.pixels is a fixed-length Vec (1024 elements) that is
        // only ever mutated in place — never reallocated or resized — and
        // this workload never grows the Wasm linear memory, so the view
        // cannot detach or dangle.
        unsafe { js_sys::Uint32Array::view(&self.pixels) }
    }

    pub fn set_pixel(&mut self, x: i32, y: i32, color: u32) {
        if self.in_bounds(x, y) {
            let idx = self.index(x, y);
            self.pixels[idx] = color;
        }
    }

    pub fn get_pixel(&self, x: i32, y: i32) -> Option<u32> {
        if self.in_bounds(x, y) {
            Some(self.pixels[self.index(x, y)])
        } else {
            None
        }
    }

    pub fn begin_stroke(&mut self) {
        self.history.push(self.pixels.clone());
        self.history.redo_stack.clear();
    }

    pub fn end_stroke(&mut self) {
        // A stroke that changed nothing (e.g. erasing an already-blank
        // cell) must not occupy an undo slot.
        if self.history.undo_stack.last() == Some(&self.pixels) {
            self.history.undo_stack.pop();
        }
    }

    pub fn undo(&mut self) -> bool {
        if let Some(snapshot) = self.history.undo_stack.pop() {
            self.history.redo_stack.push(self.pixels.clone());
            // In-place copy: reassigning self.pixels would free the buffer
            // that JS views (see pixels_view) point into.
            self.pixels.copy_from_slice(&snapshot);
            true
        } else {
            false
        }
    }

    pub fn redo(&mut self) -> bool {
        if let Some(snapshot) = self.history.redo_stack.pop() {
            self.history.push(self.pixels.clone());
            self.pixels.copy_from_slice(&snapshot);
            true
        } else {
            false
        }
    }

    pub fn can_undo(&self) -> bool {
        !self.history.undo_stack.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.history.redo_stack.is_empty()
    }

    pub fn clear(&mut self) {
        self.pixels.fill(EMPTY_COLOR);
    }

    pub fn flood_fill(&mut self, x: i32, y: i32, color: u32) {
        if !self.in_bounds(x, y) {
            return;
        }
        let target = self.pixels[self.index(x, y)];
        if target == color {
            return;
        }
        let mut stack = vec![(x, y)];
        while let Some((cx, cy)) = stack.pop() {
            if !self.in_bounds(cx, cy) {
                continue;
            }
            let idx = self.index(cx, cy);
            if self.pixels[idx] != target {
                continue;
            }
            self.pixels[idx] = color;
            stack.push((cx + 1, cy));
            stack.push((cx - 1, cy));
            stack.push((cx, cy + 1));
            stack.push((cx, cy - 1));
        }
    }

    fn in_bounds(&self, x: i32, y: i32) -> bool {
        x >= 0 && y >= 0 && (x as u32) < self.width && (y as u32) < self.height
    }

    fn index(&self, x: i32, y: i32) -> usize {
        (y as u32 * self.width + x as u32) as usize
    }
}

impl Default for Grid {
    fn default() -> Self {
        Self::new()
    }
}
