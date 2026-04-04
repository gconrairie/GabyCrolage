import SectionHead from './SectionHead'
import { formatPercent2 } from './numberFormat'

export default function MediaKitAudience({ audience, ageBars, cities }) {
  return (
    <section className="mkit-sec mkit-sec--audience" aria-labelledby="sec-audience">
      <SectionHead n="05" title="Audience" subtitle="Démographie & géographie" />
      <div className="mkit-aud-grid" id="sec-audience">
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">Répartition par âge</h3>
          <ul className="mkit-bars">
            {ageBars.map((bar) => (
              <li key={bar.label} className="mkit-bar">
                <span className="mkit-bar__lbl">{bar.label}</span>
                <span className="mkit-bar__track">
                  <span
                    className="mkit-bar__fill"
                    style={{ width: bar.width, animationDelay: bar.delay }}
                  />
                </span>
                <span className="mkit-bar__pct">
                  {formatPercent2(bar.pct)}%
                </span>
              </li>
            ))}
          </ul>
          <h3 className="mkit-aud-h mkit-aud-h--sp">Répartition par genre</h3>
          <div className="mkit-gender">
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">{formatPercent2(audience.gender.men)}%</span>
              <span className="mkit-gender__lbl">Hommes</span>
            </div>
            <div className="mkit-gender__cell">
              <span className="mkit-gender__pct">{formatPercent2(audience.gender.women)}%</span>
              <span className="mkit-gender__lbl">Femmes</span>
            </div>
          </div>
        </div>
        <div className="mkit-aud-card">
          <h3 className="mkit-aud-h">Villes principales</h3>
          <ul className="mkit-citylist">
            {cities.map(([city, pct]) => (
              <li key={city}>
                <span>{city}</span>
                <span>{formatPercent2(pct)}%</span>
              </li>
            ))}
          </ul>
          <blockquote className="mkit-quote">
            <cite className="mkit-quote__src">Insight clé</cite>
            <p className="mkit-quote__txt">{audience.insight}</p>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
