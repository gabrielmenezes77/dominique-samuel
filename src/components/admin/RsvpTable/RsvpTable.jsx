import {
  confirmationLabel,
  formatDateTime,
  fullName,
} from "../../../models/rsvp/rsvpMappers";
import styles from "./RsvpTable.module.css";

export default function RsvpTable({ items, onDelete, onEdit, onView }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        Nenhum RSVP encontrado para a pagina carregada.
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Status</th>
            <th>Acomp.</th>
            <th>Pessoas</th>
            <th>Criado</th>
            <th>Atualizado</th>
            <th>Envios</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.rsvpId}>
              <td data-label="Nome">{fullName(item) || "-"}</td>
              <td data-label="Email">{item.email}</td>
              <td data-label="Status">
                <span className={`${styles.badge} ${styles[item.confirmacao]}`}>
                  {confirmationLabel(item.confirmacao)}
                </span>
              </td>
              <td data-label="Acomp.">{item.acompanhantes}</td>
              <td data-label="Pessoas">{item.attendeeCount}</td>
              <td data-label="Criado">{formatDateTime(item.createdAt)}</td>
              <td data-label="Atualizado">{formatDateTime(item.updatedAt)}</td>
              <td data-label="Envios">{item.submissionCount}</td>
              <td data-label="Acoes">
                <div className={styles.actions}>
                  <button type="button" onClick={() => onView(item)}>
                    Ver
                  </button>
                  <button type="button" onClick={() => onEdit(item)}>
                    Editar
                  </button>
                  <button
                    className={styles.danger}
                    type="button"
                    onClick={() => onDelete(item)}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
