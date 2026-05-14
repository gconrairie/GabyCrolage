import SectionHead from './SectionHead'

export default function MediaKitContact({ contact, copy }) {
  const { section } = copy

  return (
    <section className="mkit-sec mkit-sec--contact" aria-labelledby="sec-contact">
      <SectionHead n={section.number} title={section.title} subtitle={section.subtitle} />
      <div className="mkit-contact" id="sec-contact">
        <a className="mkit-contact__link" href={`mailto:${contact.email}`}>
          <span className="mkit-contact__lbl">{copy.emailLabel}</span>
          <span className="mkit-contact__val">{contact.email}</span>
        </a>
        <div className="mkit-contact__link mkit-contact__link--static">
            <span className="mkit-contact__lbl">{copy.instagramLabel}</span>
          <a href={`https://www.instagram.com/gabycrolage`} target="_blank" rel="noopener noreferrer">
            <span className="mkit-contact__val">{contact.instagram}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
