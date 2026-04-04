import SectionHead from './SectionHead'

export default function MediaKitOffers({ offers }) {
  return (
    <section className="mkit-sec" aria-labelledby="sec-offers">
      <SectionHead n="06" title="Partenariats" subtitle="Formats & tarifs indicatifs" />
      <ul className="mkit-offers" id="sec-offers">
        {offers.map((offer) => (
          <li
            key={offer.type}
            className={`mkit-offer${offer.highlight ? ' mkit-offer--featured' : ''}${offer.dotation ? ' mkit-offer--dash' : ''}`}
          >
            <div className="mkit-offer__head">
              <span className="mkit-offer__type">{offer.type}</span>
              <h3 className="mkit-offer__title">{offer.title}</h3>
              <p className={`mkit-offer__price${offer.priceExchange ? ' mkit-offer__price--alt' : ''}`}>
                {offer.price}
              </p>
            </div>
            <p className="mkit-offer__desc">{offer.desc}</p>
            <ul className="mkit-offer__list">
              {offer.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mkit-legal">Tarifs indicatifs · Pack multi-contenus négociable</p>
    </section>
  )
}
