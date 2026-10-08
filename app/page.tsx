import Hero from "@/components/sections/Hero";
import Benefits from "@/components/sections/Benefits";
import SequenceOverlay from "@/components/sections/SequenceOverlay";
import SectionBreak from "@/components/sections/SectionBreak";
import Introduction from "@/components/sections/Introduction";
import Flavours from "@/components/sections/Flavours";
import HealthBenefits from "@/components/sections/HealthBenefits";
import Reviews from "@/components/sections/Reviews";
import Cta from "@/components/sections/Cta";
import Footer from "@/components/sections/Footer";
import CoconutSequence from "@/components/three/CoconutScene";

export default function Home() {
  return (
    <>
      <main id="main-content" className="flex-1 overflow-x-clip w-full relative">
        {/* one sticky canvas behind Hero → Introduction */}
        <CoconutSequence>
          <Hero />
          <Benefits />
          <SequenceOverlay />
          <SectionBreak />
          <Introduction />
        </CoconutSequence>
        <Flavours />
        <HealthBenefits />
        <Reviews />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
