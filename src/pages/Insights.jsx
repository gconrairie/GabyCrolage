import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './Insights.css'

const numberFormatter = new Intl.NumberFormat('fr-FR')

const PROFILE_DESCRIPTIONS = {
  name: 'Nom public du compte Instagram.',
  username: 'Identifiant public du compte.',
  profile_picture_url: 'URL de la photo de profil renvoyée par Instagram.',
  followers_count: 'Nombre actuel d’abonnés.',
  follows_count: 'Nombre de comptes suivis.',
  media_count: 'Nombre de médias publiés sur le compte.',
  biography: 'Biographie du profil.',
  website: 'Lien web configuré sur le profil.',
  id: 'Identifiant Graph du profil Instagram.',
}

const DAY_DESCRIPTIONS = {
  reach: 'Comptes uniques touchés sur la fenêtre demandée.',
  views: 'Nombre de lectures ou affichages des contenus sur la fenêtre.',
  profile_views: 'Vues du profil sur la fenêtre.',
  accounts_engaged: 'Comptes ayant interagi avec le contenu.',
  total_interactions: 'Total des interactions sur la fenêtre.',
  likes: 'J’aime reçus sur la fenêtre.',
  comments: 'Commentaires reçus sur la fenêtre.',
  shares: 'Partages reçus sur la fenêtre.',
  saves: 'Enregistrements reçus sur la fenêtre.',
  replies: 'Réponses reçues sur la fenêtre.',
  website_clicks: 'Clics vers le site web du profil.',
  profile_links_taps: 'Appuis sur les liens du profil.',
  content_views: 'Vues de contenu comptabilisées par Instagram.',
  follows_and_unfollows: 'Variations de follows et unfollows.',
  follower_count: 'Nouveaux followers comptabilisés sur la fenêtre.',
  online_followers: 'Followers en ligne, agrégés sur la fenêtre.',
}

const MEDIA_DESCRIPTIONS = {
  id: 'Identifiant Graph du média.',
  caption: 'Texte de légende du média.',
  media_type: 'Type technique du média.',
  media_product_type: 'Surface Instagram du média.',
  timestamp: 'Date de publication.',
  permalink: 'Lien public vers le média.',
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Non disponible'
  if (typeof value === 'number') return numberFormatter.format(value)
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function breakdownRows(key, detail) {
  const rows = []
  const breakdowns = detail?.breakdowns
  if (!Array.isArray(breakdowns)) return rows

  for (const breakdown of breakdowns) {
    const dimensions = breakdown.dimension_keys || []
    for (const result of breakdown.results || []) {
      const dimensionValue = (result.dimension_values || []).join(' · ')
      rows.push({
        connector: `${key}${dimensionValue ? ` · ${dimensionValue}` : ''}`,
        value: result.value,
        description:
          detail.description ||
          `Répartition ${dimensions.join(', ') || 'démographique'} renvoyée par Instagram.`,
      })
    }
  }
  return rows
}

function buildRows(data) {
  const profileRows = Object.entries(data?.user?.profile || {}).map(([key, value]) => ({
    connector: `GET /{ig-user-id} · fields=${key}`,
    value,
    description: PROFILE_DESCRIPTIONS[key] || 'Champ profil renvoyé par Instagram Graph.',
  }))

  const dayRows = Object.entries(data?.insights_period_day_details || {}).map(
    ([key, detail]) => ({
      connector: `GET /{ig-user-id}/insights · metric=${key} · period=day`,
      value: detail.value,
      description: detail.description || DAY_DESCRIPTIONS[key] || 'Insight journalier Instagram Graph.',
      error: detail.error,
    }),
  )

  const lifetimeRows = Object.entries(data?.insights_period_lifetime_details || {}).flatMap(
    ([key, detail]) => {
      const rows = breakdownRows(key, detail)
      if (rows.length) return rows
      return [
        {
          connector: `GET /{ig-user-id}/insights · ${key}`,
          value: detail.value,
          description: detail.description || 'Insight lifetime Instagram Graph.',
          error: detail.error,
        },
      ]
    },
  )

  const mediaRows = (data?.media_first_page?.items || []).flatMap((item, index) =>
    Object.entries(item).map(([key, value]) => ({
      connector: `GET /{ig-user-id}/media · item ${index + 1} · fields=${key}`,
      value,
      description: MEDIA_DESCRIPTIONS[key] || 'Champ média renvoyé par Instagram Graph.',
    })),
  )

  return { profileRows, dayRows, lifetimeRows, mediaRows }
}

function DataTable({ title, rows }) {
  return (
    <section className="insights-section">
      <div className="insights-section__head">
        <h2>{title}</h2>
        <span>{numberFormatter.format(rows.length)} lignes</span>
      </div>
      <div className="insights-table-wrap">
        <table className="insights-table">
          <thead>
            <tr>
              <th>Connecteur API</th>
              <th>Valeur renvoyée</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.connector}-${index}`} className={row.error ? 'is-error' : ''}>
                <td>
                  <code>{row.connector}</code>
                </td>
                <td>{row.error ? `Erreur : ${row.error}` : formatValue(row.value)}</td>
                <td>{row.description}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan="3">Aucune donnée renvoyée.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Insights() {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    document.title = 'Insights Instagram — Gaby Crolage'
    let cancelled = false

    fetch('/api/instagram?action=insights')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (!data.ok) {
          setState({ loading: false, data: null, error: data.error || 'API indisponible' })
          return
        }
        setState({ loading: false, data, error: null })
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, data: null, error: 'Requête impossible.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => buildRows(state.data), [state.data])
  const totalRows =
    rows.profileRows.length + rows.dayRows.length + rows.lifetimeRows.length + rows.mediaRows.length

  return (
    <main className="insights-page">
      <header className="insights-hero">
        <Link to="/" className="insights-back">
          Accueil
        </Link>
        <p className="insights-kicker">Instagram Graph API</p>
        <h1>Insights</h1>
        <p className="insights-lead">
          Données récupérées directement avec les identifiants API configurés côté serveur, pour repérer ce
          qui peut remplacer une saisie manuelle dans le media kit.
        </p>
        <dl className="insights-summary">
          <div>
            <dt>Statut</dt>
            <dd>{state.loading ? 'Chargement' : state.error ? 'Erreur' : 'Connecté'}</dd>
          </div>
          <div>
            <dt>Lignes exploitables</dt>
            <dd>{numberFormatter.format(totalRows)}</dd>
          </div>
          <div>
            <dt>Récupération</dt>
            <dd>{state.data?.fetchedAt ? new Date(state.data.fetchedAt).toLocaleString('fr-FR') : '—'}</dd>
          </div>
        </dl>
      </header>

      {state.error ? <p className="insights-alert">{state.error}</p> : null}
      {state.loading ? <p className="insights-loading">Chargement des données Instagram…</p> : null}

      {!state.loading && !state.error ? (
        <>
          <DataTable title="Profil" rows={rows.profileRows} />
          <DataTable title="Insights 30 jours" rows={rows.dayRows} />
          <DataTable title="Démographies lifetime" rows={rows.lifetimeRows} />
          <DataTable title="Médias récents" rows={rows.mediaRows} />
        </>
      ) : null}
    </main>
  )
}
