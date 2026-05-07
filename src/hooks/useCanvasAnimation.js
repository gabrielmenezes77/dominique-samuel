import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { frameSrc } from "../utils/frameSrc";

const FRAME_COUNT_DESKTOP = 90;
const FRAME_COUNT_MOBILE = 50;
const MOBILE_BREAKPOINT = 768;
const BG_COLOR = "#F5F3EE";
const IMAGE_SCALE = 0.88;

export default function useCanvasAnimation({
  onLoaded,
  onProgress,
  setHintVisible,
  setHeaderScrolled,
  lenisRef: externalLenisRef,
}) {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const loadedRef = useRef(0);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(null);
  // Use external ref if provided (so App.jsx can access Lenis), otherwise internal
  const internalLenisRef = useRef(null);
  const lenisRef = externalLenisRef || internalLenisRef;

  useEffect(() => {
    // alive flag: set to false in cleanup to prevent async callbacks (onProgress,
    // onLoaded, RAF) from executing after the component unmounts. Required because
    // React 18 StrictMode intentionally mounts, unmounts, and remounts every
    // component in development. Any new async callback added to this effect MUST
    // check `if (!alive) return` before executing.
    let alive = true;

    // tickerFn: must be stored so gsap.ticker.remove() receives the same object
    // reference that was passed to gsap.ticker.add(). Arrow functions are objects;
    // a new arrow function in cleanup would not match the original.
    let tickerFn = null;

    loadedRef.current = 0;

    gsap.registerPlugin(ScrollTrigger);

    const FRAME_COUNT =
      window.innerWidth < MOBILE_BREAKPOINT
        ? FRAME_COUNT_MOBILE
        : FRAME_COUNT_DESKTOP;

    framesRef.current = new Array(FRAME_COUNT).fill(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(currentFrameRef.current);
    }

    function drawFrame(idx) {
      const img = framesRef.current[idx];
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);
      if (!img) return;
      const sc =
        Math.max(w / img.naturalWidth, h / img.naturalHeight) * IMAGE_SCALE;
      const dw = img.naturalWidth * sc;
      const dh = img.naturalHeight * sc;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    function loadOne(i) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          framesRef.current[i] = img;
          loadedRef.current++;
          if (alive && onProgress) onProgress(loadedRef.current / FRAME_COUNT);
          resolve();
        };
        // Bug fix: onerror must also increment loaded so the loader bar completes
        img.onerror = () => {
          loadedRef.current++;
          if (alive && onProgress) onProgress(loadedRef.current / FRAME_COUNT);
          resolve();
        };
        img.src = frameSrc(i);
      });
    }

    function initLenis() {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      tickerFn = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    function initScroll() {
      const spacer = document.getElementById("video-spacer");
      if (!spacer) return;

      // Frame scrubbing
      ScrollTrigger.create({
        trigger: spacer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate(self) {
          const idx = Math.min(
            Math.floor(self.progress * FRAME_COUNT),
            FRAME_COUNT - 1,
          );
          if (idx !== currentFrameRef.current) {
            currentFrameRef.current = idx;
            requestAnimationFrame(() => drawFrame(currentFrameRef.current));
          }
        },
      });

      // Hide scroll hint
      ScrollTrigger.create({
        trigger: spacer,
        start: "top+=80 top",
        onEnter: () => setHintVisible && setHintVisible(false),
        onLeaveBack: () => setHintVisible && setHintVisible(true),
      });

      // Header scrolled state (fixes As-Is bug)
      ScrollTrigger.create({
        trigger: spacer,
        start: "bottom top",
        onEnter: () => setHeaderScrolled && setHeaderScrolled(true),
        onLeaveBack: () => setHeaderScrolled && setHeaderScrolled(false),
      });

      // Section reveals
      const sectionConfig = [
        { sel: ".section-mensagem", stagger: 0.15, y: 38 },
        { sel: ".section-countdown", stagger: 0.12, y: 32 },
        { sel: ".section-rsvp", stagger: 0.08, y: 28 },
        { sel: "footer", stagger: 0.12, y: 24 },
      ];

      sectionConfig.forEach(({ sel, stagger, y }) => {
        const section = document.querySelector(sel);
        if (!section) return;
        const items = section.querySelectorAll(".ri");
        if (!items.length) return;
        gsap.from(items, {
          y,
          opacity: 0,
          duration: 0.95,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        });
      });

      // Botanical dividers
      gsap.utils.toArray(".botanical-divider").forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut",
          transformOrigin: "center center",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        });
      });

      // Recalculate all ScrollTrigger positions after setup
      ScrollTrigger.refresh();
    }

    async function preload() {
      // Phase 1: first 12 frames for fast first paint
      await Promise.all(
        Array.from({ length: Math.min(12, FRAME_COUNT) }, (_, i) => loadOne(i)),
      );

      if (!alive) return;
      drawFrame(0);
      if (onLoaded) onLoaded();

      // Initialize Lenis immediately after Phase 1 so the ticker reference is
      // established synchronously. This ensures cleanup can remove the exact
      // same function reference that was added to gsap.ticker.
      initLenis();

      // RAF: ensures one browser paint/layout cycle completes before GSAP
      // queries scroll positions and element dimensions. rafIdRef stores the
      // RAF ID so cleanup can cancel it and prevent initScroll() from running
      // on a stale lifecycle instance after React StrictMode unmounts.
      rafIdRef.current = requestAnimationFrame(() => {
        if (!alive) return;
        initScroll();
      });

      // Phase 2: rest in background
      for (let i = 12; i < FRAME_COUNT; i++) loadOne(i);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    preload();

    return () => {
      alive = false;
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("resize", resizeCanvas);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (tickerFn) gsap.ticker.remove(tickerFn);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { canvasRef, lenisRef };
}
