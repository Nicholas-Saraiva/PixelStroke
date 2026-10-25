import init, { Grid } from '../../rust/pkg/pixelforge_engine.js'
import wasmUrl from '../../rust/pkg/pixelforge_engine_bg.wasm?url'

const GRID_SIZE = 32

let gridPromise: Promise<Grid> | null = null

export function getGrid(): Promise<Grid> {
  gridPromise ??= init(wasmUrl).then(() => new Grid())
  return gridPromise
}

/**
 * Paints the Rust pixel buffer onto a display canvas. The buffer is u32
 * RRGGBBAA (little-endian bytes AA BB GG RR), so each value is swizzled to
 * the AABBGGRR order Canvas ImageData expects. 32x32 ImageData goes to an
 * offscreen canvas, then drawImage scales it up with smoothing disabled.
 */
export class Renderer {
  private readonly grid: Grid
  private view: Uint32Array
  private readonly offscreen: HTMLCanvasElement
  private readonly offCtx: CanvasRenderingContext2D
  private readonly imageData: ImageData
  private readonly buf32: Uint32Array

  constructor(grid: Grid) {
    this.grid = grid
    this.view = grid.pixels_view()
    this.offscreen = document.createElement('canvas')
    this.offscreen.width = GRID_SIZE
    this.offscreen.height = GRID_SIZE
    this.offCtx = this.offscreen.getContext('2d')!
    this.imageData = this.offCtx.createImageData(GRID_SIZE, GRID_SIZE)
    this.buf32 = new Uint32Array(this.imageData.data.buffer)
  }

  render(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    // Stroke snapshots allocate on the Wasm heap, so the linear memory
    // eventually grows — which detaches every view taken before it.
    // Rebind to the current buffer when that happens (~15 strokes).
    if (this.view.byteLength === 0) {
      this.view = this.grid.pixels_view()
    }
    const src = this.view
    const dst = this.buf32
    for (let i = 0; i < src.length; i++) {
      const c = src[i]
      dst[i] = ((c & 0xff) << 24) | ((c & 0xff00) << 8) | ((c >>> 8) & 0xff00) | (c >>> 24)
    }
    this.offCtx.putImageData(this.imageData, 0, 0)
    ctx.drawImage(this.offscreen, 0, 0, canvas.width, canvas.height)
  }
}
