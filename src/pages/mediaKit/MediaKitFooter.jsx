export default function MediaKitFooter({ year, metaLastUpdated, kitUpdatedLabel }) {
  return (
    <footer className="mkit-foot">
      <p>© Gaby Crolage · {year}</p>
      <p>Media Kit — usage professionnel</p>
      {kitUpdatedLabel ? (
        <p className="mkit-foot__updated">
          Dernière mise à jour du document :{' '}
          <time dateTime={metaLastUpdated}>{kitUpdatedLabel}</time>
        </p>
      ) : null}
    </footer>
  )
}
