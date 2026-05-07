/**
 * MessageSection
 *
 * Welcome message section — the first content section after the canvas
 * animation spacer. Contains the section eyebrow and the invitation text.
 *
 * As-Is reference:
 *   <section class="section section-mensagem" id="mensagem-inicial"> in
 *   webapp/index.html
 *   .mensagem-assin, .mensagem-text in webapp/assets/style.css
 *
 * The `.ri` global class is applied to each animatable element so GSAP
 * ScrollTrigger can target them by string selector for reveal animations.
 *
 * Requirements: 5.1
 */

import styles from "./MessageSection.module.css";

export default function MessageSection() {
  return (
    <section className="section section-mensagem" id="mensagem-inicial">
      {/* Section eyebrow — GSAP reveal target via .ri global class */}
      <p className={`${styles.mensagemAssin} ri`}>MENSAGEM INICIAL</p>

      {/* Invitation body text — GSAP reveal target via .ri global class */}
      <p className={`${styles.mensagemText} ri`}>
        Com o coração transbordando de alegria,
        <br />
        convidamos você a ser parte de um momento
        <br />
        que aguardamos há tanto tempo —<br />o início de uma nova história
        juntos.
      </p>
    </section>
  );
}
