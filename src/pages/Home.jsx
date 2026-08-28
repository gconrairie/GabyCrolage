import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faFacebook, faYoutube, faTiktok, faThreads } from '@fortawesome/free-brands-svg-icons'
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
    href:  'https://tiktok.com/@_gabycrolage',
    icon:  faTiktok,
    label: 'TikTok',
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
    href: 'https://www.threads.com/@gabycrolage?igshid=NTc4MTIwNjQ2YQ==',
    icon: faThreads,
    label: 'Threads',
  }
]

export default function Home() {
  const [reels, setReels] = useState([])

  useEffect(() => {
    document.title = 'Gabycrolage'

    fetch('/data/most-viewed.json')
      .then(r => r.json())
      .then(setReels)
      .catch(() => {})

  }, [])

  return (
    <div className="home">

      <div className="home-content">
        {/* Hero */}
        <div className="home-hero">
          <div
            className="home-hero-avatar"
            role="img"
            aria-label="Gabycrolage"
          />
          {/* <div className="home-hero-gradient" /> */}
        </div>

        {/* Profil */}
        <div className="home-profile">
          <h1 className="home-profile-name">Gabycrolage</h1>
          {/* <p className="home-profile-desc">Comédien · Humoriste · Créateur</p> */}
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
      </div>

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
