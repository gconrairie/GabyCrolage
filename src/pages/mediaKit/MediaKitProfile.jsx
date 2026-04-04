import SectionHead from './SectionHead'
import { MEDIA_KIT } from './data'

export default function MediaKitProfile() {
  return (
    <section className="mkit-sec mkit-sec--profile" aria-labelledby="sec-profil">
      <SectionHead n="01" title="Profil" subtitle="Positionnement & ligne éditoriale" />
      <div className="mkit-sec-body mkit-sec-body--split">
        <p className="mkit-tagline" id="sec-profil">
          Comédien, <em>humoriste</em> &amp; créateur.
        </p>
        <div className="mkit-prose">{MEDIA_KIT.bio.lead}</div>
      </div>
    </section>
  )
}
