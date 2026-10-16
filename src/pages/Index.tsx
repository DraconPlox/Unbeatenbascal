import { ChangelogSection } from '../components/ChangelogSection'

const CLAN_URL = 'https://aredl.net/profile/clan/146a7fb4-a87a-42db-9795-3d46d3c74c8b'

export function Index() {
  return (
    <div className="home-page">
      <header className="home-hero">
        <span className="home-badge">Clan JEWBASCAL</span>
        <h1 className="home-title">UnbeatenBascal</h1>
        <p className="home-tagline">
          La página del <strong>unbeaten</strong> del clan{' '}
          <a href={CLAN_URL} target="_blank" rel="noreferrer">
            JEWBASCAL
          </a>{' '}
          dentro de la All Rated Extreme Demons List (AREDL).
        </p>
      </header>

      <section className="home-intro">
        <h2 className="home-section-title">¿Qué es esto?</h2>
        <p>
          <strong>UnbeatenBascal</strong> reúne en un solo sitio la información de la demonlist de la AREDL
          centrada en el clan <strong>JEWBASCAL</strong>: los niveles, sus posiciones y cómo va evolucionando
          la lista, junto al seguimiento del <em>unbeaten</em> del clan.
        </p>
        <p>
          El acceso es limitado. Para unirse y poder editar se necesita formar parte del clan, aunque la
          información será pública.
        </p>
      </section>

      <ChangelogSection />
    </div>
  )
}
