import { fullName } from "../../../models/rsvp/rsvpMappers";
import styles from "./RsvpDeleteDialog.module.css";

export default function RsvpDeleteDialog({
  isSubmitting,
  onClose,
  onConfirm,
  record,
}) {
  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-rsvp-title"
      >
        <h2 id="delete-rsvp-title">Excluir RSVP</h2>
        <p>
          Confirme a exclusao de <strong>{fullName(record)}</strong>. Esta
          acao remove o registro da lista administrativa.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            className={styles.danger}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </section>
    </div>
  );
}
