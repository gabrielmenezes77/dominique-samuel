/**
 * BotanicalDivider
 *
 * Decorative SVG vine/leaf separator used between page sections.
 * Used twice in the As-Is: between MessageSection and CountdownSection,
 * and between CountdownSection and RSVPSection.
 *
 * As-Is reference:
 *   <div class="divider-wrap"> + <svg class="botanical-divider"> in
 *   webapp/index.html
 *   .divider-wrap, .botanical-divider in webapp/assets/style.css
 *
 * GSAP targets `.botanical-divider` by string selector, so the SVG carries
 * both the CSS Module class (for scoped styles) and the global class
 * `botanical-divider` (for GSAP targeting).
 *
 * Requirements: 5.1, 3.9
 */

import styles from "./BotanicalDivider.module.css";

export default function BotanicalDivider() {
  return (
    /* divider-wrap is a global class defined in globals.css */
    <div className="divider-wrap">
      <svg
        className={`${styles.botanicalDivider} botanical-divider`}
        viewBox="0 0 280 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="0"
          y1="11"
          x2="96"
          y2="11"
          stroke="#6E7E6B"
          strokeWidth="0.7"
        />
        <line
          x1="184"
          y1="11"
          x2="280"
          y2="11"
          stroke="#6E7E6B"
          strokeWidth="0.7"
        />
        {/* vine */}
        <path
          d="M97 11 Q105 3 113 11 Q121 19 129 11 Q137 3 145 11 Q153 19 161 11 Q169 3 177 11 Q185 19 183 11"
          stroke="#8A9E55"
          strokeWidth="0.9"
          fill="none"
        />
        {/* centre leaf */}
        <path
          d="M137 7 Q140 2 143 7"
          stroke="#5C6B2E"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="140" cy="11" r="1.2" fill="#5C6B2E" opacity="0.55" />
      </svg>
    </div>
  );
}
