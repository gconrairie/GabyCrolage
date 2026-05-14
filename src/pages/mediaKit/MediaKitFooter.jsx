export default function MediaKitFooter({ year, metaLastUpdated, kitUpdatedLabel, copy }) {
  return (
    <footer className="mkit-foot">
      <p>© Gaby Crolage · {year}</p>
      <p>{copy.usage}</p>
      {kitUpdatedLabel ? (
        <p className="mkit-foot__updated">
          {copy.updatedPrefix}{' '}
          <time dateTime={metaLastUpdated}>{kitUpdatedLabel}</time>
        </p>
      ) : null}
    </footer>
  )
}
