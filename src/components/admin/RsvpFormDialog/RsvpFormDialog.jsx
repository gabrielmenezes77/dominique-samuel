import { useEffect, useState } from "react";
import { fullName } from "../../../models/rsvp/rsvpMappers";
import { ValidationError } from "../../../models/rsvp/rsvpValidators";
import styles from "./RsvpFormDialog.module.css";

const EMPTY_VALUES = {
  nome: "",
  sobrenome: "",
  email: "",
  confirmacao: "sim",
  acompanhantes: 0,
  obs: "",
};

function valuesFromRecord(record) {
  if (!record) {
    return EMPTY_VALUES;
  }

  return {
    nome: record.nome,
    sobrenome: record.sobrenome,
    email: record.email,
    confirmacao: record.confirmacao,
    acompanhantes: record.acompanhantes,
    obs: record.obs,
  };
}

export default function RsvpFormDialog({
  mode,
  record,
  errors = {},
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(valuesFromRecord(record));
  const [localErrors, setLocalErrors] = useState({});
  const readonly = mode === "view";
  const title =
    mode === "create"
      ? "Novo RSVP"
      : mode === "edit"
        ? `Editar ${fullName(record)}`
        : `Detalhes de ${fullName(record)}`;

  useEffect(() => {
    setValues(valuesFromRecord(record));
    setLocalErrors({});
  }, [record, mode]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: name === "acompanhantes" ? Number(value) : value,
    }));
    setLocalErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (readonly) {
      onClose();
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ValidationError) {
        setLocalErrors(error.errors);
      }
    }
  }

  const mergedErrors = { ...errors, ...localErrors };

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-dialog-title"
      >
        <header className={styles.header}>
          <h2 id="rsvp-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            Fechar
          </button>
        </header>

        {mergedErrors.form ? (
          <p className={styles.formError} role="alert">
            {mergedErrors.form}
          </p>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Nome</span>
            <input
              name="nome"
              value={values.nome}
              onChange={handleChange}
              readOnly={readonly}
            />
            {mergedErrors.nome ? <small>{mergedErrors.nome}</small> : null}
          </label>

          <label>
            <span>Sobrenome</span>
            <input
              name="sobrenome"
              value={values.sobrenome}
              onChange={handleChange}
              readOnly={readonly}
            />
            {mergedErrors.sobrenome ? <small>{mergedErrors.sobrenome}</small> : null}
          </label>

          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              readOnly={readonly || mode === "edit"}
            />
            {mergedErrors.email ? <small>{mergedErrors.email}</small> : null}
          </label>

          <label>
            <span>Status</span>
            <select
              name="confirmacao"
              value={values.confirmacao}
              onChange={handleChange}
              disabled={readonly}
            >
              <option value="sim">Confirmado</option>
              <option value="nao">Nao vai</option>
            </select>
            {mergedErrors.confirmacao ? (
              <small>{mergedErrors.confirmacao}</small>
            ) : null}
          </label>

          <label>
            <span>Acompanhantes</span>
            <input
              name="acompanhantes"
              type="number"
              min="0"
              step="1"
              value={values.acompanhantes}
              onChange={handleChange}
              readOnly={readonly}
            />
            {mergedErrors.acompanhantes ? (
              <small>{mergedErrors.acompanhantes}</small>
            ) : null}
          </label>

          <label className={styles.full}>
            <span>Observacao</span>
            <textarea
              name="obs"
              value={values.obs}
              onChange={handleChange}
              readOnly={readonly}
              rows={4}
            />
          </label>

          {record && mode === "view" ? (
            <dl className={styles.meta}>
              <div>
                <dt>RSVP ID</dt>
                <dd>{record.rsvpId}</dd>
              </div>
              <div>
                <dt>Total de pessoas</dt>
                <dd>{record.attendeeCount}</dd>
              </div>
              <div>
                <dt>Envios</dt>
                <dd>{record.submissionCount}</dd>
              </div>
            </dl>
          ) : null}

          <div className={styles.footer}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.primary} type="submit" disabled={isSubmitting}>
              {readonly ? "Ok" : isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
