import { useState } from "react";
import { buildPayload } from "../../utils/rsvpPayload";
import { submitRSVP } from "../../services/rsvpService";
import styles from "./RSVPSection.module.css";

const INITIAL_FORM = {
  nome: "",
  sobrenome: "",
  email: "",
  confirmacao: "",
  acompanhantes: "0",
  obs: "",
};

export default function RSVPSection() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  // type: '' | 'is-success' | 'is-error'
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  /**
   * When confirmacao === 'nao', the acompanhantes select must be disabled and
   * its value forced to '0'. This mirrors the As-Is syncAcompanhantesState().
   */
  const acompanhantesDisabled = form.confirmacao === "nao";

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // When the guest declines, reset acompanhantes to 0 immediately
      if (name === "confirmacao" && value === "nao") {
        next.acompanhantes = "0";
      }

      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ message: "Enviando sua confirmação...", type: "" });

    const payload = buildPayload(form);

    try {
      await submitRSVP(payload);

      setFeedback({
        message:
          payload.confirmacao === "sim"
            ? "Presença confirmada com sucesso."
            : "Resposta registrada com sucesso.",
        type: "is-success",
      });

      setForm(INITIAL_FORM);
    } catch (error) {
      setFeedback({
        message: error.message,
        type: "is-error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Build feedback className: always include base class, append type when set
  const feedbackClassName = [
    styles.rsvpFeedback,
    "ri",
    feedback.type === "is-success" ? styles.isSuccess : "",
    feedback.type === "is-error" ? styles.isError : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="section section-rsvp" id="confirmação-de-presença">
      <span className={`${styles.sEyebrow} ri`}>Reserve sua presença</span>
      <h2 className={`${styles.sTitle} ri`}>Confirmação de Presença</h2>

      <form className={styles.rsvpForm} onSubmit={handleSubmit}>
        {/* Nome + Sobrenome row */}
        <div className={styles.fRow}>
          <div className={`${styles.fGroup} ri`}>
            <label className={styles.fLbl} htmlFor="nome">
              Nome
            </label>
            <input
              className={styles.fField}
              id="nome"
              name="nome"
              type="text"
              placeholder="Seu nome"
              required
              value={form.nome}
              onChange={handleChange}
            />
          </div>

          <div className={`${styles.fGroup} ri`}>
            <label className={styles.fLbl} htmlFor="sobrenome">
              Sobrenome
            </label>
            <input
              className={styles.fField}
              id="sobrenome"
              name="sobrenome"
              type="text"
              placeholder="Seu sobrenome"
              required
              value={form.sobrenome}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Email */}
        <div className={`${styles.fGroup} ri`}>
          <label className={styles.fLbl} htmlFor="email">
            E-mail
          </label>
          <input
            className={styles.fField}
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* Confirmação radio */}
        <div className={`${styles.fGroup} ri`}>
          <span className={styles.fLbl}>Você confirmará presença?</span>
          <div className={styles.radioRow}>
            <label className={styles.radioOpt}>
              <input
                type="radio"
                name="confirmacao"
                value="sim"
                required
                checked={form.confirmacao === "sim"}
                onChange={handleChange}
              />
              <span className={styles.radioTxt}>Sim, estarei lá!</span>
            </label>
            <label className={styles.radioOpt}>
              <input
                type="radio"
                name="confirmacao"
                value="nao"
                checked={form.confirmacao === "nao"}
                onChange={handleChange}
              />
              <span className={styles.radioTxt}>Não poderei ir</span>
            </label>
          </div>
        </div>

        {/* Acompanhantes select */}
        {/* <div className={`${styles.fGroup} ri`}> */}
          {/* <label className={styles.fLbl} htmlFor="acompanhantes"> */}
            {/* Número de acompanhantes */}
          {/* </label> */}
          {/* <div className={styles.fSelectWrap}> */}
            {/* <select */}
              {/* className={styles.fField} */}
              {/* id="acompanhantes" */}
              {/* name="acompanhantes" */}
              {/* value={form.acompanhantes} */}
              {/* disabled={acompanhantesDisabled} */}
              {/* onChange={handleChange} */}
              {/* <option value="0">Apenas eu</option> */}
              {/* <option value="1">1 acompanhante</option> */}
              {/* <option value="2">2 acompanhantes</option> */}
              {/* <option value="3">3 acompanhantes</option> */}
              {/* <option value="4">4 acompanhantes</option> */}
              {/* <option value="5">5 acompanhantes</option> */}
            {/* </select> */}
          {/* </div> */}
        {/* </div> */}

        {/* Mensagem */}
        <div className={`${styles.fGroup} ri`}>
          <label className={styles.fLbl} htmlFor="obs">
             Mensagem para o casal
          </label>
          <textarea
            className={styles.fField}
            id="obs"
            name="obs"
            maxLength={1000}
            placeholder="Digite aqui"
            value={form.obs}
            onChange={handleChange}
          />
        </div>

        {/* Submit */}
        <button
          className={`${styles.btnConfirm} ri`}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Enviando..." : "Confirmar Presença"}
        </button>

        {/* Feedback */}
        <p className={feedbackClassName} role="status" aria-live="polite">
          {feedback.message}
        </p>

        <p className={`${styles.rsvpNote} ri`}>
          Em breve você receberá mais informações sobre o evento.
        </p>
      </form>
    </section>
  );
}
