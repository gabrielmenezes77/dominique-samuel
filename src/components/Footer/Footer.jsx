/**
 * Footer
 *
 * Page footer with the DS monogram, couple names, wedding date, and
 * a Bible verse.
 *
 * As-Is reference:
 *   <footer> in webapp/index.html
 *   footer, .footer-mono, .footer-names, .footer-date, .footer-love
 *   in webapp/assets/style.css
 *
 * The `.ri` global class is applied to each animatable element so GSAP
 * ScrollTrigger can target them by string selector for reveal animations.
 * The LogoMark also receives the module class for margin/opacity control.
 *
 * Requirements: 5.1, 6.1
 */

import LogoMark from "../LogoMark";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* DS monogram — 88×58 matches As-Is .footer-mono dimensions */}
      <LogoMark
        width={88}
        height={58}
        color="var(--olive)"
        className={`${styles.footerMono} ri`}
      />

      <p className={`${styles.footerNames} ri`}>Dominique &amp; Samuel</p>

      <p className={`${styles.footerDate} ri`}>20 de Junho de 2026</p>

      <p className={`${styles.footerLove} ri`}>
        Gênesis 2:24: &ldquo;Por essa razão, o homem deixará pai e mãe e se
        unirá à sua mulher, e eles se tornarão uma só carne.&rdquo;
      </p>
    </footer>
  );
}
