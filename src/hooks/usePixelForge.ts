import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { Grid } from '../../rust/pkg/pixelforge_engine.js'
import { getGrid, Renderer } from '../engine/engine'

export type Tool = 'pencil' | 'eraser'

export const GRID_SIZE = 32
export const ERASER_COLOR = 0xffffffff
export const DEFAULT_COLOR = 0x000000ff

export function usePixelForge() {
  const [ready, setReady] = useState(false)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const gridRef = useRef<Grid | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const paintingRef = useRef(false)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (canvas && renderer) renderer.render(canvas)
  }, [])

  const syncHistory = useCallback(() => {
    setCanUndo(gridRef.current?.can_undo() ?? false)
    setCanRedo(gridRef.current?.can_redo() ?? false)
  }, [])

  useEffect(() => {
    let cancelled = false
    getGrid().then((grid) => {
      if (cancelled) return
      gridRef.current = grid
      rendererRef.current = new Renderer(grid)
      setReady(true)
      syncHistory()
      render()
    })
    return () => {
      cancelled = true
    }
  }, [render, syncHistory])

  const registerCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas
      render()
    },
    [render],
  )

  const applyAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      const grid = gridRef.current
      if (!canvas || !grid) return
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor(((clientX - rect.left) / rect.width) * GRID_SIZE)
      const y = Math.floor(((clientY - rect.top) / rect.height) * GRID_SIZE)
      grid.set_pixel(x, y, tool === 'eraser' ? ERASER_COLOR : color)
      render()
    },
    [tool, color, render],
  )

  const finishStroke = useCallback(() => {
    if (!paintingRef.current) return
    paintingRef.current = false
    gridRef.current?.end_stroke()
    syncHistory()
  }, [syncHistory])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (!gridRef.current || e.button !== 0) return
      // A previous stroke may still be open if its pointerup was lost.
      if (paintingRef.current) finishStroke()
      paintingRef.current = true
      gridRef.current.begin_stroke()
      applyAt(e.clientX, e.clientY)
      syncHistory()
      // Capture is best-effort: painting must not depend on it.
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Pointer already inactive; moves just won't be captured.
      }
    },
    [applyAt, syncHistory, finishStroke],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (!paintingRef.current) return
      // If the button was released without a pointerup (e.g. outside the
      // window), finish the stroke instead of painting forever.
      if ((e.buttons & 1) === 0) {
        finishStroke()
        return
      }
      applyAt(e.clientX, e.clientY)
    },
    [applyAt, finishStroke],
  )

  const undo = useCallback(() => {
    if (gridRef.current?.undo()) {
      render()
      syncHistory()
    }
  }, [render, syncHistory])

  const redo = useCallback(() => {
    if (gridRef.current?.redo()) {
      render()
      syncHistory()
    }
  }, [render, syncHistory])

  return {
    ready,
    tool,
    setTool,
    color,
    setColor,
    canUndo,
    canRedo,
    undo,
    redo,
    registerCanvas,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishStroke,
    onPointerCancel: finishStroke,
  }
}
