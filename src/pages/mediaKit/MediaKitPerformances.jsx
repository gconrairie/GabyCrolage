import SectionHead from './SectionHead'

export default function MediaKitPerformances({ perfCells }) {
  return (
    <section className="mkit-sec" aria-labelledby="sec-perf">
      <SectionHead n="02" title="Performances" subtitle="Synthèse sur la période de référence" />
      <ul className="mkit-metrics" id="sec-perf">
        {perfCells.map((cell) => (
          <li
            key={cell.label}
            className={`mkit-metric${cell.featured ? ' mkit-metric--featured' : ''}`}
          >
            <span className="mkit-metric__val">{cell.value}</span>
            <span className="mkit-metric__lbl">{cell.label}</span>
            <span className="mkit-metric__sub">{cell.sub}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
