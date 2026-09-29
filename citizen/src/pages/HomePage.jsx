import { Hero } from "../components/home/Hero";
import { ServiceGrid } from "../components/home/ServiceGrid";
import { SchemesGrid } from "../components/home/SchemesGrid";
import { Stats } from "../components/home/Stats";
import { ChannelCards } from "../components/home/ChannelCards";
import { TrustStrip } from "../components/home/TrustStrip";
import Banners from "../components/home/banners";
// import { OfflineBand } from '../components/home/OfflineBand';
// import { WhatsAppBand } from '../components/home/WhatsAppBand';
import { Steps } from "../components/home/Steps";
import { Faq } from "../components/home/Faq";
import { CtaBand } from "../components/home/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ChannelCards />
      <SchemesGrid />
      

      <Banners />
      
      <Faq />
      <CtaBand />
    </>
  );
}
