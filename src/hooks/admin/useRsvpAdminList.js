import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  filterRsvpsByText,
  sortRsvps,
} from "../../models/rsvp/rsvpMappers";
import { HttpError } from "../../utils/http/HttpError";
import RsvpAdminClient from "../../services/admin/RsvpAdminClient";
import { useAuth } from "../auth/useAuth";

function shouldInvalidate(error) {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

export default function useRsvpAdminList() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [nextToken, setNextToken] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updatedAt:desc");
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ status: "idle", error: "" });

  const client = useMemo(
    () => new RsvpAdminClient({ accessToken: auth.accessToken }),
    [auth.accessToken],
  );

  const handleError = useCallback(
    (error) => {
      if (shouldInvalidate(error)) {
        auth.invalidateSession();
        navigate("/login?redirect=%2Fadmin", { replace: true });
        return;
      }

      setState({
        status: "error",
        error: error?.message || "Nao foi possivel carregar os RSVPs.",
      });
    },
    [auth, navigate],
  );

  const loadPage = useCallback(
    async ({ token = null, history = cursorHistory } = {}) => {
      setState({ status: "loading", error: "" });

      try {
        const response = await client.listRsvps({
          limit,
          nextToken: token,
          status,
        });

        setItems(response.items);
        setCount(response.count);
        setNextToken(response.nextToken);
        setCurrentToken(token);
        setCursorHistory(history);
        setState({ status: "success", error: "" });
      } catch (error) {
        handleError(error);
      }
    },
    [client, cursorHistory, handleError, limit, status],
  );

  useEffect(() => {
    setCurrentToken(null);
    setCursorHistory([]);
    loadPage({ token: null, history: [] });
  }, [limit, status]);

  const goNext = useCallback(() => {
    if (!nextToken || state.status === "loading") {
      return;
    }

    loadPage({
      token: nextToken,
      history: [...cursorHistory, currentToken],
    });
  }, [cursorHistory, currentToken, loadPage, nextToken, state.status]);

  const goPrevious = useCallback(() => {
    if (cursorHistory.length === 0 || state.status === "loading") {
      return;
    }

    const history = cursorHistory.slice(0, -1);
    const previousToken = cursorHistory[cursorHistory.length - 1] || null;
    loadPage({ token: previousToken, history });
  }, [cursorHistory, loadPage, state.status]);

  const refresh = useCallback(() => {
    loadPage({ token: currentToken, history: cursorHistory });
  }, [currentToken, cursorHistory, loadPage]);

  const visibleItems = useMemo(() => {
    return sortRsvps(filterRsvpsByText(items, search), sort);
  }, [items, search, sort]);

  return {
    count,
    cursorHistory,
    goNext,
    goPrevious,
    hasNext: Boolean(nextToken),
    hasPrevious: cursorHistory.length > 0,
    items,
    limit,
    nextToken,
    refresh,
    search,
    setLimit,
    setSearch,
    setSort,
    setStatus,
    sort,
    state,
    status,
    visibleItems,
  };
}
