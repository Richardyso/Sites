/** Credenciais só como hash — senhas não ficam em texto no código. */
const _K = [0x45, 0x4c, 0x43, 0x32, 0x36]; // ELC26

function _x(bytes) {
  return bytes.map((b, i) => b ^ _K[i % _K.length]);
}

function _hx(hex) {
  const out = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}

function _uh(arr) {
  return _x(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hashes SHA-256 de user::senha, embaralhados com XOR (não são senhas em claro). */
const _PACK = [
  {
    id: "carlos",
    label: "Carlos",
    role: "admin",
    locals: null,
    t: _x(
      _hx(
        "bc5f02b5963af30ad07216d461aa86d6b2063d75db2dccef6aad6f1377bf3795"
      )
    ),
  },
  {
    id: "dorian",
    label: "Dorian",
    role: "viewer",
    locals: ["Dorys Prime"],
    t: _x(
      _hx(
        "fd6c4b189ef680cd7dfbc86d37df139619db197292db179ecbceea42b906ad32"
      )
    ),
  },
  {
    id: "romario",
    label: "Romario",
    role: "viewer",
    locals: ["Pousada Paraíso"],
    t: _x(
      _hx(
        "e204f9e078fd1e71293691e79af1b65bd696f51d6d947e0c808a4ca60c6d2864"
      )
    ),
  },
  {
    id: "hotel",
    label: "Hotel",
    role: "viewer",
    locals: ["Hotel JR", "Hotel Guarany"],
    t: _x(
      _hx(
        "274f1d39eb7eeb578857e629b321cdccedbf0ca43b025f115e02ca7b284cb1bc"
      )
    ),
  },
];

const SESSION_KEY = "ec_v2_gate";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function canAccessLocal(user, localName) {
  if (!user) return false;
  if (user.role === "admin" || !user.locals) return true;
  return user.locals.includes(localName);
}

function canEdit(user) {
  return !!user && user.role === "admin";
}

async function verifyLogin(username, password) {
  const id = String(username || "").trim().toLowerCase();
  const pass = String(password || "");
  if (!id || !pass) return null;

  const digest = await sha256Hex(`${id}::${pass}`);
  const row = _PACK.find((u) => u.id === id);
  if (!row) {
    await sha256Hex("noise::" + Math.random());
    return null;
  }

  const expected = _uh(row.t);
  if (!timingSafeEqual(digest, expected)) return null;

  return {
    id: row.id,
    label: row.label,
    role: row.role,
    locals: row.locals,
  };
}

function saveSession(user) {
  const payload = {
    id: user.id,
    label: user.label,
    role: user.role,
    locals: user.locals,
    ts: Date.now(),
  };
  const raw = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  sessionStorage.setItem(SESSION_KEY, raw);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!user?.id || !user?.role) return null;
    const known = _PACK.find((u) => u.id === user.id);
    if (!known || known.role !== user.role) return null;
    return {
      id: known.id,
      label: known.label,
      role: known.role,
      locals: known.locals,
    };
  } catch {
    clearSession();
    return null;
  }
}

export {
  verifyLogin,
  saveSession,
  clearSession,
  readSession,
  canAccessLocal,
  canEdit,
};
