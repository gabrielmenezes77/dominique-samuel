export const RSVP_CONFIRMATION_VALUES = Object.freeze(["sim", "nao"]);
export const RSVP_STATUS_FILTERS = Object.freeze(["", "ATTENDING", "DECLINED"]);

export const SORT_OPTIONS = Object.freeze([
  "updatedAt:desc",
  "createdAt:desc",
  "nome:asc",
  "email:asc",
  "confirmacao:asc",
  "attendeeCount:desc",
  "submissionCount:desc",
]);

export function confirmationToStatus(confirmacao) {
  if (confirmacao === "sim") {
    return "ATTENDING";
  }

  if (confirmacao === "nao") {
    return "DECLINED";
  }

  return "";
}

export function statusToConfirmation(status) {
  if (status === "ATTENDING") {
    return "sim";
  }

  if (status === "DECLINED") {
    return "nao";
  }

  return "";
}

export function confirmationLabel(confirmacao) {
  return confirmacao === "sim" ? "Confirmado" : "Nao vai";
}

export function normalizeRsvpRecord(record) {
  return {
    rsvpId: String(record?.rsvpId || ""),
    nome: String(record?.nome || ""),
    sobrenome: String(record?.sobrenome || ""),
    email: String(record?.email || ""),
    confirmacao: record?.confirmacao === "nao" ? "nao" : "sim",
    acompanhantes: Number(record?.acompanhantes || 0),
    attendeeCount: Number(record?.attendeeCount || 0),
    obs: String(record?.obs || ""),
    createdAt: String(record?.createdAt || ""),
    updatedAt: String(record?.updatedAt || ""),
    submissionCount: Number(record?.submissionCount || 0),
  };
}

export function normalizeRsvpListResponse(response) {
  const items = Array.isArray(response?.items)
    ? response.items.map(normalizeRsvpRecord)
    : [];

  return {
    items,
    count: Number(response?.count ?? items.length),
    nextToken: response?.nextToken || null,
  };
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function fullName(record) {
  return [record.nome, record.sobrenome].filter(Boolean).join(" ").trim();
}

export function filterRsvpsByText(records, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return records;
  }

  return records.filter((record) => {
    const haystack = [
      record.nome,
      record.sobrenome,
      record.email,
      record.confirmacao,
      record.obs,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function sortValue(record, key) {
  if (key === "nome") {
    return fullName(record).toLowerCase();
  }

  if (key === "createdAt" || key === "updatedAt") {
    return new Date(record[key] || 0).getTime();
  }

  const value = record[key];
  return typeof value === "string" ? value.toLowerCase() : value;
}

export function sortRsvps(records, sortOption) {
  const [key, direction = "asc"] = SORT_OPTIONS.includes(sortOption)
    ? sortOption.split(":")
    : ["updatedAt", "desc"];
  const modifier = direction === "desc" ? -1 : 1;

  return [...records].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);

    if (left < right) {
      return -1 * modifier;
    }

    if (left > right) {
      return 1 * modifier;
    }

    return a.rsvpId.localeCompare(b.rsvpId);
  });
}
