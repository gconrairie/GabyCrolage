import { useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import SectionHead from './SectionHead'
import { REELS } from './data'
import { useReelGridMetrics } from './hooks/useReelGridMetrics'
import { buildRankedReelRows, formatReelMediaMeta, reelDisplayHeadline } from './utils'
import { formatCompactMetric } from './numberFormat'
import ReelEngagementMetrics from './ReelEngagementMetrics'

/** Colonnes : contenu | vues | engagement — aligné sur les variables .mkit */
const reelGridCols =
  'grid grid-cols-[1fr_6rem] sm:grid-cols-[1fr_6rem_16rem] items-start gap-x-3 '

export default function MediaKitReelsTable() {
  const reelGrid = useReelGridMetrics(REELS)

  const rows = useMemo(() => buildRankedReelRows(REELS, reelGrid), [reelGrid])

  return (
    <section className="mkit-sec" aria-labelledby="sec-reels">
      <SectionHead
        n="03"
        title="Contenus viraux"
        subtitle="Classement par vues (lifetime) — données Instagram Graph"
      />
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
            const { configTitle, loading, error, data } = row
            const media = data?.media
            const insights = data?.insights
            const permalink = media?.permalink
            const headline = reelDisplayHeadline(media?.caption, configTitle)
            const metaLine = formatReelMediaMeta(media)

            const isTopRanked = index === 0 && !loading && !error
            const isLast = index === rows.length - 1

            let viewsCell = <span className="mkit-table__na">—</span>
            if (loading) {
              viewsCell = <span className="mkit-table__pending">…</span>
            } else if (typeof insights?.views === 'number') {
              viewsCell = formatCompactMetric(insights.views)
            }

            let engCell = <ReelEngagementMetrics insights={insights} />
            if (loading) {
              engCell = <span className="mkit-table__pending">…</span>
            }

            return (
              <div
                key={row.configId}
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
                title={error || undefined}
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
                  {error ? (
                    <span className="mkit-table__api-err" role="status">
                      {error}
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
        </div>
      </div>
    </section>
  )
}
