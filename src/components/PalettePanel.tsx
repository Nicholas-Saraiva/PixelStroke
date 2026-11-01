import { useEffect, useState } from 'react'

// Sweetie-16, a 16-color retro palette (GrafxKid), as #rrggbb.
const PALETTE = [
  '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57',
  '#ffcd75', '#a7f070', '#38b764', '#257179',
  '#29366f', '#3b5dc9', '#41a6f6', '#73eff7',
  '#f4f4f4', '#94b0c2', '#566c86', '#333c57',
]

function u32ToHex(c: number): string {
  return '#' + ((c >>> 8) & 0xffffff).toString(16).padStart(6, '0')
}

function hexToU32(hex: string): number | null {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return ((parseInt(h, 16) << 8) | 0xff) >>> 0
}

interface PalettePanelProps {
  color: number
  onSelect: (color: number) => void
}

export function PalettePanel({ color, onSelect }: PalettePanelProps) {
  const [hex, setHex] = useState(() => u32ToHex(color))

  useEffect(() => {
    setHex(u32ToHex(color))
  }, [color])

  const commitHex = () => {
    const parsed = hexToU32(hex)
    if (parsed !== null) {
      onSelect(parsed)
    } else {
      setHex(u32ToHex(color))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
        Color
      </h2>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 shrink-0 rounded border border-neutral-700"
          style={{ backgroundColor: u32ToHex(color) }}
        />
        <input
          type="color"
          value={u32ToHex(color)}
          onChange={(e) => onSelect(hexToU32(e.target.value) ?? color)}
          className="h-8 w-10 cursor-pointer rounded bg-neutral-800"
          title="Pick a color"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitHex()
          }}
          spellCheck={false}
          className="w-full min-w-0 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-neutral-100"
          title="Hex color (#rrggbb)"
        />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {PALETTE.map((hexColor) => {
          const value = hexToU32(hexColor) ?? 0
          const active = value === color
          return (
            <button
              key={hexColor}
              type="button"
              title={hexColor}
              aria-pressed={active}
              className={`aspect-square w-full rounded ${active ? 'ring-2 ring-neutral-100' : 'ring-1 ring-neutral-700/60'}`}
              style={{ backgroundColor: hexColor }}
              onClick={() => onSelect(value)}
            />
          )
        })}
      </div>
    </div>
  )
}
