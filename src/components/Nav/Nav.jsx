/**
 * Nav
 *
 * Renders the fixed site header (with scrolled frosted-glass state) and the
 * pill-link navigation bar.
 *
 * As-Is reference:
 *   - <nav> in webapp/index.html — four anchor/external links
 *   - .site-header in webapp/assets/style.css — fixed header that never
 *     received .scrolled in the As-Is because #site-header did not exist in
 *     the HTML (bug). The To-Be fixes this via the `scrolled` prop.
 *
 * Props:
 *   scrolled      {boolean}  — when true, applies frosted-glass header styles
 *   onAnchorClick {function} — optional; called with the href string when an
 *                              internal anchor link is clicked. If provided,
 *                              default navigation is prevented so the caller
 *                              (e.g. Lenis) can handle smooth scrolling.
 *
 * Requirements: 5.1, 6.1, 6.4, 8.2, 14.2, 15.2
 */

import LogoMark from "../LogoMark/LogoMark.jsx";
import styles from "./Nav.module.css";

export default function Nav({ scrolled = false, onAnchorClick }) {
  /**
   * Handle clicks on internal anchor links.
   * Delegates to `onAnchorClick` when provided so Lenis can take over
   * smooth scrolling (Requirement 8.1 / 8.2).
   */
  function handleAnchor(e) {
    if (onAnchorClick) {
      e.preventDefault();
      onAnchorClick(e.currentTarget.getAttribute("href"));
    }
  }

  return (
    <>
      {/* Fixed site header — receives scrolled state to apply frosted-glass
          effect. This fixes the As-Is bug where .scrolled never fired. */}
      <header
        className={`${styles.siteHeader}${scrolled ? ` ${styles.scrolled}` : ""}`}
      >
        <div className={styles.siteHeaderInner}>
          {/* LogoMark is hidden on mobile via CSS (.siteHeaderName display:none
              at ≤767px; the logo itself is hidden via the same breakpoint rule
              in the parent inner container centering). */}
          <LogoMark width={32} height={22} />
          <span className={styles.siteHeaderName}>D &amp; S</span>
        </div>
      </header>

      {/* Pill-link navigation bar */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li>
            <a
              href="#mensagem-inicial"
              className={styles.navLink}
              onClick={handleAnchor}
            >
              MENSAGEM INICIAL
            </a>
          </li>
          <li>
            <a
              href="#contagem-regressiva"
              className={styles.navLink}
              onClick={handleAnchor}
            >
              CONTAGEM REGRESSIVA
            </a>
          </li>
          <li>
            <a
              href="#confirmação-de-presença"
              className={styles.navLink}
              onClick={handleAnchor}
            >
              CONFIRMAÇÃO DE PRESENÇA
            </a>
          </li>
          <li>
            {/* External link — target="_blank" with rel="noopener noreferrer"
                per security requirements (Requirement 14.2). */}
            <a
              href="https://wa.me/5522999105995?text=Ol%C3%A1!%20Vim%20pela%20lista%20de%20presentes%20do%20casamento%20de%20Dominique%20e%20Samuel."
              className={styles.navLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              LISTA DE PRESENTES
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
