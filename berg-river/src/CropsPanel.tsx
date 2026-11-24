import { useEffect, useState } from 'react'
import { cropCensus, type CensusResult } from './crops'
import type { Farm } from './farms'

const fmtHa = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1))

export default function CropsPanel({ farm }: { farm: Farm }) {
  const [data, setData] = useState<CensusResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setData(null)
    cropCensus(farm)
      .then((d) => live && setData(d))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [farm])

  const years = [2023, 2017, 2013]
  const allFailed = data?.every((d) => d.error)

  return (
    <section
      className="crops"
      aria-label="Crops from the Western Cape crop census"
    >
      <div className="crops-head">
        <h3>Crops on this farm</h3>
        <span className="muted">Western Cape crop census</span>
      </div>
      {!farm.boundary && (
        <p className="hint">
          This farm is a point, so only the field at that point is shown. Add
          its boundary for the whole farm.
        </p>
      )}
      {loading && <p className="hint">Loading crop census…</p>}
      {allFailed && (
        <p className="notice small error">
          Couldn't load the crop census: {data?.[0]?.error}. Try again later.
        </p>
      )}
      {data && !allFailed && (
        <div className="crops-grid">
          {years.map((y) => (
            <div key={y} className="crop-year">
              <div className="crop-year-title">{y}</div>
              {(['Winter', 'Summer'] as const).map((season) => {
                const d = data.find((x) => x.year === y && x.season === season)
                return (
                  <div key={season} className="crop-season">
                    <div className="crop-season-title">{season}</div>
                    {d?.error ? (
                      <div className="muted small">Not available</div>
                    ) : !d?.rows.length ? (
                      <div className="muted small">No crops recorded</div>
                    ) : (
                      <ul>
                        {d.rows.map((r) => (
                          <li key={`${r.crop}|${r.irrigation}`}>
                            <span>
                              {r.crop}
                              {r.irrigation && <small> · {r.irrigation}</small>}
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
