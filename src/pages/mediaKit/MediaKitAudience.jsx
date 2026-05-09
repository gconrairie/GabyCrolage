import SectionHead from './SectionHead'
import { formatPercent2 } from './numberFormat'
import MetricSpinner from './MetricSpinner'

function BarList({ rows }) {
  if (!rows?.length) {
    return <p className="mkit-table__na">Données indisponibles.</p>
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
          <span className="mkit-bar__pct">{formatPercent2(bar.pct)}%</span>
        </li>
      ))}
    </ul>
  )
}

function RankedList({ rows }) {
  if (!rows?.length) {
    return <p className="mkit-table__na">Données indisponibles.</p>
  }

  return (
    <ul className="mkit-citylist">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <span>
            {formatPercent2(row.pct)}% · {row.value.toLocaleString('fr-FR')}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function MediaKitAudience({ audience, loading, error }) {
  return (
    <section className="mkit-sec mkit-sec--audience" aria-labelledby="sec-audience">
      <SectionHead n="05" title="Audience" subtitle="Démographie & géographie" />
      {error ? <p className="mkit-api-note mkit-api-note--warn">{error}</p> : null}
      <div className="mkit-aud-grid" id="sec-audience">
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">Répartition par âge</h3>
          {loading ? <MetricSpinner label="Chargement audience âge" /> : <BarList rows={audience.age} />}
          <h3 className="mkit-aud-h mkit-aud-h--sp">Répartition par genre</h3>
          <div className="mkit-gender">
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">
                {loading ? (
                  <MetricSpinner label="Chargement audience hommes" />
                ) : (
                  `${formatPercent2(audience.gender.find((row) => row.label === 'M')?.pct)}%`
                )}
              </span>
              <span className="mkit-gender__lbl">Hommes</span>
            </div>
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">
                {loading ? (
                  <MetricSpinner label="Chargement audience femmes" />
                ) : (
                  `${formatPercent2(audience.gender.find((row) => row.label === 'F')?.pct)}%`
                )}
              </span>
              <span className="mkit-gender__lbl">Femmes</span>
            </div>
          </div>
        </div>
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">Villes principales en France</h3>
          {loading ? <MetricSpinner label="Chargement villes" /> : <RankedList rows={audience.cities} />}
          <h3 className="mkit-aud-h mkit-aud-h--sp">Pays principaux</h3>
          {loading ? <MetricSpinner label="Chargement pays" /> : <RankedList rows={audience.countries} />}
          <blockquote className="mkit-quote">
            <cite className="mkit-quote__src">Insight clé</cite>
            <p className="mkit-quote__txt">
              {loading ? <MetricSpinner label="Chargement insight audience" /> : audience.insight}
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
