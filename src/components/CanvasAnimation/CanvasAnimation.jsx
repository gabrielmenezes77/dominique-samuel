import useCanvasAnimation from "../../hooks/useCanvasAnimation";
import styles from "./CanvasAnimation.module.css";

/**
 * CanvasAnimation renders the fixed canvas layer and the scroll spacer.
 * The canvas is driven by useCanvasAnimation which handles frame loading,
 * Lenis smooth scroll, and all GSAP ScrollTrigger instances.
 *
 * The #video-spacer id is required — GSAP ScrollTrigger targets it by ID.
 *
 * @param {function} onLoaded - Called after Phase 1 (12 frames) completes
 * @param {function} onProgress - Called with progress (0–1) as frames load
 * @param {function} setHintVisible - Called to show/hide the scroll hint
 * @param {function} setHeaderScrolled - Called to toggle the header scrolled state
 * @param {object}   lenisRef - Optional external ref; when provided, the Lenis
 *                              instance is stored here so the parent (App.jsx)
 *                              can call lenis.scrollTo() for anchor navigation.
 */
export default function CanvasAnimation({
  onLoaded,
  onProgress,
  setHintVisible,
  setHeaderScrolled,
  lenisRef,
}) {
  const { canvasRef } = useCanvasAnimation({
    onLoaded,
    onProgress,
    setHintVisible,
    setHeaderScrolled,
    lenisRef,
  });

  return (
    <>
      <div id="canvas-wrap" className={styles.canvasWrap}>
        <canvas ref={canvasRef} id="canvas" className={styles.canvas} />
      </div>
      <div id="video-spacer" className={styles.videoSpacer} />
    </>
  );
}
