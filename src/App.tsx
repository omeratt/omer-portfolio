import CourtLines from './components/CourtLines';
import Floodlight from './components/Floodlight';
import Header from './components/Header';
import Hero from './sections/Hero';
import Story from './sections/Story';
import Craft from './sections/Craft';
import Work from './sections/Work';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#work">
        Skip to the work
      </a>
      <CourtLines />
      <Header />
      <main id="top">
        <Hero />
        <Story />
        <Craft />
        <Work />
        <Contact />
      </main>
      <Footer />
      <Floodlight />
    </>
  );
}
