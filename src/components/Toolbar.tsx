import type { Tool } from '../hooks/usePixelForge'

interface ToolbarProps {
  tool: Tool
  canUndo: boolean
  canRedo: boolean
  onSelectTool: (tool: Tool) => void
  onUndo: () => void
  onRedo: () => void
}

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: 'pencil', label: 'B', title: 'Pencil (B)' },
  { id: 'eraser', label: 'E', title: 'Eraser (E)' },
  { id: 'fill', label: 'G', title: 'Fill (G)' },
  { id: 'eyedropper', label: 'I', title: 'Eyedropper (I)' },
]

function buttonBase(active: boolean): string {
  return `grid h-10 w-10 place-items-center rounded font-mono text-sm ${
    active
      ? 'bg-neutral-200 text-neutral-900'
      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
  }`
}

export function Toolbar({ tool, canUndo, canRedo, onSelectTool, onUndo, onRedo }: ToolbarProps) {
  return (
    <nav className="flex w-16 flex-col items-center gap-2 border-r border-neutral-800 py-4">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.title}
          aria-pressed={tool === t.id}
          className={buttonBase(tool === t.id)}
          onClick={() => onSelectTool(t.id)}
        >
          {t.label}
        </button>
      ))}
      <div className="my-1 h-px w-8 bg-neutral-800" />
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        className={`${buttonBase(false)} disabled:cursor-not-allowed disabled:opacity-30`}
        onClick={onUndo}
      >
        U
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Y)"
        disabled={!canRedo}
        className={`${buttonBase(false)} disabled:cursor-not-allowed disabled:opacity-30`}
        onClick={onRedo}
      >
        R
      </button>
    </nav>
  )
}
