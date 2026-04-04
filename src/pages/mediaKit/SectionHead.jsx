export default function SectionHead({ n, title, subtitle }) {
  return (
    <header className="mkit-sec-head">
      <div className="mkit-sec-head__row">
        <span className="mkit-sec-num" aria-hidden>
          {n}
        </span>
        <div className="mkit-sec-head__text">
          <h2 className="mkit-sec-title">{title}</h2>
          {subtitle ? <p className="mkit-sec-sub">{subtitle}</p> : null}
        </div>
      </div>
      <span className="mkit-sec-rule" aria-hidden />
    </header>
  )
}
