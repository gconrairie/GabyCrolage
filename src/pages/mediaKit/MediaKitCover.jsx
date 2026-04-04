export default function MediaKitCover({
  hero,
  metaLastUpdated,
  kitUpdatedLabel,
  profileErr,
  heroStats,
  followersFormatted,
}) {
  return (
    <header className="mkit-cover" id="top">
      <div className="mkit-cover__bar">
        <div className="mkit-cover__bar-left">
          <span className="mkit-cover__doc">{hero.tag}</span>
          <span className="mkit-cover__year">{hero.year}</span>
        </div>
        {kitUpdatedLabel ? (
          <p className="mkit-cover__updated">
            Mis à jour le <time dateTime={metaLastUpdated}>{kitUpdatedLabel}</time>
          </p>
        ) : null}
      </div>

      <div className="mkit-cover__grid">
        <div className="mkit-cover__primary">
          <p className="mkit-cover__eyebrow">{hero.eyebrow}</p>
          <h1 className="mkit-cover__name">
            <span className="mkit-cover__name1">{hero.nameLine1}</span>
            <span className="mkit-cover__name2">{hero.nameLine2}</span>
          </h1>
          <ul className="mkit-cover__roles">
            {hero.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>

        <aside className="mkit-cover__aside" aria-label="Indicateurs clés">
          {profileErr ? <p className="mkit-api-note mkit-api-note--warn">{profileErr}</p> : null}
          <ul className="mkit-kpi">
            {heroStats.map((s) => (
              <li key={s.label} className="mkit-kpi__item">
                <span className="mkit-kpi__val">{s.value}</span>
                <span className="mkit-kpi__lbl">{s.label}</span>
              </li>
            ))}
          </ul>
          {followersFormatted ? (
            <p className="mkit-api-note">Abonnés · Instagram Graph API</p>
          ) : null}
        </aside>
      </div>
    </header>
  )
}
