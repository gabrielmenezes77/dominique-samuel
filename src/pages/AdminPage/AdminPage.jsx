import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RsvpDeleteDialog from "../../components/admin/RsvpDeleteDialog";
import RsvpFilters from "../../components/admin/RsvpFilters";
import RsvpFormDialog from "../../components/admin/RsvpFormDialog";
import RsvpTable from "../../components/admin/RsvpTable";
import useRsvpAdminList from "../../hooks/admin/useRsvpAdminList";
import useRsvpAdminMutations from "../../hooks/admin/useRsvpAdminMutations";
import { useAuth } from "../../hooks/auth/useAuth";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const list = useRsvpAdminList();
  const mutations = useRsvpAdminMutations();
  const [dialog, setDialog] = useState({ mode: null, record: null });

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  function closeDialog() {
    setDialog({ mode: null, record: null });
    mutations.reset();
  }

  async function handleCreate(values) {
    await mutations.createRsvp(values);
    closeDialog();
    await list.refresh();
  }

  async function handleUpdate(values) {
    await mutations.updateRsvp(dialog.record, values);
    closeDialog();
    await list.refresh();
  }

  async function handleDelete() {
    await mutations.deleteRsvp(dialog.record.rsvpId);
    closeDialog();
    await list.refresh();
  }

  const isLoading = list.state.status === "loading";
  const isMutating = mutations.state.status === "loading";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>Dominique & Samuel</p>
          <h1 className={styles.title}>RSVP Admin</h1>
        </div>
        <button className={styles.logoutButton} type="button" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <section className={styles.summary} aria-live="polite">
        <div>
          <span>{list.count}</span>
          <p>registros na pagina</p>
        </div>
        <div>
          <span>{list.visibleItems.length}</span>
          <p>visiveis apos busca</p>
        </div>
        <div>
          <span>{list.status || "Todos"}</span>
          <p>filtro de status</p>
        </div>
      </section>

      <RsvpFilters
        limit={list.limit}
        onCreate={() => setDialog({ mode: "create", record: null })}
        onLimitChange={list.setLimit}
        onSearchChange={list.setSearch}
        onSortChange={list.setSort}
        onStatusChange={list.setStatus}
        search={list.search}
        sort={list.sort}
        status={list.status}
      />

      {list.state.error ? (
        <p className={styles.feedback} role="alert">
          {list.state.error}
        </p>
      ) : null}

      {mutations.state.message ? (
        <p
          className={
            mutations.state.status === "error"
              ? styles.feedback
              : styles.successFeedback
          }
          role={mutations.state.status === "error" ? "alert" : "status"}
        >
          {mutations.state.message}
        </p>
      ) : null}

      {isLoading ? (
        <div className={styles.loading} role="status">
          Carregando RSVPs...
        </div>
      ) : (
        <RsvpTable
          items={list.visibleItems}
          onDelete={(record) => setDialog({ mode: "delete", record })}
          onEdit={(record) => setDialog({ mode: "edit", record })}
          onView={(record) => setDialog({ mode: "view", record })}
        />
      )}

      <nav className={styles.pagination} aria-label="Paginacao de RSVPs">
        <button
          type="button"
          onClick={list.goPrevious}
          disabled={!list.hasPrevious || isLoading}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={list.goNext}
          disabled={!list.hasNext || isLoading}
        >
          Proxima
        </button>
      </nav>

      {["create", "edit", "view"].includes(dialog.mode) ? (
        <RsvpFormDialog
          mode={dialog.mode}
          record={dialog.record}
          errors={mutations.state.errors}
          isSubmitting={isMutating}
          onClose={closeDialog}
          onSubmit={dialog.mode === "create" ? handleCreate : handleUpdate}
        />
      ) : null}

      {dialog.mode === "delete" ? (
        <RsvpDeleteDialog
          isSubmitting={isMutating}
          onClose={closeDialog}
          onConfirm={handleDelete}
          record={dialog.record}
        />
      ) : null}
    </main>
  );
}
