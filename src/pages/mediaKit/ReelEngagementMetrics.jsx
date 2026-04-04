import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookmark,
  faComment,
  faHeart,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons'
import { formatCompactMetric } from './numberFormat'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'

const METRICS = [
  { key: 'likes', icon: faHeart },
  { key: 'comments', icon: faComment },
  { key: 'shares', icon: faPaperPlane },
  { key: 'saved', icon: faBookmark },
]

export default function ReelEngagementMetrics({ insights }) {
  if (!insights || typeof insights !== 'object') {
    return <span className="mkit-table__na">—</span>
  }

  const parts = []
  for (const { key, icon } of METRICS) {
    const v = insights[key]
    if (typeof v === 'number') {
      parts.push(
        <span key={key} className="mkit-metric-inline">
          <FontAwesomeIcon icon={icon} className="mkit-fa-metric" aria-hidden />
          <span>{formatCompactMetric(v)}</span>
        </span>,
      )
    }
  }

  if (!parts.length) {
    return <span className="mkit-table__na">—</span>
  }

  return <span className="mkit-eng-group">{parts}</span>
}
