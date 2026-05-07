import { useState, useCallback, useRef } from "react";
import useScrollState from "./hooks/useScrollState";
import Loader from "./components/Loader";
import Nav from "./components/Nav";
import CanvasAnimation from "./components/CanvasAnimation";
import ScrollHint from "./components/ScrollHint";
import MessageSection from "./components/MessageSection";
import BotanicalDivider from "./components/BotanicalDivider";
import CountdownSection from "./components/CountdownSection";
import RSVPSection from "./components/RSVPSection";
import Footer from "./components/Footer";

export default function App() {
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const { hintVisible, headerScrolled, setHintVisible, setHeaderScrolled } =
    useScrollState();

  const lenisRef = useRef(null);

  const handleLoaded = useCallback(() => {
    setLoaderHidden(true);
    // Show scroll hint 600ms after loader hides (matches As-Is behavior)
    setTimeout(() => setHintVisible(true), 600);
  }, [setHintVisible]);

  const handleProgress = useCallback((progress) => {
    setLoaderProgress(progress);
  }, []);

  function handleAnchorClick(href) {
    if (lenisRef.current) {
      // Lenis accepts CSS selectors — smooth scroll via the active Lenis instance
      lenisRef.current.scrollTo(href);
    } else {
      // Fallback: Lenis not yet initialized (e.g. before Phase 1 completes)
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      <Loader progress={loaderProgress} hidden={loaderHidden} />
      <Nav scrolled={headerScrolled} onAnchorClick={handleAnchorClick} />
      <CanvasAnimation
        onLoaded={handleLoaded}
        onProgress={handleProgress}
        setHintVisible={setHintVisible}
        setHeaderScrolled={setHeaderScrolled}
        lenisRef={lenisRef}
      />
      <ScrollHint visible={hintVisible} />
      <main className="page-content">
        <MessageSection />
        <BotanicalDivider />
        <CountdownSection />
        <BotanicalDivider />
        <RSVPSection />
        <Footer />
      </main>
    </>
  );
}
