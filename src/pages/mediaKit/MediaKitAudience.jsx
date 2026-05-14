import SectionHead from './SectionHead'
import { formatPercent2 } from './numberFormat'
import MetricSpinner from './MetricSpinner'

function BarList({ rows, copy, locale }) {
  if (!rows?.length) {
    return <p className="mkit-table__na">{copy.unavailable}</p>
  }

  return (
    <ul className="mkit-bars">
      {rows.map((bar, index) => (
        <li key={bar.label} className="mkit-bar">
          <span className="mkit-bar__lbl">{bar.label}</span>
          <span className="mkit-bar__track">
            <span
              className="mkit-bar__fill"
              style={{ width: bar.width, animationDelay: `${index * 0.08}s` }}
            />
          </span>
          <span className="mkit-bar__pct">{formatPercent2(bar.pct, locale)}%</span>
        </li>
      ))}
    </ul>
  )
}

function RankedList({ rows, copy, locale }) {
  if (!rows?.length) {
    return <p className="mkit-table__na">{copy.unavailable}</p>
  }

  return (
    <ul className="mkit-citylist">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <span>
            {formatPercent2(row.pct, locale)}% · {row.value.toLocaleString(locale)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function MediaKitAudience({ audience, loading, error, copy, locale }) {
  const { section } = copy

  return (
    <section className="mkit-sec mkit-sec--audience" aria-labelledby="sec-audience">
      <SectionHead n={section.number} title={section.title} subtitle={section.subtitle} />
      {error ? <p className="mkit-api-note mkit-api-note--warn">{error}</p> : null}
      <div className="mkit-aud-grid" id="sec-audience">
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">{copy.ageTitle}</h3>
          {loading ? <MetricSpinner label={copy.loading.age} /> : <BarList rows={audience.age} copy={copy} locale={locale} />}
          <h3 className="mkit-aud-h mkit-aud-h--sp">{copy.genderTitle}</h3>
          <div className="mkit-gender">
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">
                {loading ? (
                  <MetricSpinner label={copy.loading.men} />
                ) : (
                  `${formatPercent2(audience.gender.find((row) => row.label === 'M')?.pct, locale)}%`
                )}
              </span>
              <span className="mkit-gender__lbl">{copy.men}</span>
            </div>
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">
                {loading ? (
                  <MetricSpinner label={copy.loading.women} />
                ) : (
                  `${formatPercent2(audience.gender.find((row) => row.label === 'F')?.pct, locale)}%`
                )}
              </span>
              <span className="mkit-gender__lbl">{copy.women}</span>
            </div>
          </div>
        </div>
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">{copy.citiesTitle}</h3>
          {loading ? <MetricSpinner label={copy.loading.cities} /> : <RankedList rows={audience.cities} copy={copy} locale={locale} />}
          <h3 className="mkit-aud-h mkit-aud-h--sp">{copy.countriesTitle}</h3>
          {loading ? <MetricSpinner label={copy.loading.countries} /> : <RankedList rows={audience.countries} copy={copy} locale={locale} />}
          <blockquote className="mkit-quote">
            <cite className="mkit-quote__src">{copy.insightTitle}</cite>
            <p className="mkit-quote__txt">
              {loading ? <MetricSpinner label={copy.loading.insight} /> : audience.insight}
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
