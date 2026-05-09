import SectionHead from './SectionHead'

export default function MediaKitProfile() {
  return (
    <section className="mkit-sec mkit-sec--profile" aria-labelledby="sec-profil">
      <SectionHead n="01" title="Profil" subtitle="Positionnement & ligne éditoriale" />
      <div className="mkit-sec-body mkit-sec-body--split">
        <p className="mkit-tagline" id="sec-profil">
          Comédien, <em>humoriste</em> &amp; créateur.
        </p>
        <div className="mkit-prose">
          <p>Je suis Gaby Crolage, comédien et humoriste basé en France.
            Sur Instagram, je partage des <strong>reels humoristiques inspirés du quotidien</strong>, avec un regard décalé et accessible.
            Mon contenu aborde des situations simples et universelles qui parlent facilement au public et suscitent régulièrement de belles interactions.
            Certains reels ont atteint <strong>plusieurs millions de vues</strong>  et sont majoritairement diffusés en dehors de ma communauté, ce qui me permet de toucher une audience large de manière naturelle.
          </p>
        </div>
      </div>
    </section>
  )
}
