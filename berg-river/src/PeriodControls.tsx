import { useState } from 'react'
import { useI18n, locale, type Key } from './i18n'
import {
  LATEST,
  periodErrorKey,
  periodName,
  presets,
  shiftPeriod,
  type PresetId,
} from './periods'
import type { Period } from './stats'

type Props = {
  periods: [Period, Period]
  onPreset: (id: PresetId) => void
  onCustom: (p: [Period, Period]) => void
}

const LABEL: Record<PresetId, [Key, Key]> = {
  winter: ['cmp.winter', 'cmp.winterHint'],
  summer: ['cmp.summer', 'cmp.summerHint'],
  '12m': ['cmp.year', 'cmp.yearHint'],
  '90d': ['cmp.recent', 'cmp.recentHint'],
}
const ORDER: PresetId[] = ['winter', 'summer', '12m', '90d']

const same = (a: [Period, Period], b: [Period, Period]) =>
  a[0].start === b[0].start &&
  a[0].end === b[0].end &&
  a[1].start === b[1].start &&
  a[1].end === b[1].end

export function periodsError(
  periods: [Period, Period],
  t: ReturnType<typeof useI18n>['t']
): string | null {
  for (const p of periods) {
    const e = periodErrorKey(p)
    if (e) return t(e.key, { date: e.date ?? '' })
  }
  return null
}

export default function PeriodControls({ periods, onPreset, onCustom }: Props) {
  const { t, lang } = useI18n()
  const list = presets()
  const active = list.find((p) => same(p.periods, periods))
  const [custom, setCustom] = useState(false)
  const loc = locale(lang)
  const error = periodsError(periods, t)
  const set = (i: 0 | 1, patch: Partial<Period>) => {
    const next: [Period, Period] = [periods[0], periods[1]]
    next[i] = { ...next[i], ...patch }
    onCustom(next)
  }

  return (
    <section className="controls" aria-label={t('cmp.title')}>
      <div className="presets" role="group" aria-label={t('cmp.title')}>
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${active?.id === id ? 'on' : ''}`}
            aria-pressed={active?.id === id}
            title={t(LABEL[id][1])}
            onClick={() => {
              setCustom(false)
              onPreset(id)
            }}
          >
            {t(LABEL[id][0])}
          </button>
        ))}
        <button
          type="button"
          className={`chip ${!active ? 'on' : ''}`}
          aria-expanded={custom}
          onClick={() => setCustom((c) => !c)}
        >
          {t('cmp.custom')}
        </button>
      </div>

      <p className="period-summary">
        {t('cmp.summary', { a: '\u0000a', b: '\u0000b' })
          .split(/(\u0000[ab])/)
          .map((part, i) =>
            part === '\u0000a' ? (
              <span key={i} className="pill p1">
                <i />
                {periodName(periods[0], periods[1], loc)}
              </span>
            ) : part === '\u0000b' ? (
              <span key={i} className="pill p2">
                <i />
                {periodName(periods[1], periods[0], loc)}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
      </p>

      {custom && (
        <div className="custom">
          {([0, 1] as const).map((i) => (
            <fieldset key={i} className={`period p${i + 1}`}>
              <legend>
                <i /> {t(i === 0 ? 'cmp.earlier' : 'cmp.later')}
              </legend>
              <label>
                {t('cmp.from')}
                <input
                  type="date"
                  value={periods[i].start}
                  max={LATEST}
                  onChange={(e) => set(i, { start: e.target.value })}
                />
              </label>
              <label>
                {t('cmp.to')}
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
                >
                  {t('cmp.yearBack')}
                </button>
                <button
                  type="button"
                  onClick={() => set(i, shiftPeriod(periods[i], 1))}
                >
                  {t('cmp.yearFwd')}
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
