import { MotionConfig } from 'framer-motion'
import { Header, Loader } from './components/chrome'
import { MobileDock } from './components/MobileDock'
import { useSiteData } from './content/useSiteData'
import { I18nProvider } from './i18n/I18n'
import { AboutJourney, Activities, Certificates, Contact, Dance, Footer, GallerySkills, Hero, Services } from './site/Sections'

export default function App() {
  const data = useSiteData()
  const s = data.settings
  return (
    <I18nProvider overrides={data.translations}>
      <MotionConfig reducedMotion="user">
        <Loader />
        <Header email={s.email} instagram={s.instagram} whatsapp={s.whatsapp} />
        <main id="main" className="hero-bg">
          <Hero data={data} />
          <AboutJourney data={data} />
          <Services data={data} />
          <Activities />
          <Dance data={data} />
          <GallerySkills data={data} />
          <Certificates data={data} />
          <Contact data={data} />
        </main>
        <Footer data={data} />
        <MobileDock />
      </MotionConfig>
    </I18nProvider>
  )
}
