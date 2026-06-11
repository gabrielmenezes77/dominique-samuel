import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useAuth } from "../../hooks/auth/useAuth";
import { AuthConfigError } from "../../services/auth/authConfig";
import styles from "./LoginPage.module.css";

const INITIAL_VALUES = {
  email: "",
  password: "",
};

function validate(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = "Informe o email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um email valido.";
  }

  if (!values.password) {
    errors.password = "Informe a senha.";
  }

  return errors;
}

function safeRedirectTarget(target) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/admin";
  }

  return target;
}

function messageForError(error) {
  if (error instanceof AuthConfigError) {
    return "Configuracao administrativa incompleta.";
  }

  return error?.message || "Nao foi possivel entrar agora.";
}

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = safeRedirectTarget(searchParams.get("redirect"));
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");

  if (auth.isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFeedback("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFeedback("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await auth.login(values);
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setFeedback(messageForError(error));
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-login-title">
        <p className={styles.brand}>Dominique & Samuel</p>
        <h1 className={styles.title} id="admin-login-title">
          Acesso administrativo
        </h1>
        <p className={styles.subtitle}>
          Entre com a conta administrativa gerenciar RSVPs.
        </p>
        <LoginForm
          values={values}
          errors={errors}
          feedback={feedback}
          isSubmitting={auth.status === "authenticating"}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
