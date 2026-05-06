/* ============================================================
   Samuel & Dominique — Wedding Landing Page
   Scroll-driven canvas + Lenis smooth scroll + GSAP reveals
   ============================================================ */

const FRAME_COUNT_DESKTOP = 90;
const FRAME_COUNT_MOBILE = 50;
const MOBILE_BREAKPOINT = 768;
const FRAME_COUNT =
  window.innerWidth < MOBILE_BREAKPOINT
    ? FRAME_COUNT_MOBILE
    : FRAME_COUNT_DESKTOP;
const BG_COLOR = "#F5F3EE";
const IMAGE_SCALE = 0.88;
const RSVP_ENDPOINT = "https://www.dominique-samuel.com/api/rsvp";

// DOM refs
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const hint = document.getElementById("scroll-hint");
const spacer = document.getElementById("video-spacer");
const siteHeader = document.getElementById("site-header");

// State
const frames = new Array(FRAME_COUNT).fill(null);
let loaded = 0;
let current = 0;
let lenis;

function isMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function syncSpacerHeight() {
  spacer.style.height = isMobileViewport() ? "120vh" : "";
}

/* ── Canvas resize + draw ──────────────────────────────────── */
function resizeCanvas() {
  syncSpacerHeight();
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(current);
}

function drawFrame(idx) {
  const img = frames[idx];
  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);
  if (!img) return;

  const sc =
    Math.max(w / img.naturalWidth, h / img.naturalHeight) * IMAGE_SCALE;
  const dw = img.naturalWidth * sc;
  const dh = img.naturalHeight * sc;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/* ── Frame loading ─────────────────────────────────────────── */
function frameSrc(i) {
  return `assets/frames/frame_${String(i + 1).padStart(4, "0")}.webp`;
}

function loadOne(i) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      frames[i] = img;
      loaded++;
      loaderBar.style.width = Math.round((loaded / FRAME_COUNT) * 100) + "%";
      resolve();
    };
    img.onerror = resolve;
    img.src = frameSrc(i);
  });
}

async function preload() {
  // Phase 1 — first 12 frames for fast first paint
  await Promise.all(
    Array.from({ length: Math.min(12, FRAME_COUNT) }, (_, i) => loadOne(i)),
  );

  drawFrame(0);
  loader.classList.add("hidden");
  setTimeout(() => hint.classList.add("visible"), 600);
  initScroll();

  // Phase 2 — rest in background (fire and forget)
  for (let i = 12; i < FRAME_COUNT; i++) loadOne(i);
}

/* ── Lenis smooth scroll ───────────────────────────────────── */
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── Scroll & animation init ───────────────────────────────── */
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  syncSpacerHeight();

  // Frame scrubbing through the shortened intro sequence.
  ScrollTrigger.create({
    trigger: spacer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate(self) {
      const idx = Math.min(
        Math.floor(self.progress * FRAME_COUNT),
        FRAME_COUNT - 1,
      );
      if (idx !== current) {
        current = idx;
        requestAnimationFrame(() => drawFrame(current));
      }
    },
  });

  // Hide scroll hint once user starts scrolling
  ScrollTrigger.create({
    trigger: spacer,
    start: "top+=80 top",
    onEnter: () => hint.classList.remove("visible"),
    onLeaveBack: () => hint.classList.add("visible"),
  });

  // Header background after intro spacer
  ScrollTrigger.create({
    trigger: spacer,
    start: "bottom top",
    onEnter: () => siteHeader?.classList.add("scrolled"),
    onLeaveBack: () => siteHeader?.classList.remove("scrolled"),
  });

  // Section reveals — stagger items per section
  const sectionConfig = [
    { sel: ".section-mensagem", stagger: 0.15, y: 38 },
    { sel: ".section-countdown", stagger: 0.12, y: 32 },
    { sel: ".section-rsvp", stagger: 0.08, y: 28 },
    { sel: "footer", stagger: 0.12, y: 24 },
  ];

  sectionConfig.forEach(({ sel, stagger, y }) => {
    const section = document.querySelector(sel);
    if (!section) return;
    const items = section.querySelectorAll(".ri");
    if (!items.length) return;
    gsap.from(items, {
      y,
      opacity: 0,
      duration: 0.95,
      ease: "power3.out",
      stagger,
      scrollTrigger: {
        trigger: section,
        start: "top 82%",
      },
    });
  });

  // Botanical dividers — scale from center
  gsap.utils.toArray(".botanical-divider").forEach((el) => {
    gsap.from(el, {
      scaleX: 0,
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      transformOrigin: "center center",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      },
    });
  });
}

