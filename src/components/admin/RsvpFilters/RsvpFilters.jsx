import styles from "./RsvpFilters.module.css";

const SORT_LABELS = {
  "updatedAt:desc": "Atualizados recentemente",
  "createdAt:desc": "Criados recentemente",
  "nome:asc": "Nome A-Z",
  "email:asc": "Email A-Z",
  "confirmacao:asc": "Status",
  "attendeeCount:desc": "Mais pessoas",
  "submissionCount:desc": "Mais envios",
};

export default function RsvpFilters({
  limit,
  onCreate,
  onLimitChange,
  onSearchChange,
  onSortChange,
  onStatusChange,
  search,
  sort,
  status,
}) {
  return (
    <section className={styles.toolbar} aria-label="Filtros de RSVP">
      <label className={styles.field}>
        <span>Busca</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nome, email ou mensagem"
        />
      </label>

      <label className={styles.field}>
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="ATTENDING">Confirmados</option>
          <option value="DECLINED">Nao vao</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Ordenar</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Pagina</span>
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>

      <button className={styles.createButton} type="button" onClick={onCreate}>
        Novo RSVP
      </button>
    </section>
  );
}
