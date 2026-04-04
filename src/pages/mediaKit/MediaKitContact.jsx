import SectionHead from './SectionHead'

export default function MediaKitContact({ contact }) {
  return (
    <section className="mkit-sec mkit-sec--contact" aria-labelledby="sec-contact">
      <SectionHead n="07" title="Contact" subtitle="Échanges & briefs" />
      <div className="mkit-contact" id="sec-contact">
        <a className="mkit-contact__link" href={`mailto:${contact.email}`}>
          <span className="mkit-contact__lbl">Email</span>
          <span className="mkit-contact__val">{contact.email}</span>
        </a>
        <div className="mkit-contact__link mkit-contact__link--static">
            <span className="mkit-contact__lbl">Instagram</span>
          <a href={`https://www.instagram.com/gabycrolage`} target="_blank" rel="noopener noreferrer">
            <span className="mkit-contact__val">{contact.instagram}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
