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

function createEntryRow(entry = { numero: "", data: "", observacao: "" }) {
  const row = document.createElement("article");
  row.className = "entry";
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
  });

  const data = row.querySelector(".field-data");
  data.addEventListener("click", () => openDatePicker(data));

  return row;
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

function openDatePicker(input) {
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
      }
      hidden.remove();
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

function readEntriesFromDom() {
  return $$("#entries .entry").map((row) => ({
    numero: row.querySelector(".field-numero").value.trim(),
    data: row.querySelector(".field-data").value.trim(),
    observacao: row.querySelector(".field-obs").value,
  }));
}

function renderEntries(list) {
  entriesEl.innerHTML = "";
  const items = list?.length ? list : [{ numero: "", data: "", observacao: "" }];
  items.forEach((e) => entriesEl.appendChild(createEntryRow(e)));
}

async function loadForm() {
  loadingEl.hidden = false;
  entriesEl.innerHTML = "";
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
  const entries = readEntriesFromDom();
  btnSave.disabled = true;
  btnSave.textContent = "Salvando…";
  try {
    const ref = doc(db, COLLECTION, docId(state.localName, state.type));
    await setDoc(ref, { entries });
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
  const row = createEntryRow({ numero: "", data: todayBR(), observacao: "" });
  entriesEl.appendChild(row);
  row.querySelector(".field-obs").focus();
  row.scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#btn-remove").addEventListener("click", () => {
  const rows = $$("#entries .entry");
  if (rows.length <= 1) {
    toast("Deve haver pelo menos uma linha", true);
    return;
  }
  rows[rows.length - 1].remove();
});

$("#btn-save").addEventListener("click", saveForm);