/* ── Countdown ─────────────────────────────────────────────── */
function startCountdown() {
  const target = new Date("2026-06-20T08:00:00");
  const elDays = document.getElementById("cd-days");
  const elHours = document.getElementById("cd-hours");
  const elMins = document.getElementById("cd-mins");
  const elSecs = document.getElementById("cd-secs");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      [elDays, elHours, elMins, elSecs].forEach((el) => {
        el.textContent = "00";
      });
      return;
    }
    elDays.textContent = pad(Math.floor(diff / 86400000));
    elHours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    elMins.textContent = pad(Math.floor((diff % 3600000) / 60000));
    elSecs.textContent = pad(Math.floor((diff % 60000) / 1000));
  }

  tick();
  setInterval(tick, 1000);
}

/* ── RSVP form placeholder ─────────────────────────────────── */
function initForm() {
  const form = document.getElementById("rsvp-form");
  const feedback = document.getElementById("rsvp-feedback");
  if (!form) return;

  const btn = form.querySelector(".btn-confirm");
  const confirmacaoInputs = form.querySelectorAll('input[name="confirmacao"]');
  const acompanhantesField = form.querySelector("#acompanhantes");
  const initialButtonLabel = btn?.textContent ?? "Confirmar Presença";

  function setFeedback(message, type = "") {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove("is-success", "is-error");
    if (type) {
      feedback.classList.add(type);
    }
  }

  function syncAcompanhantesState() {
    if (!acompanhantesField) return;
    const confirmacao = form.querySelector(
      'input[name="confirmacao"]:checked',
    )?.value;
    const isDeclined = confirmacao === "nao";
    acompanhantesField.disabled = isDeclined;
    acompanhantesField.value = isDeclined
      ? "0"
      : acompanhantesField.value || "0";
  }

  confirmacaoInputs.forEach((input) => {
    input.addEventListener("change", syncAcompanhantesState);
  });
  syncAcompanhantesState();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!btn) return;

    const formData = new FormData(form);
    const payload = {
      nome: String(formData.get("nome") || "").trim(),
      sobrenome: String(formData.get("sobrenome") || "").trim(),
      email: String(formData.get("email") || "")
        .trim()
        .toLowerCase(),
      confirmacao: String(formData.get("confirmacao") || "").trim(),
      acompanhantes: Number.parseInt(
        String(formData.get("acompanhantes") || "0"),
        10,
      ),
      obs: String(formData.get("obs") || "").trim(),
    };

    btn.disabled = true;
    btn.textContent = "Enviando...";
    setFeedback("Enviando sua confirmacao...", "");

    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          "Nao foi possivel registrar sua confirmacao agora.";
        throw new Error(errorMessage);
      }

      btn.textContent = "Confirmacao Enviada";
      setFeedback(
        payload.confirmacao === "sim"
          ? "Presenca confirmada com sucesso."
          : "Resposta registrada com sucesso.",
        "is-success",
      );
      form.reset();
      syncAcompanhantesState();
      btn.disabled = false;
      btn.textContent = initialButtonLabel;
    } catch (error) {
      btn.disabled = false;
      btn.textContent = initialButtonLabel;
      setFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel registrar sua confirmacao agora.",
        "is-error",
      );
    }
  });
  return;
  /*
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector(".btn-confirm");
    btn.textContent = "Confirmado ✓";
    btn.style.background = "#8A9E55";
    btn.disabled = true;
  });
  */
}

/* ── Bootstrap ─────────────────────────────────────────────── */
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
startCountdown();
initForm();
preload();
