import { useEffect, useState } from 'react'
import { cropCensus, type CensusResult } from './crops'
import type { Farm } from './farms'
import { useI18n } from './i18n'

const fmtHa = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1))

export default function CropsPanel({
  farm,
  onCensus,
}: {
  farm: Farm
  onCensus?: (c: CensusResult[]) => void
}) {
  const { t } = useI18n()
  const [data, setData] = useState<CensusResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setData(null)
    cropCensus(farm)
      .then((d) => {
        if (!live) return
        setData(d)
        onCensus?.(d)
      })
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
    // Reload only when the farm's location or outline changes, not on rename.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm.id, farm.lat, farm.lon, farm.boundary])

  const allFailed = data?.every((d) => d.error)
  const irrigation = (s: string) =>
    s === 'Irrigated'
      ? t('crops.irrigated')
      : s === 'Dry land'
        ? t('crops.dry')
        : s

  return (
    <section className="crops" aria-label={t('crops.title')}>
      <div className="crops-head">
        <h3>{t('crops.title')}</h3>
        <span className="muted">{t('crops.source')}</span>
      </div>
      {!farm.boundary && <p className="hint">{t('crops.point')}</p>}
      {loading && <p className="hint">{t('crops.loading')}</p>}
      {allFailed && <p className="notice small error">{t('crops.error')}</p>}
      {data && !allFailed && (
        <div className="crops-grid">
          {[2023, 2017, 2013].map((y) => (
            <div key={y} className="crop-year">
              <div className="crop-year-title">{y}</div>
              {(['Winter', 'Summer'] as const).map((season) => {
                const d = data.find((x) => x.year === y && x.season === season)
                return (
                  <div key={season} className="crop-season">
                    <div className="crop-season-title">
                      {t(season === 'Winter' ? 'crops.winter' : 'crops.summer')}
                    </div>
                    {d?.error ? (
                      <div className="muted small">{t('crops.na')}</div>
                    ) : !d?.rows.length ? (
                      <div className="muted small">{t('crops.none')}</div>
                    ) : (
                      <ul>
                        {d.rows.map((r) => (
                          <li key={`${r.crop}|${r.irrigation}`}>
                            <span>
                              {r.crop}
                              {r.irrigation && (
                                <small> · {irrigation(r.irrigation)}</small>
                              )}
                            </span>
                            <b>{fmtHa(r.areaHa)} ha</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
