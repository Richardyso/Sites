import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig, COLLECTION } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = {
  localName: "",
  type: "",
  entries: [],
  filterMode: "ano",
  filterQuery: "",
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const screens = {
  home: $("#screen-home"),
  local: $("#screen-local"),
  form: $("#screen-form"),
};

const entriesEl = $("#entries");
const loadingEl = $("#loading");
const toastEl = $("#toast");
const btnSave = $("#btn-save");
const filterQueryEl = $("#filter-query");
const filterClearEl = $("#filter-clear");
const filterMetaEl = $("#filter-meta");
const filterEmptyEl = $("#filter-empty");

const FILTER_PLACEHOLDERS = {
  ano: "Ex.: 2024",
  data: "Ex.: 30/09/2024",
  numero: "Ex.: 66",
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    const on = key === name;
    el.classList.toggle("active", on);
    el.setAttribute("aria-hidden", on ? "false" : "true");
  });
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function toast(msg, isError = false) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  toastEl.classList.toggle("error", isError);
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

function docId(localName, type) {
  return `${localName}_${type}`;
}

function todayBR() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeText(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;");
}

function normalizeQuery(q) {
  return String(q || "").trim().toLowerCase();
}

function entryMatches(entry, mode, query) {
  const q = normalizeQuery(query);
  if (!q) return true;

  const numero = String(entry.numero ?? "").trim().toLowerCase();
  const data = String(entry.data ?? "").trim().toLowerCase();

  if (mode === "numero") {
    return numero.includes(q.replace(/\s/g, ""));
  }

  if (mode === "ano") {
    const year = data.match(/(\d{4})$/)?.[1] || data.match(/\b(19|20)\d{2}\b/)?.[0] || "";
    return year.includes(q) || data.includes(q);
  }

  // data: aceita parcial (30, 30/09, 30/09/2024)
  const compactQ = q.replace(/\s/g, "");
  const compactData = data.replace(/\s/g, "");
  return compactData.includes(compactQ);
}

function getVisibleIndexes() {
  const q = state.filterQuery;
  if (!normalizeQuery(q)) {
    return state.entries.map((_, i) => i);
  }
  return state.entries
    .map((entry, i) => (entryMatches(entry, state.filterMode, q) ? i : -1))
    .filter((i) => i >= 0);
}

function syncVisibleFromDom() {
  $$("#entries .entry").forEach((row) => {
    const idx = Number(row.dataset.idx);
    if (Number.isNaN(idx) || !state.entries[idx]) return;
    state.entries[idx] = {
      numero: row.querySelector(".field-numero").value.trim(),
      data: row.querySelector(".field-data").value.trim(),
      observacao: row.querySelector(".field-obs").value,
    };
  });
}

function updateFilterChrome() {
  const q = normalizeQuery(state.filterQuery);
  filterClearEl.hidden = !q;
  filterQueryEl.placeholder = FILTER_PLACEHOLDERS[state.filterMode] || "Filtrar…";

  if (!q) {
    filterMetaEl.hidden = true;
    filterEmptyEl.hidden = true;
    return;
  }

  const visible = getVisibleIndexes().length;
  const total = state.entries.length;
  filterMetaEl.hidden = false;
  filterMetaEl.textContent = `${visible} de ${total}`;
}

function createEntryRow(entry, idx) {
  const row = document.createElement("article");
  row.className = "entry";
  row.dataset.idx = String(idx);
  row.innerHTML = `
    <label>
      Nº
      <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="field-numero" placeholder="00" value="${escapeAttr(entry.numero ?? "")}" />
    </label>
    <label>
      Data
      <input type="text" class="field-data" placeholder="DD/MM/AAAA" readonly value="${escapeAttr(entry.data ?? "")}" />
    </label>
    <label class="anotacao">
      Anotação
      <textarea class="field-obs" rows="3" placeholder="Escreva aqui…">${escapeText(entry.observacao ?? "")}</textarea>
    </label>
  `;

  const num = row.querySelector(".field-numero");
  num.addEventListener("input", () => {
    num.value = num.value.replace(/\D/g, "");
    state.entries[idx].numero = num.value.trim();
  });

  const data = row.querySelector(".field-data");
  data.addEventListener("click", () => openDatePicker(data, idx));

  const obs = row.querySelector(".field-obs");
  obs.addEventListener("input", () => {
    state.entries[idx].observacao = obs.value;
  });

  return row;
}

