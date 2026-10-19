// A small line chart drawn with plain SVG (no extra packages): time along the bottom,
// one value up the side, one line per series, with a hover crosshair and tooltip.
import { useEffect, useRef, useState } from 'react'

export interface Series {
  id: string
  label: string
  color: string
  points: { t: number; v: number }[] // t = time in ms
}

interface Props {
  title: string
  series: Series[]
  format: (v: number) => string
  step?: boolean // levels jump rather than slide, so draw them as steps
  height?: number
}

const PAD = { top: 12, right: 16, bottom: 28, left: 52 }

// The last value at or before time t (a toon's level stays put between imports).
function valueAt(points: Series['points'], t: number) {
  let found: number | null = null
  for (const p of points) if (p.t <= t) found = p.v
  return found
}

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const ticks = []
  for (let v = Math.floor(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

export function LineChart({ title, series, format, step = false, height = 260 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [hoverT, setHoverT] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <p className="text-sm text-ash">No history yet. It builds up each time you import.</p>

  const times = [...new Set(all.map((p) => p.t))].sort((a, b) => a - b)
  const tMin = times[0]
  const tMax = times[times.length - 1] === tMin ? tMin + 86_400_000 : times[times.length - 1]
  const yTicks = niceTicks(Math.min(...all.map((p) => p.v)), Math.max(...all.map((p) => p.v)))
  const yMin = yTicks[0]
  const yMax = yTicks[yTicks.length - 1] === yMin ? yMin + 1 : yTicks[yTicks.length - 1]

  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const x = (t: number) => PAD.left + ((t - tMin) / (tMax - tMin)) * innerW
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH

  const path = (pts: Series['points']) =>
    pts
      .map((p, i) => {
        if (i === 0) return `M${x(p.t)},${y(p.v)}`
        return step ? `H${x(p.t)}V${y(p.v)}` : `L${x(p.t)},${y(p.v)}`
      })
      .join('')

  const dayFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
  const xTicks = niceTicks(tMin, tMax, Math.max(2, Math.floor(innerW / 110))).filter((t) => t >= tMin && t <= tMax)

  // Hover: snap to the nearest recorded time.
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const t = tMin + ((e.clientX - box.left - PAD.left) / innerW) * (tMax - tMin)
    setHoverT(times.reduce((best, cur) => (Math.abs(cur - t) < Math.abs(best - t) ? cur : best), times[0]))
  }

  const hoverRows =
    hoverT === null
      ? []
      : series
          .map((s) => ({ s, v: valueAt(s.points, hoverT) }))
          .filter((r) => r.v !== null)
          .sort((a, b) => (b.v ?? 0) - (a.v ?? 0))
  const tipLeft = hoverT !== null && x(hoverT) > width / 2

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={wrap} className="relative">
        <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHoverT(null)} role="img" aria-label={title} className="block touch-none">
          {/* recessive grid + axes */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="#2a2c2e" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-ash text-[11px] tabular-nums">
                {format(v)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={height - 8} textAnchor="middle" className="fill-ash text-[11px]">
              {dayFmt.format(t)}
            </text>
          ))}
          {series.map((s) => (
            <g key={s.id}>
              <path d={path(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.points.length === 1 && <circle cx={x(s.points[0].t)} cy={y(s.points[0].v)} r={4} fill={s.color} />}
            </g>
          ))}
          {hoverT !== null && (
            <g>
              <line x1={x(hoverT)} x2={x(hoverT)} y1={PAD.top} y2={PAD.top + innerH} stroke="#a3a6a5" strokeWidth={1} />
              {hoverRows.map(({ s, v }) => (
                <circle key={s.id} cx={x(hoverT)} cy={y(v!)} r={4.5} fill={s.color} stroke="#1c2022" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {hoverT !== null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded border border-leather-light bg-ink/95 px-3 py-2 text-xs shadow-lg"
            style={tipLeft ? { right: width - x(hoverT) + 12 } : { left: x(hoverT) + 12 }}
          >
            <p className="mb-1 text-ash">{dayFmt.format(hoverT)}</p>
            {hoverRows.map(({ s, v }) => (
              <p key={s.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums">{format(v!)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      {/* Legend: identity is never colour alone */}
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ash">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
