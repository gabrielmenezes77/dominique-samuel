import styles from "./LoginForm.module.css";

export default function LoginForm({
  values,
  errors = {},
  feedback = "",
  isSubmitting = false,
  onChange,
  onSubmit,
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="admin-email">
          Email
        </label>
        <input
          className={styles.field}
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          value={values.email}
          onChange={onChange}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          disabled={isSubmitting}
        />
        {errors.email ? (
          <p className={styles.fieldError} id="admin-email-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="admin-password">
          Senha
        </label>
        <input
          className={styles.field}
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={onChange}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "admin-password-error" : undefined
          }
          disabled={isSubmitting}
        />
        {errors.password ? (
          <p className={styles.fieldError} id="admin-password-error">
            {errors.password}
          </p>
        ) : null}
      </div>

      {feedback ? (
        <p className={styles.feedback} role="alert">
          {feedback}
        </p>
      ) : null}

      <button
        className={styles.submitButton}
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      <p className={styles.recoveryNote}>
        Recuperação de conta: Entre em contato com o administrador do sistema.
      </p>
    </form>
  );
}
