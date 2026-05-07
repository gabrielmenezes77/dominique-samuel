/**
 * ScrollHint
 *
 * Fixed overlay shown after the loader hides, prompting the user to scroll.
 * Fades in when `visible` is true and fades out when false.
 *
 * As-Is reference:
 *   <div id="scroll-hint"> in webapp/index.html
 *   #scroll-hint, .hint-lbl, .hint-chevron in webapp/assets/style.css
 *
 * Props:
 *   visible  {boolean}  — when true, applies opacity:1 via .visible class
 *
 * Requirements: 5.1, 3.3
 */

import styles from "./ScrollHint.module.css";

export default function ScrollHint({ visible = false }) {
  return (
    <div
      className={`${styles.scrollHint}${visible ? ` ${styles.visible}` : ""}`}
    >
      <span className={styles.hintLbl}>Role para descobrir</span>
      <div className={styles.hintChevron} />
    </div>
  );
}
