import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faFacebook, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import './Home.css'

const socialLinks = [
  {
    href:  'https://instagram.com/gabycrolage',
    icon:  faInstagram,
    label: 'Instagram',
  },
  {
    href:  'https://facebook.com/gabycrolage.off',
    icon:  faFacebook,
    label: 'Facebook',
  },
  {
    href:  'https://youtube.com/@gabycrolage',
    icon:  faYoutube,
    label: 'YouTube',
  },
  {
    href:  'https://tiktok.com/@_gabycrolage',
    icon:  faTiktok,
    label: 'TikTok',
  },
]

export default function Home() {
  const heroRef   = useRef(null)
  const headerRef = useRef(null)
  const [reels, setReels] = useState([])
  const imgSizes = '(min-width: 900px) 520px, 92vw'
  const imgAlt = 'Gabycrolage'

  useEffect(() => {
    document.title = 'Gabycrolage'

    fetch('/data/most-viewed.json')
      .then(r => r.json())
      .then(setReels)
      .catch(() => {})

    function onScroll() {
      const hero   = heroRef.current
      const header = headerRef.current
      if (!hero || !header) return

      const heroH        = hero.offsetHeight
      const scrollY      = window.scrollY
      const fadeStart    = heroH * 0.35
      const heroOpacity  = Math.max(0, 1 - Math.max(0, scrollY - fadeStart) / (heroH - fadeStart))

      hero.style.opacity = heroOpacity
      header.classList.toggle('is-stuck', scrollY >= heroH)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="home">

      {/* Hero */}
      <div className="home-hero" ref={heroRef}>
        <picture>
          <source
            type="image/avif"
            srcSet={[
              '/assets/images/gabycrolage-256w.avif 256w',
              '/assets/images/gabycrolage-480w.avif 480w',
              '/assets/images/gabycrolage-512w.avif 512w',
              '/assets/images/gabycrolage-768w.avif 768w',
              '/assets/images/gabycrolage-1024w.avif 1024w',
              '/assets/images/gabycrolage-1280w.avif 1280w',
            ].join(', ')}
            sizes={imgSizes}
          />
          <source
            type="image/webp"
            srcSet={[
              '/assets/images/gabycrolage-256w.webp 256w',
              '/assets/images/gabycrolage-480w.webp 480w',
              '/assets/images/gabycrolage-512w.webp 512w',
              '/assets/images/gabycrolage-768w.webp 768w',
              '/assets/images/gabycrolage-1024w.webp 1024w',
              '/assets/images/gabycrolage-1280w.webp 1280w',
            ].join(', ')}
            sizes={imgSizes}
          />
          <img
            src="/assets/images/gabycrolage-768w.webp"
            alt={imgAlt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="home-hero-gradient" />
      </div>

      {/* Sticky header */}
      <header className="home-sticky" ref={headerRef}>
        <picture>
          <source
            type="image/avif"
            srcSet={[
              '/assets/images/gabycrolage-256w.avif 256w',
              '/assets/images/gabycrolage-480w.avif 480w',
              '/assets/images/gabycrolage-512w.avif 512w',
            ].join(', ')}
            sizes="56px"
          />
          <source
            type="image/webp"
            srcSet={[
              '/assets/images/gabycrolage-256w.webp 256w',
              '/assets/images/gabycrolage-480w.webp 480w',
              '/assets/images/gabycrolage-512w.webp 512w',
            ].join(', ')}
            sizes="56px"
          />
          <img
            className="home-sticky-avatar"
            src="/assets/images/gabycrolage-256w.webp"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="home-sticky-info">
          <span className="home-sticky-name">Gabycrolage</span>
          <span className="home-sticky-sub">Content Creator</span>
        </div>
      </header>

      {/* Profil */}
      <div className="home-profile">
        <h1 className="home-profile-name">Gabycrolage</h1>
        <p className="home-profile-desc">Comédien · Humoriste · Créateur</p>
      </div>

      {/* Contenu principal */}
      <main className="home-main">

        {/* Liens réseaux sociaux */}
        <nav className="home-links">
          {socialLinks.map(({ href, icon, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="home-link"
            >
              <FontAwesomeIcon icon={icon} className="home-link-icon" />
              <span className="home-link-label">{label}</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="home-link-arrow" aria-hidden />
            </a>
          ))}

          <div className="home-divider" />

        </nav>

      </main>

      {/* Footer */}
      <footer className="home-footer">
        <a href="mailto:contact@gabycrolage.com" className="home-footer-email">
          <FontAwesomeIcon icon={faEnvelope} />
          <span>contact@gabycrolage.com</span>
        </a>
        <span className="home-footer-copy">© 2026</span>
      </footer>

    </div>
  )
}