function openDatePicker(input, idx) {
  const hidden = document.createElement("input");
  hidden.type = "date";
  hidden.style.position = "fixed";
  hidden.style.opacity = "0";
  hidden.style.pointerEvents = "none";
  document.body.appendChild(hidden);

  const parts = String(input.value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (parts) {
    hidden.value = `${parts[3]}-${parts[2]}-${parts[1]}`;
  } else {
    const n = new Date();
    hidden.value = n.toISOString().slice(0, 10);
  }

  hidden.addEventListener(
    "change",
    () => {
      if (hidden.value) {
        const [y, m, d] = hidden.value.split("-");
        input.value = `${d}/${m}/${y}`;
        if (state.entries[idx]) state.entries[idx].data = input.value;
      }
      hidden.remove();
      applyFilterView();
    },
    { once: true }
  );

  hidden.addEventListener(
    "blur",
    () => {
      setTimeout(() => hidden.remove(), 300);
    },
    { once: true }
  );

  hidden.showPicker?.();
  hidden.click();
}

function applyFilterView() {
  syncVisibleFromDom();
  const indexes = getVisibleIndexes();
  entriesEl.innerHTML = "";

  if (!state.entries.length) {
    state.entries = [{ numero: "", data: "", observacao: "" }];
    entriesEl.appendChild(createEntryRow(state.entries[0], 0));
    filterEmptyEl.hidden = true;
    updateFilterChrome();
    return;
  }

  if (!indexes.length) {
    filterEmptyEl.hidden = false;
    updateFilterChrome();
    return;
  }

  filterEmptyEl.hidden = true;
  indexes.forEach((i) => entriesEl.appendChild(createEntryRow(state.entries[i], i)));
  updateFilterChrome();
}

function resetFilter() {
  state.filterMode = "ano";
  state.filterQuery = "";
  filterQueryEl.value = "";
  $$(".filter-mode").forEach((btn) => {
    const on = btn.dataset.mode === "ano";
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  updateFilterChrome();
}

function renderEntries(list) {
  state.entries = Array.isArray(list) && list.length
    ? list.map((e) => ({
        numero: e?.numero ?? "",
        data: e?.data ?? "",
        observacao: e?.observacao ?? "",
      }))
    : [{ numero: "", data: "", observacao: "" }];
  applyFilterView();
}

async function loadForm() {
  loadingEl.hidden = false;
  entriesEl.innerHTML = "";
  filterEmptyEl.hidden = true;
  resetFilter();
  try {
    const ref = doc(db, COLLECTION, docId(state.localName, state.type));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      renderEntries(Array.isArray(data.entries) ? data.entries : []);
    } else {
      renderEntries([]);
    }
  } catch (err) {
    console.error(err);
    toast("Erro ao carregar. Confira as regras do Firestore.", true);
    renderEntries([]);
  } finally {
    loadingEl.hidden = true;
  }
}

async function saveForm() {
  syncVisibleFromDom();
  const entries = state.entries.map((e) => ({
    numero: String(e.numero ?? "").trim(),
    data: String(e.data ?? "").trim(),
    observacao: String(e.observacao ?? ""),
  }));
  btnSave.disabled = true;
  btnSave.textContent = "Salvando…";
  try {
    const ref = doc(db, COLLECTION, docId(state.localName, state.type));
    await setDoc(ref, { entries });
    state.entries = entries;
    toast("Salvo no Firebase!");
  } catch (err) {
    console.error(err);
    toast("Erro ao salvar: " + (err.message || "falha"), true);
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "Salvar";
  }
}

// Home → local
$$("#screen-home [data-local]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.localName = btn.dataset.local;
    $("#local-title").textContent = state.localName;
    showScreen("local");
  });
});

// Local → form
$$("#screen-local [data-type]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.type = btn.dataset.type;
    $("#form-local").textContent = state.localName;
    $("#form-type").textContent = btn.textContent.trim();
    showScreen("form");
    loadForm();
  });
});

$("#btn-back-home").addEventListener("click", () => showScreen("home"));
$("#btn-back-local").addEventListener("click", () => showScreen("local"));

$("#btn-add").addEventListener("click", () => {
  syncVisibleFromDom();
  state.entries.push({ numero: "", data: todayBR(), observacao: "" });
  const idx = state.entries.length - 1;
  // limpa filtro para a nova linha aparecer
  if (normalizeQuery(state.filterQuery)) {
    state.filterQuery = "";
    filterQueryEl.value = "";
  }
  applyFilterView();
  const row = entriesEl.querySelector(`[data-idx="${idx}"]`);
  row?.querySelector(".field-obs")?.focus();
  row?.scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#btn-remove").addEventListener("click", () => {
  syncVisibleFromDom();
  if (state.entries.length <= 1) {
    toast("Deve haver pelo menos uma linha", true);
    return;
  }

  const visible = getVisibleIndexes();
  if (!visible.length) {
    toast("Nada para remover neste filtro", true);
    return;
  }

  const removeIdx = visible[visible.length - 1];
  state.entries.splice(removeIdx, 1);
  applyFilterView();
});

$("#btn-save").addEventListener("click", saveForm);

$$(".filter-mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    syncVisibleFromDom();
    state.filterMode = btn.dataset.mode;
    $$(".filter-mode").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    applyFilterView();
    filterQueryEl.focus();
  });
});

filterQueryEl.addEventListener("input", () => {
  syncVisibleFromDom();
  state.filterQuery = filterQueryEl.value;
  applyFilterView();
});

filterClearEl.addEventListener("click", () => {
  syncVisibleFromDom();
  state.filterQuery = "";
  filterQueryEl.value = "";
  applyFilterView();
  filterQueryEl.focus();
});
