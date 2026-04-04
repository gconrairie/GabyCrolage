import { Fragment } from 'react'

/** Données éditables à la main — snapshot media kit */
export const MEDIA_KIT = {
  meta: {
    lastUpdated: '2026-04-04',
  },
  hero: {
    tag: 'Media Kit',
    year: '2026',
    eyebrow: 'Instagram · Humour · Contenu viral',
    nameLine1: 'Gaby',
    nameLine2: 'Crolage',
    roles: ['Comédien', 'Humoriste', 'Créateur'],
    stats: [
      { value: '10,2K', label: 'Abonnés' },
      { value: '683K', label: 'Vues / 30 jours' },
      { value: '4,5M', label: 'Best reel' },
    ],
  },
  performances: {
    cells: [
      {
        featured: true,
        value: '683,1K',
        label: 'Vues totales · 30 derniers jours',
        sub: '5 mars – 3 avril 2026',
      },
      {
        value: '60,6K',
        label: 'Interactions',
        sub: "≈ 8,9% taux d'interaction",
      },
      {
        value: '10,2K',
        label: 'Abonnés',
        sub: '+4,6% en 30 jours',
      },
    ],
  },
  bio: {
    lead: (
      <Fragment>
        Je suis Gaby Crolage, comédien et humoriste basé en France. Sur Instagram, je partage mon regard décalé
        sur le quotidien à travers des reels humoristiques qui trouvent un écho immédiat auprès de mon audience.{' '}
        <strong>
          Mon contenu, ancré dans des situations universelles et authentiques, génère une viralité organique
          exceptionnelle
        </strong>{' '}
        — mes meilleurs reels atteignent plusieurs millions de vues avec 99% de diffusion hors abonnés, signe
        d&apos;un algorithme qui pousse massivement le contenu au-delà de ma communauté.
      </Fragment>
    ),
  },
  audience: {
    insight:
      "64,6% de l'audience est âgée de 35 à 64 ans — un profil avec fort pouvoir d'achat, idéal pour les marques premium.",
    gender: { men: 55.1, women: 44.9 },
  },
  contact: {
    email: 'contact@gabycrolage.com',
    instagram: '@gabycrolage',
  },
}

/** Liste des reels à analyser — uniquement titre (rappel éditorial) + identifiant média (shortcode ou ID Graph) */
export const REELS = [
  {
    title: 'Asalato',
    id: 'DTU8uR4DOgh',
  },
  {
    title: 'Les disciplines à partager avec son chien',
    id: 'DNSW6CnMYug',
  },
  {
    title: 'La grosse angine',
    id: 'DPUBC_RDI4k',
  },
  {
    title: 'Slap !',
    id: 'DTm7SEsDMGN',
  },
  {
    title: 'Le dictateur',
    id: 'DNFcLonM-5R',
  },
]

export const AGE_BARS = [
  { label: '45–54', width: '100%', delay: '0.1s', pct: 24.3 },
  { label: '35–44', width: '86%', delay: '0.2s', pct: 21.0 },
  { label: '55–64', width: '79%', delay: '0.3s', pct: 19.3 },
  { label: '25–34', width: '65%', delay: '0.4s', pct: 15.9 },
  { label: '65+', width: '42%', delay: '0.5s', pct: 10.2 },
  { label: '18–24', width: '28%', delay: '0.6s', pct: 6.9 },
]

/** [ville, part d’audience %] — valeurs numériques, affichage via formatPercent2 */
export const CITIES = [
  ['Paris', 1.3],
  ['Toulouse', 0.7],
  ['Marseille', 0.6],
  ['Lyon', 0.5],
  ['Limoux', 0.5],
]

export const OFFERS = [
  {
    type: 'Format 01',
    title: 'Placement Produit',
    price: '150€ – 300€',
    desc: 'Intégration naturelle et authentique dans un reel existant.',
    features: ['Mention naturelle du produit', 'Format non intrusif', 'Story de relais incluse', 'Rapport sous 7 jours'],
  },
  {
    type: 'Format 02 — Recommandé',
    title: 'Reel Sponsorisé',
    price: '300€ – 500€',
    desc: 'Contenu humoristique dédié, co-construit avec votre marque.',
    features: ['Reel dédié à votre produit', 'Scénario co-construit', '2 révisions incluses', 'Rapport complet performances'],
    highlight: true,
  },
  {
    type: 'Format 03',
    title: 'UGC — Contenu Marque',
    price: '200€ – 400€',
    desc: 'Vidéo créée pour vos propres canaux, non publiée sur mon compte si souhaité.',
    features: [
      'Livraison brute ou montée',
      "Droits d'utilisation cédés",
      'Idéal Meta / TikTok Ads',
      'Devis personnalisé',
    ],
  },
  {
    type: 'Format 04',
    title: 'Partenariat Dotation',
    price: 'Échange produit',
    priceExchange: true,
    desc: "Ouvert à une collaboration rémunérée en matériel, en lieu et place d'une contrepartie financière — idéal pour une première collaboration.",
    features: [
      'Contenu dédié au produit reçu',
      'Authenticité maximale garantie',
      'Format flexible selon le produit',
      'Modalités à définir ensemble',
    ],
    dotation: true,
  },
]
