export class ValidationError extends Error {
  constructor(errors) {
    super("Validation failed.");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREATE_FIELDS = ["nome", "sobrenome", "email", "confirmacao", "acompanhantes", "obs"];
const PATCH_FIELDS = ["nome", "sobrenome", "confirmacao", "acompanhantes", "obs"];

function asTrimmedString(value) {
  return String(value ?? "").trim();
}

function normalizeAcompanhantes(value) {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  return Number(value);
}

export function validateCreateRsvpPayload(input) {
  const errors = {};
  const payload = {
    nome: asTrimmedString(input.nome),
    sobrenome: asTrimmedString(input.sobrenome),
    email: asTrimmedString(input.email).toLowerCase(),
    confirmacao: input.confirmacao,
    acompanhantes: normalizeAcompanhantes(input.acompanhantes),
    obs: asTrimmedString(input.obs),
  };

  if (!payload.nome) {
    errors.nome = "Informe o nome.";
  }

  if (!payload.sobrenome) {
    errors.sobrenome = "Informe o sobrenome.";
  }

  if (!payload.email || !EMAIL_RE.test(payload.email)) {
    errors.email = "Informe um email valido.";
  }

  if (!["sim", "nao"].includes(payload.confirmacao)) {
    errors.confirmacao = "Escolha uma confirmacao valida.";
  }

  if (
    !Number.isInteger(payload.acompanhantes) ||
    payload.acompanhantes < 0
  ) {
    errors.acompanhantes = "Informe um numero inteiro maior ou igual a zero.";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return CREATE_FIELDS.reduce((acc, field) => {
    if (field === "obs") {
      acc.obs = payload.obs;
      return acc;
    }

    acc[field] = payload[field];
    return acc;
  }, {});
}

export function validatePatchRsvpPayload(original, input) {
  const createLike = validateCreateRsvpPayload({
    ...input,
    email: original.email,
  });
  const patch = {};

  PATCH_FIELDS.forEach((field) => {
    if (createLike[field] !== original[field]) {
      patch[field] = createLike[field];
    }
  });

  if (Object.keys(patch).length === 0) {
    throw new ValidationError({
      form: "Altere ao menos um campo antes de salvar.",
    });
  }

  return patch;
}

export function validateListParams({ limit = 20, status = "" } = {}) {
  const numericLimit = Number(limit);

  if (!Number.isInteger(numericLimit) || numericLimit < 1 || numericLimit > 100) {
    throw new ValidationError({
      limit: "O limite deve ser um inteiro entre 1 e 100.",
    });
  }

  if (status && !["ATTENDING", "DECLINED"].includes(status)) {
    throw new ValidationError({
      status: "Status deve ser ATTENDING ou DECLINED.",
    });
  }

  return {
    limit: numericLimit,
    status,
  };
}
