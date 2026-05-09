import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import SectionHead from './SectionHead'
import { formatReelMediaMeta, reelDisplayHeadline } from './utils'
import { formatCompactMetric } from './numberFormat'
import ReelEngagementMetrics from './ReelEngagementMetrics'
import MetricSpinner from './MetricSpinner'

/** Colonnes : contenu | vues | engagement — aligné sur les variables .mkit */
const reelGridCols =
  'grid grid-cols-[1fr_6rem] sm:grid-cols-[1fr_6rem_16rem] items-start gap-x-3 '

export default function MediaKitReelsTable({ reels = [], loading, error, note }) {
  const rows = loading
    ? Array.from({ length: 5 }, (_, index) => ({
        loading: true,
        resolvedMediaId: `loading-${index}`,
        media: null,
        insights: null,
      }))
    : reels

  return (
    <section className="mkit-sec" aria-labelledby="sec-reels">
      <SectionHead
        n="03"
        title="Contenus viraux"
        subtitle="Top 5 calculé par vues sur les reels accessibles via Instagram Graph"
      />
      {note ? <p className="mkit-api-note">{note}</p> : null}
      {error ? <p className="mkit-api-note mkit-api-note--warn">{error}</p> : null}
      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <div
          id="sec-reels"
          className="flex w-full flex-col text-sm"
          role="table"
          aria-label="Reels classés par nombre de vues (lifetime)"
        >
          <div
            className={`${reelGridCols} border-b border-[color:var(--mk-border-strong)] pb-2 pt-0`}
            role="row"
          >
            <div
              className="p-0 text-left font-[family-name:var(--font-title)] text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mk-muted)]"
              role="columnheader"
            >
              Contenu
            </div>
            <div
              className="p-0 text-center font-[family-name:var(--font-title)] text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mk-muted)]"
              role="columnheader"
            >
              Vues
            </div>
            <div
              className="p-0 text-right font-[family-name:var(--font-title)] text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mk-muted)]"
              role="columnheader"
            >
              Engagement
            </div>
          </div>

          {rows.map((row, index) => {
            const media = row.media
            const insights = row.insights
            const permalink = media?.permalink
            const headline = row.loading
              ? 'Chargement du reel'
              : reelDisplayHeadline(media?.caption, 'Reel Instagram')
            const metaLine = formatReelMediaMeta(media)

            const isTopRanked = index === 0 && !row.loading && !error
            const isLast = index === rows.length - 1

            let viewsCell = <span className="mkit-table__na">—</span>
            if (row.loading) {
              viewsCell = <MetricSpinner label="Chargement vues reel" />
            } else if (typeof insights?.views === 'number') {
              viewsCell = formatCompactMetric(insights.views)
            }

            let engCell = <ReelEngagementMetrics insights={insights} />
            if (row.loading) {
              engCell = <MetricSpinner label="Chargement engagement reel" />
            }

            return (
              <div
                key={row.resolvedMediaId || row.media?.id || index}
                role="row"
                className={[
                  reelGridCols,
                  'border-b border-[color:var(--mk-border)] p-4',
                  isLast ? 'border-b-0' : '',
                  isTopRanked
                    ? 'bg-[rgba(212,184,150,0.06)]'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={row.error || undefined}
              >
                <div role="cell">
                  <span className="">
                    {permalink ? (
                      <a
                        className="mkit-table__title mkit-table__title--link"
                        href={permalink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {headline}
                        <FontAwesomeIcon
                          icon={faUpRightFromSquare}
                          className="mkit-table__ext mkit-table__ext--fa"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <span className="mkit-table__title">{headline}</span>
                    )}
                  </span>
                  {metaLine ? <span className="mkit-table__meta">{metaLine}</span> : null}
                  {row.error ? (
                    <span className="mkit-table__api-err" role="status">
                      {row.error}
                    </span>
                  ) : null}
                </div>
                <div
                  className="flex h-full items-center justify-center font-[family-name:var(--font-title)] text-lg font-bold whitespace-nowrap text-[color:var(--mk-text)]"
                  role="cell"
                >
                  {viewsCell}
                </div>
                <div
                  className="flex h-full col-span-2 sm:col-span-1 pt-3 sm:pt-0 items-center justify-center sm:justify-self-end text-right text-xs text-[color:var(--mk-muted)]"
                  role="cell"
                >
                  {engCell}
                </div>
              </div>
            )
          })}
          {!loading && !error && rows.length === 0 ? (
            <div role="row" className={`${reelGridCols} border-b-0 p-4`}>
              <div className="mkit-table__na" role="cell">
                Aucun reel classable renvoyé par l’API.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
