/**
 * CountdownSection
 *
 * Live countdown timer section. Ticks every second via useCountdown hook.
 *
 * As-Is reference:
 *   <section class="section section-countdown" id="contagem-regressiva">
 *   in webapp/index.html
 *   .cd-eyebrow, .cd-row, .cd-col, .cd-num, .cd-lbl, .cd-sep in
 *   webapp/assets/style.css
 *
 * Global classes used:
 *   - "section section-countdown" — global section base + countdown variant
 *   - "ri" — GSAP reveal target (applied to eyebrow and each .cd-col)
 *
 * CSS Module classes handle all countdown-specific styling.
 *
 * Requirements: 5.1, 3.4, 9.1
 */

import useCountdown from "../../hooks/useCountdown";
import styles from "./CountdownSection.module.css";

export default function CountdownSection() {
  const { days, hours, mins, secs } = useCountdown("2026-06-20T08:00:00");

  return (
    <section className="section section-countdown" id="contagem-regressiva">
      {/* Eyebrow label — GSAP reveal target via .ri global class */}
      <span className={`${styles.cdEyebrow} ri`}>faltam apenas</span>

      <div className={styles.cdRow}>
        {/* Days */}
        <div className={`${styles.cdCol} ri`}>
          <span className={styles.cdNum}>{days}</span>
          <span className={styles.cdLbl}>dias</span>
        </div>

        <span className={styles.cdSep} aria-hidden="true">
          ·
        </span>

        {/* Hours */}
        <div className={`${styles.cdCol} ri`}>
          <span className={styles.cdNum}>{hours}</span>
          <span className={styles.cdLbl}>horas</span>
        </div>

        <span className={styles.cdSep} aria-hidden="true">
          ·
        </span>

        {/* Minutes */}
        <div className={`${styles.cdCol} ri`}>
          <span className={styles.cdNum}>{mins}</span>
          <span className={styles.cdLbl}>minutos</span>
        </div>

        <span className={styles.cdSep} aria-hidden="true">
          ·
        </span>

        {/* Seconds */}
        <div className={`${styles.cdCol} ri`}>
          <span className={styles.cdNum}>{secs}</span>
          <span className={styles.cdLbl}>segundos</span>
        </div>
      </div>
    </section>
  );
}
