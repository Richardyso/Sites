(() => {
  const SIZE = 1024;
  const BS = 8;
  const GRID = SIZE / BS;
  const BLOCKS = GRID * GRID;
  const REPS = 7;
  const STRENGTH = 18;
  const MID = [
    [1, 2],
    [2, 1],
    [2, 2],
    [1, 3],
    [3, 1],
    [2, 3],
    [3, 2],
  ];
  const MAGIC = [0x5a, 0x52, 0x4e, 0x34]; // ZRN4
  const CAP_BITS = Math.floor(BLOCKS / REPS);
  const STRIDE = Math.floor(BLOCKS / REPS);
  const DEFAULT_IMAGE = "assets/kovil.jpg";

  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const msgArea = document.getElementById("msgArea");
  const encodeBtn = document.getElementById("encodeBtn");
  const decodeBtn = document.getElementById("decodeBtn");
  const statusEl = document.getElementById("status");
  const preview = document.getElementById("preview");
  const pctx = preview.getContext("2d", {
    willReadFrequently: true,
    alpha: false,
    colorSpace: "srgb",
  });

  let currentImage = null;
  let currentObjectUrl = null;
  const te = new TextEncoder();
  const td = new TextDecoder("utf-8", { fatal: false });

  const C = new Float64Array(BS * BS);
  {
    const s0 = Math.sqrt(1 / BS);
    const s = Math.sqrt(2 / BS);
    for (let u = 0; u < BS; u++) {
      const su = u === 0 ? s0 : s;
      for (let x = 0; x < BS; x++) {
        C[u * BS + x] = su * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * BS));
      }
    }
  }

  function dct2(block) {
    const tmp = new Float64Array(BS * BS);
    const out = new Float64Array(BS * BS);
    for (let u = 0; u < BS; u++) {
      for (let x = 0; x < BS; x++) {
        let s = 0;
        for (let i = 0; i < BS; i++) s += C[u * BS + i] * block[i * BS + x];
        tmp[u * BS + x] = s;
      }
    }
    for (let u = 0; u < BS; u++) {
      for (let v = 0; v < BS; v++) {
        let s = 0;
        for (let x = 0; x < BS; x++) s += tmp[u * BS + x] * C[v * BS + x];
        out[u * BS + v] = s;
      }
    }
    return out;
  }

  function idct2(coeff) {
    const tmp = new Float64Array(BS * BS);
    const out = new Float64Array(BS * BS);
    for (let i = 0; i < BS; i++) {
      for (let v = 0; v < BS; v++) {
        let s = 0;
        for (let u = 0; u < BS; u++) s += C[u * BS + i] * coeff[u * BS + v];
        tmp[i * BS + v] = s;
      }
    }
    for (let i = 0; i < BS; i++) {
      for (let j = 0; j < BS; j++) {
        let s = 0;
        for (let v = 0; v < BS; v++) s += tmp[i * BS + v] * C[v * BS + j];
        out[i * BS + j] = s;
      }
    }
    return out;
  }

  function setStatus(msg, kind = "") {
    statusEl.textContent = msg;
    statusEl.className = kind;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function maxBody() {
    return Math.floor(CAP_BITS / 8) - 10;
  }

  function buildPayload(text) {
    const body = te.encode(text);
    if (body.length > maxBody()) {
      throw new Error("mensagem longa demais (máx " + maxBody() + " bytes)");
    }
    const out = new Uint8Array(10 + body.length);
    out.set(MAGIC, 0);
    out[4] = (body.length >> 8) & 0xff;
    out[5] = body.length & 0xff;
    out.set(body, 6);
    const c = crc32(out.subarray(0, 6 + body.length));
    const o = 6 + body.length;
    out[o] = (c >>> 24) & 0xff;
    out[o + 1] = (c >>> 16) & 0xff;
    out[o + 2] = (c >>> 8) & 0xff;
    out[o + 3] = c & 0xff;
    return out;
  }

  function parsePayload(bytes) {
    if (!bytes || bytes.length < 10) return null;
    for (let i = 0; i < 4; i++) if (bytes[i] !== MAGIC[i]) return null;
    const len = (bytes[4] << 8) | bytes[5];
    if (len < 0 || 6 + len + 4 > bytes.length) return null;
    const expect =
      ((bytes[6 + len] << 24) |
        (bytes[7 + len] << 16) |
        (bytes[8 + len] << 8) |
        bytes[9 + len]) >>>
      0;
    if (crc32(bytes.subarray(0, 6 + len)) !== expect) return null;
    return td.decode(bytes.subarray(6, 6 + len));
  }

  function bytesToBits(bytes) {
    const bits = [];
    for (let i = 0; i < bytes.length; i++)
      for (let b = 7; b >= 0; b--) bits.push((bytes[i] >> b) & 1);
    return bits;
  }

  function bitsToBytes(bits) {
    const n = bits.length >> 3;
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let b = 0; b < 8; b++) v = (v << 1) | (bits[i * 8 + b] & 1);
      out[i] = v;
    }
    return out;
  }

  function blocksForBit(k) {
    const out = [];
    for (let r = 0; r < REPS; r++) out.push((k + r * STRIDE) % BLOCKS);
    return out;
  }

  function getBlockY(data, bi) {
    const by = (bi / GRID) | 0;
    const bx = bi % GRID;
    const block = new Float64Array(BS * BS);
    for (let y = 0; y < BS; y++) {
      for (let x = 0; x < BS; x++) {
        const p = ((by * BS + y) * SIZE + (bx * BS + x)) * 4;
        block[y * BS + x] =
          0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2] - 128;
      }
    }
    return { block, by, bx };
  }

  function putBlockY(data, by, bx, spatial) {
    for (let y = 0; y < BS; y++) {
      for (let x = 0; x < BS; x++) {
        const p = ((by * BS + y) * SIZE + (bx * BS + x)) * 4;
        const oldY = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        let newY = spatial[y * BS + x] + 128;
        if (newY < 0) newY = 0;
        if (newY > 255) newY = 255;
        const d = newY - oldY;
        for (let c = 0; c < 3; c++) {
          let v = data[p + c] + d;
          data[p + c] = v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0;
        }
      }
    }
  }

  function xorParity(coeff) {
    let bit = 0;
    for (const [u, v] of MID) {
      bit ^= coeff[u * BS + v] >= 0 ? 1 : 0;
    }
    return bit;
  }

  function forceXorParity(coeff, bit) {
    const cur = xorParity(coeff);
    if (cur === bit) {
      for (const [u, v] of MID) {
        const i = u * BS + v;
        if (Math.abs(coeff[i]) < STRENGTH) {
          coeff[i] = coeff[i] >= 0 ? STRENGTH : -STRENGTH;
        }
      }
      return;
    }
    let best = 0;
    let bestAbs = Infinity;
    for (let i = 0; i < MID.length; i++) {
      const [u, v] = MID[i];
      const a = Math.abs(coeff[u * BS + v]);
      if (a < bestAbs) {
        bestAbs = a;
        best = i;
      }
    }
    const [u, v] = MID[best];
    const i = u * BS + v;
    const sign = coeff[i] >= 0 ? 1 : -1;
    coeff[i] = -sign * Math.max(STRENGTH, bestAbs || STRENGTH);
    for (const [uu, vv] of MID) {
      const j = uu * BS + vv;
      if (j === i) continue;
      if (Math.abs(coeff[j]) < STRENGTH * 0.5) {
        coeff[j] = coeff[j] >= 0 ? STRENGTH : -STRENGTH;
      }
    }
  }

  function embedBits(imageData, payloadBits) {
    const data = imageData.data;
    const bits = new Array(CAP_BITS);
    for (let i = 0; i < CAP_BITS; i++) bits[i] = i < payloadBits.length ? payloadBits[i] : 0;

    for (let k = 0; k < CAP_BITS; k++) {
      const bit = bits[k];
      for (const bi of blocksForBit(k)) {
        const { block, by, bx } = getBlockY(data, bi);
        const coeff = dct2(block);
        forceXorParity(coeff, bit);
        const spatial = idct2(coeff);
        putBlockY(data, by, bx, spatial);
      }
    }
    return imageData;
  }

  function extractBits(imageData) {
    const data = imageData.data;
    const bits = new Array(CAP_BITS);
    for (let k = 0; k < CAP_BITS; k++) {
      let z = 0;
      let o = 0;
      for (const bi of blocksForBit(k)) {
        const { block } = getBlockY(data, bi);
        const coeff = dct2(block);
        const bit = xorParity(coeff);
        if (bit) o++;
        else z++;
      }
      bits[k] = o >= z ? 1 : 0;
    }
    return bits;
  }

  function decodeFromImageData(imageData) {
    return parsePayload(bitsToBytes(extractBits(imageData)));
  }

  function drawTo(ctx, img) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = () => resolve({ img: im, url });
      im.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("falha ao ler imagem"));
      };
      im.src = url;
    });
  }

  function loadImageFromUrl(url, label) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("falha ao carregar " + label));
      im.src = url;
    });
  }

  async function loadFile(file) {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    const { img, url } = await loadImageFromBlob(file);
    currentObjectUrl = url;
    currentImage = img;
    fileName.textContent = file.name;
    drawTo(pctx, img);
  }

  async function loadDefaultImage() {
    const img = await loadImageFromUrl(DEFAULT_IMAGE, DEFAULT_IMAGE);
    currentImage = img;
    fileName.textContent = DEFAULT_IMAGE;
    drawTo(pctx, img);
  }

  function toBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), type, quality);
    });
  }

  async function decodeBlobAsImage(blob) {
    const { img, url } = await loadImageFromBlob(blob);
    try {
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      const x = c.getContext("2d", {
        willReadFrequently: true,
        alpha: false,
        colorSpace: "srgb",
      });
      drawTo(x, img);
      return decodeFromImageData(x.getImageData(0, 0, SIZE, SIZE));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function encodeFlow() {
    if (!currentImage) throw new Error("no image selected");
    const text = msgArea.value;
    if (!text) throw new Error("empty message");

    setStatus("encoding DCT+XOR (pode levar alguns segundos)…", "");
    await new Promise((r) => setTimeout(r, 20));

    drawTo(pctx, currentImage);
    let id = pctx.getImageData(0, 0, SIZE, SIZE);
    const payload = buildPayload(text);
    id = embedBits(id, bytesToBits(payload));
    pctx.putImageData(id, 0, 0);

    const t1 = decodeFromImageData(pctx.getImageData(0, 0, SIZE, SIZE));
    if (t1 !== text) throw new Error("selftest canvas: " + JSON.stringify(t1));

    const png = await toBlob(preview, "image/png");
    const t2 = await decodeBlobAsImage(png);
    if (t2 !== text) throw new Error("selftest PNG: " + JSON.stringify(t2));

    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1080;
    const x = c.getContext("2d", { alpha: false, colorSpace: "srgb" });
    x.drawImage(preview, 0, 0, 1080, 1080);
    const jpeg = await toBlob(c, "image/jpeg", 0.7);
    const t3 = await decodeBlobAsImage(jpeg);
    if (t3 !== text) {
      throw new Error("selftest JPEG: encurte a msg. got=" + JSON.stringify(t3));
    }

    return { blob: png, bytes: payload.length };
  }

  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function decodeFlow(img) {
    const c = document.createElement("canvas");
    c.width = SIZE;
    c.height = SIZE;
    const x = c.getContext("2d", {
      willReadFrequently: true,
      alpha: false,
      colorSpace: "srgb",
    });
    drawTo(x, img);
    let t = decodeFromImageData(x.getImageData(0, 0, SIZE, SIZE));
    if (t !== null) return t;

    x.fillStyle = "#000";
    x.fillRect(0, 0, SIZE, SIZE);
    const r = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    const dw = img.naturalWidth * r;
    const dh = img.naturalHeight * r;
    x.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
    return decodeFromImageData(x.getImageData(0, 0, SIZE, SIZE));
  }

  fileInput.addEventListener("change", async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    try {
      await loadFile(f);
    } catch (e) {
      setStatus("error: " + e.message, "error");
    }
  });

  encodeBtn.addEventListener("click", async () => {
    if (!currentImage) {
      setStatus("no image selected", "error");
      return;
    }
    encodeBtn.disabled = true;
    try {
      const { blob } = await encodeFlow();
      downloadBlob(blob, "kovil_stego_dct.png");
      msgArea.value = "";
      setStatus("message extracted", "success");
    } catch (err) {
      setStatus("error: " + err.message + "\nPNG NÃO salvo.", "error");
    }
    encodeBtn.disabled = false;
  });

  decodeBtn.addEventListener("click", async () => {
    if (!currentImage) {
      setStatus("no image selected", "error");
      return;
    }
    decodeBtn.disabled = true;
    setStatus("decoding DCT+XOR…", "");
    try {
      const text = await decodeFlow(currentImage);
      if (text === null || text === "") setStatus("no message found or corrupted", "error");
      else {
        msgArea.value = text;
        setStatus("message extracted", "success");
      }
    } catch (err) {
      setStatus("error: " + err.message, "error");
    }
    decodeBtn.disabled = false;
  });

  loadDefaultImage().catch((e) => setStatus("error: " + e.message, "error"));
})();
