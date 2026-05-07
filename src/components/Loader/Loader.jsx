/**
 * Loader
 *
 * Full-screen loading overlay shown while canvas frames are preloading.
 * Displays the DS logo mark with a breathing animation, a progress bar,
 * and a "carregando…" caption.
 *
 * As-Is reference:
 *   <div id="loader"> in webapp/index.html
 *   #loader, .loader-logo, .loader-track, #loader-bar, .loader-caption
 *   in webapp/assets/style.css
 *
 * Props:
 *   progress  {number}  — 0 to 1; controls loader-bar width
 *   hidden    {boolean} — when true, applies opacity:0 + pointer-events:none
 *
 * Requirements: 5.1, 3.1
 */

import LogoMark from "../LogoMark/LogoMark.jsx";
import styles from "./Loader.module.css";

export default function Loader({ progress = 0, hidden = false }) {
  const barWidth = Math.round(progress * 100) + "%";

  return (
    <div className={`${styles.loader}${hidden ? ` ${styles.hidden}` : ""}`}>
      {/* DS logo mark with breathing animation */}
      <LogoMark
        width={88}
        height={58}
        color="var(--olive)"
        className={styles.loaderLogo}
      />

      {/* Progress track */}
      <div className={styles.loaderTrack}>
        <div className={styles.loaderBar} style={{ width: barWidth }} />
      </div>

      {/* Caption */}
      <span className={styles.loaderCaption}>carregando…</span>
    </div>
  );
}
