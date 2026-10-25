import type { PointerEvent } from 'react'

interface CanvasViewportProps {
  ready: boolean
  onCanvas: (el: HTMLCanvasElement | null) => void
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
}

export function CanvasViewport({
  ready,
  onCanvas,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasViewportProps) {
  return (
    <div className="relative">
      <canvas
        ref={onCanvas}
        width={512}
        height={512}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="block h-[512px] w-[512px] cursor-crosshair touch-none bg-white [image-rendering:pixelated]"
      />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-neutral-500">
          Loading engine…
        </div>
      )}
    </div>
  )
}
