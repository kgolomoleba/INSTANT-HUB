import { useState } from 'react'
import { LATEST, periodName, presets, shiftPeriod } from './periods'
import type { Period } from './stats'

type Props = {
  periods: [Period, Period]
  onChange: (p: [Period, Period]) => void
  error: string | null
}

const same = (a: [Period, Period], b: [Period, Period]) =>
  a[0].start === b[0].start &&
  a[0].end === b[0].end &&
  a[1].start === b[1].start &&
  a[1].end === b[1].end

export default function PeriodControls({ periods, onChange, error }: Props) {
  const list = presets()
  const active = list.find((p) => same(p.periods, periods))
  const [custom, setCustom] = useState(!active)
  const set = (i: 0 | 1, patch: Partial<Period>) => {
    const next: [Period, Period] = [periods[0], periods[1]]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }

  return (
    <section className="controls" aria-label="Compare periods">
      <div className="presets" role="group" aria-label="Quick comparisons">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${active?.id === p.id ? 'on' : ''}`}
            aria-pressed={active?.id === p.id}
            title={p.hint}
            onClick={() => onChange(p.periods)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`chip ${!active ? 'on' : ''}`}
          aria-expanded={custom}
          onClick={() => setCustom((c) => !c)}
        >
          Custom dates
        </button>
      </div>

      <p className="period-summary">
        Comparing{' '}
        <span className="pill p1">
          <i />
          {periodName(periods[0], periods[1])}
        </span>{' '}
        with{' '}
        <span className="pill p2">
          <i />
          {periodName(periods[1], periods[0])}
        </span>
      </p>

      {custom && (
        <div className="custom">
          {([0, 1] as const).map((i) => (
            <fieldset key={i} className={`period p${i + 1}`}>
              <legend>
                <i /> {i === 0 ? 'Earlier period (A)' : 'Later period (B)'}
              </legend>
              <label>
                From
                <input
                  type="date"
                  value={periods[i].start}
                  max={LATEST}
                  onChange={(e) => set(i, { start: e.target.value })}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={periods[i].end}
                  max={LATEST}
                  onChange={(e) => set(i, { end: e.target.value })}
                />
              </label>
              <span className="year-shift">
                <button
                  type="button"
                  onClick={() => set(i, shiftPeriod(periods[i], -1))}
                  aria-label="One year earlier"
                >
                  −1 yr
                </button>
                <button
                  type="button"
                  onClick={() => set(i, shiftPeriod(periods[i], 1))}
                  aria-label="One year later"
                >
                  +1 yr
                </button>
              </span>
            </fieldset>
          ))}
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
