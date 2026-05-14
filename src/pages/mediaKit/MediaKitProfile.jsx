import SectionHead from './SectionHead'

function RichText({ segments }) {
  return segments.map((segment, index) =>
    segment.strong ? <strong key={index}>{segment.text}</strong> : segment.text,
  )
}

export default function MediaKitProfile({ copy }) {
  const { section, tagline, bio } = copy

  return (
    <section className="mkit-sec mkit-sec--profile" aria-labelledby="sec-profil">
      <SectionHead n={section.number} title={section.title} subtitle={section.subtitle} />
      <div className="mkit-sec-body mkit-sec-body--split">
        <p className="mkit-tagline" id="sec-profil">
          {tagline.before}
          <em>{tagline.emphasis}</em>
          {tagline.after}
        </p>
        <div className="mkit-prose">
          <p>
            <RichText segments={bio} />
          </p>
        </div>
      </div>
    </section>
  )
}
