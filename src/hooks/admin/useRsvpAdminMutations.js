import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RsvpAdminClient from "../../services/admin/RsvpAdminClient";
import { HttpError } from "../../utils/http/HttpError";
import { useAuth } from "../auth/useAuth";

function shouldInvalidate(error) {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

export default function useRsvpAdminMutations() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({
    status: "idle",
    message: "",
    errors: {},
  });
  const client = useMemo(
    () => new RsvpAdminClient({ accessToken: auth.accessToken }),
    [auth.accessToken],
  );

  function handleError(error) {
    if (shouldInvalidate(error)) {
      auth.invalidateSession();
      navigate("/login?redirect=%2Fadmin", { replace: true });
      return;
    }

    setState({
      status: "error",
      message: error?.message || "Nao foi possivel concluir a operacao.",
      errors: error?.errors || {},
    });
    throw error;
  }

  async function run(operation, successMessage) {
    setState({ status: "loading", message: "", errors: {} });

    try {
      const result = await operation();
      setState({ status: "success", message: successMessage, errors: {} });
      return result;
    } catch (error) {
      return handleError(error);
    }
  }

  return {
    createRsvp(values) {
      return run(() => client.createRsvp(values), "RSVP criado com sucesso.");
    },
    updateRsvp(original, values) {
      return run(
        () => client.updateRsvp(original, values),
        "RSVP atualizado com sucesso.",
      );
    },
    deleteRsvp(rsvpId) {
      return run(() => client.deleteRsvp(rsvpId), "RSVP excluido com sucesso.");
    },
    getRsvp(rsvpId) {
      return run(() => client.getRsvp(rsvpId), "RSVP carregado.");
    },
    reset() {
      setState({ status: "idle", message: "", errors: {} });
    },
    state,
  };
}
