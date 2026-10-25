import { CanvasViewport } from './components/CanvasViewport'
import { Toolbar } from './components/Toolbar'
import { usePixelForge } from './hooks/usePixelForge'

export default function App() {
  const pf = usePixelForge()

  return (
    <main className="flex h-screen bg-neutral-950 text-neutral-100">
      <Toolbar
        tool={pf.tool}
        canUndo={pf.canUndo}
        canRedo={pf.canRedo}
        onSelectTool={pf.setTool}
        onUndo={pf.undo}
        onRedo={pf.redo}
      />
      <section className="grid flex-1 place-items-center overflow-hidden">
        <CanvasViewport
          ready={pf.ready}
          onCanvas={pf.registerCanvas}
          onPointerDown={pf.onPointerDown}
          onPointerMove={pf.onPointerMove}
          onPointerUp={pf.onPointerUp}
          onPointerCancel={pf.onPointerCancel}
        />
      </section>
      <aside className="w-48 border-l border-neutral-800 p-4 text-sm text-neutral-500">
        Palette — Phase 4
      </aside>
    </main>
  )
}
