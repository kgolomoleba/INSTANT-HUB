import { useEffect, useRef, useState } from 'react'

export type ChartPoint = { x: number; y: number; date: string }
export type ChartSeries = {
  key: string
  label: string
  color: string
  points: ChartPoint[]
}
/** A dated note drawn as a marker on the chart (from the farm diary). */
export type ChartEvent = { x: number; label: string; color: string }

type Props = {
  title: string
  series: ChartSeries[]
  xMax: number
  format: (y: number) => string
  /** Label for an x value (day of period), e.g. "1 Jun". */
  xLabel?: (x: number) => string
  yMin?: number
  yMaxFloor?: number
  markers?: boolean
  events?: ChartEvent[]
  /** Legend text for diary markers. */
  eventLabel?: string
}

const H = 240
const M = { top: 18, right: 16, bottom: 28, left: 48 }

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  const top = Math.ceil(max / step - 1e-9) * step
  for (let v = Math.ceil(min / step) * step; v <= top + 1e-9; v += step)
    out.push(+v.toFixed(6))
  return out
}

export default function LineChart({
  title,
  series,
  xMax,
  format,
  xLabel = (x) => (x === 0 ? 'day 0' : String(x)),
  yMin = 0,
  yMaxFloor = 0,
  markers,
  events = [],
  eventLabel = 'diary note',
}: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  const [hoverX, setHoverX] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setW(Math.max(280, e.contentRect.width))
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const all = series.flatMap((s) => s.points.map((p) => p.y))
  const dataMax = all.length ? Math.max(...all) : 1
  const ticksY = niceTicks(yMin, Math.max(dataMax, yMaxFloor, yMin + 1e-6))
  const yTop = ticksY[ticksY.length - 1] ?? 1
  const iw = w - M.left - M.right
  const ih = H - M.top - M.bottom
  const sx = (x: number) => M.left + (x / Math.max(1, xMax)) * iw
  const sy = (y: number) => M.top + ih - ((y - yMin) / (yTop - yMin || 1)) * ih
  // Ticks at whole months would need the period start; evenly spaced days work for any period.
  const tickCount = Math.max(2, Math.floor(iw / 80))
  const ticksX = niceTicks(0, xMax, tickCount).filter((t) => t <= xMax)

  const nearest = (s: ChartSeries, x: number) => {
    let best: ChartPoint | null = null
    for (const p of s.points)
      if (!best || Math.abs(p.x - x) < Math.abs(best.x - x)) best = p
    return best && Math.abs(best.x - x) <= (markers ? 12 : 1) ? best : null
  }

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * xMax
    setHoverX(Math.round(Math.min(xMax, Math.max(0, x))))
  }

  const hovered =
    hoverX == null ? [] : series.map((s) => ({ s, p: nearest(s, hoverX) }))
  const hoveredEvents =
    hoverX == null
      ? []
      : events.filter((ev) => Math.abs(ev.x - hoverX) <= Math.max(2, xMax / 60))
  const tipLeft = hoverX == null ? 0 : sx(hoverX)

  return (
    <figure className="chart" ref={wrap}>
      <figcaption>
        <span className="chart-title">{title}</span>
        <span className="legend">
          {series.map((s) => (
            <span key={s.key} className="legend-item">
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          {events.length > 0 && (
            <span className="legend-item">
              <b className="event-key">◆</b>
              {eventLabel}
            </span>
          )}
        </span>
      </figcaption>
      <div className="chart-body">
        <svg width={w} height={H} role="img" aria-label={title}>
          {ticksY.map((t) => (
            <g key={t}>
              <line
                className="grid"
                x1={M.left}
                x2={w - M.right}
                y1={sy(t)}
                y2={sy(t)}
              />
              <text
                className="tick"
                x={M.left - 8}
                y={sy(t)}
                dy="0.32em"
                textAnchor="end"
              >
                {format(t)}
              </text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text
              key={t}
              className="tick"
              x={sx(t)}
              y={H - 8}
              textAnchor="middle"
            >
              {xLabel(t)}
            </text>
          ))}
          {events.map((ev, i) => (
            <g key={i} className="event">
              <line
                x1={sx(ev.x)}
                x2={sx(ev.x)}
                y1={M.top}
                y2={M.top + ih}
                stroke={ev.color}
              />
              <text
                x={sx(ev.x)}
                y={M.top - 4}
                textAnchor="middle"
                fill={ev.color}
              >
                ◆
              </text>
            </g>
          ))}
          {series.map((s) => {
            const d = s.points
              .map(
                (p, i) =>
                  `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`
              )
              .join('')
            const last = s.points[s.points.length - 1]
            return (
              <g key={s.key}>
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {markers &&
                  s.points.map((p) => (
                    <circle
                      key={p.x}
                      cx={sx(p.x)}
                      cy={sy(p.y)}
                      r={4}
                      fill={s.color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  ))}
                {last && series.length <= 4 && (
                  <text
                    className="direct-label"
                    x={Math.min(sx(last.x) + 6, w - M.right)}
                    y={sy(last.y) - 8}
                    textAnchor="end"
                  >
                    {s.label}
                  </text>
                )}
              </g>
            )
          })}
          {hoverX != null && (
            <g pointerEvents="none">
              <line
                className="crosshair"
                x1={tipLeft}
                x2={tipLeft}
                y1={M.top}
                y2={M.top + ih}
              />
              {hovered.map(
                ({ s, p }) =>
                  p && (
                    <circle
                      key={s.key}
                      cx={sx(p.x)}
                      cy={sy(p.y)}
                      r={5}
                      fill={s.color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  )
              )}
            </g>
          )}
          <rect
            x={M.left}
            y={M.top}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHoverX(null)}
          />
        </svg>
        {hoverX != null && (
          <div
            className="tooltip"
            style={{ left: Math.min(Math.max(tipLeft, 100), w - 100) }}
          >
            <div className="tooltip-head">{xLabel(hoverX)}</div>
            {hovered.map(({ s, p }) => (
              <div key={s.key} className="tooltip-row">
                <i style={{ background: s.color }} />
                <span>{s.label}</span>
                <b>{p ? format(p.y) : '—'}</b>
                <small>{p?.date ?? ''}</small>
              </div>
            ))}
            {hoveredEvents.map((ev, i) => (
              <div
                key={i}
                className="tooltip-event"
                style={{ borderColor: ev.color }}
              >
                {ev.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}
