(() => {
  const SIZE = 1024;
  const BS = 8;
  const GRID = SIZE / BS;
  const BLOCKS = GRID * GRID;

  // --- DCT mid-band + XOR (K0V1L) ---
  const REPS = 7;
  const STRENGTH = 28;
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

  // --- Ztegonography (brightness parity) ---
  const Z_REPEAT = 7;
  const Z_Q_STEP = 4;

  const DEFAULT_IMAGE = "assets/kovil.jpg";

  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const msgArea = document.getElementById("msgArea");
  const encodeBtn = document.getElementById("encodeBtn");
  const decodeBtn = document.getElementById("decodeBtn");
  const statusEl = document.getElementById("status");
  const algoBtns = document.querySelectorAll("[data-algo]");

  let currentImage = null;
  let currentObjectUrl = null;
  let encodeAlgo = "dct"; // "dct" | "zteg"
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

  function maxBodyDct() {
    return Math.floor(CAP_BITS / 8) - 10;
  }

  function maxBodyZteg() {
    const totalBlocks = BLOCKS;
    const maxVoted = Math.floor(totalBlocks / Z_REPEAT);
    // 16 len + 8*n + 8 crc
    return Math.floor((maxVoted - 24) / 8);
  }

  function buildPayloadDct(text) {
    const body = te.encode(text);
    if (body.length > maxBodyDct()) {
      throw new Error("mensagem longa demais (máx " + maxBodyDct() + " bytes)");
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

  function parsePayloadDct(bytes) {
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
    const text = td.decode(bytes.subarray(6, 6 + len));
    return isSaneMessage(text) ? text : null;
  }

  function textToZtegBits(text) {
    const bytes = te.encode(text);
    if (bytes.length > maxBodyZteg()) {
      throw new Error("mensagem longa demais (máx " + maxBodyZteg() + " bytes)");
    }
    const bits = [];
    const len = bytes.length;
    for (let i = 15; i >= 0; i--) bits.push((len >> i) & 1);
    for (const b of bytes) {
      for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    }
    let crc = 0;
    for (const b of bytes) crc ^= b;
    for (let i = 7; i >= 0; i--) bits.push((crc >> i) & 1);
    return bits;
  }

  function bitsToZtegText(votedBits) {
    if (votedBits.length < 16) return null;
    let len = 0;
    for (let i = 0; i < 16; i++) len = (len << 1) | votedBits[i];
    if (len < 1 || len > 2048 || 16 + len * 8 + 8 > votedBits.length) return null;
    const bytes = [];
    for (let i = 16; i < 16 + len * 8; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | votedBits[i + j];
      bytes.push(b);
    }
    let crc = 0;
    for (const b of bytes) crc ^= b;
    let recvCrc = 0;
    for (let i = 16 + len * 8; i < 16 + len * 8 + 8; i++) {
      recvCrc = (recvCrc << 1) | votedBits[i];
    }
    if (crc !== recvCrc) return null;
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
      return isSaneMessage(text) ? text : null;
    } catch {
      return null;
    }
  }

  /** Reject noise / chiado that happens to pass a weak checksum. */
  function isSaneMessage(text) {
    if (typeof text !== "string" || !text.length) return false;
    if (text.length > 2048) return false;
    let printable = 0;
    let ctrl = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 9 || c === 10 || c === 13) {
        printable++;
        continue;
      }
      if (c < 32 || c === 0x7f) {
        ctrl++;
        continue;
      }
      printable++;
    }
    if (ctrl / text.length > 0.05) return false;
    if (printable / text.length < 0.9) return false;
    // Reject pure high-entropy garbage (no letters/digits)
    if (!/[\p{L}\p{N}]/u.test(text) && text.length > 4) return false;
    return true;
  }

  function scoreMessage(text) {
    if (!text) return -1;
    let s = text.length;
    let letters = 0;
    for (let i = 0; i < text.length; i++) {
      if (/[\p{L}\p{N}\s.,!?;:'"()\-_/\\@$%#&+=\[\]]/u.test(text[i])) letters++;
    }
    s += (letters / text.length) * 100;
    return s;
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

  function embedBitsDct(imageData, payloadBits) {
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

  function extractBitsDct(imageData) {
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

  function decodeDctFromImageData(imageData) {
    return parsePayloadDct(bitsToBytes(extractBitsDct(imageData)));
  }

  // --- Ztegonography embed / extract ---
  function applyBlur(data, W, H) {
    const temp = new Uint8ClampedArray(data);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const norm = 16;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = (y * W + x) * 4;
        let r = 0,
          g = 0,
          b = 0;
        let kpos = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const s = ((y + dy) * W + (x + dx)) * 4;
            const weight = kernel[kpos++];
            r += temp[s] * weight;
            g += temp[s + 1] * weight;
            b += temp[s + 2] * weight;
          }
        }
        data[idx] = r / norm;
        data[idx + 1] = g / norm;
        data[idx + 2] = b / norm;
      }
    }
  }

  function embedBitsZteg(imageData, repeatedBits, W, H) {
    const data = imageData.data;
    const blocksX = W / BS;
    const blocksY = H / BS;
    let bitIdx = 0;
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        if (bitIdx >= repeatedBits.length) break;
        const bit = repeatedBits[bitIdx];
        let sumY = 0;
        for (let py = by * BS; py < (by + 1) * BS; py++) {
          for (let px = bx * BS; px < (bx + 1) * BS; px++) {
            const idx = (py * W + px) * 4;
            sumY += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          }
        }
        const meanY = sumY / (BS * BS);
        let k = Math.round(meanY / Z_Q_STEP);
        if ((k & 1) !== bit) {
          k = meanY >= k * Z_Q_STEP ? k + 1 : k - 1;
        }
        const targetY = k * Z_Q_STEP;
        const delta = targetY - meanY;
        for (let py = by * BS; py < (by + 1) * BS; py++) {
          for (let px = bx * BS; px < (bx + 1) * BS; px++) {
            const idx = (py * W + px) * 4;
            data[idx] = Math.min(255, Math.max(0, data[idx] + delta));
            data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta));
            data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta));
          }
        }
        bitIdx++;
      }
      if (bitIdx >= repeatedBits.length) break;
    }
    applyBlur(data, W, H);
    return imageData;
  }

  function extractRawBitsZteg(imageData, W, H, totalBits) {
    const data = imageData.data;
    const blocksX = W / BS;
    const blocksY = H / BS;
    const bits = [];
    let bitIdx = 0;
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        if (bitIdx >= totalBits) break;
        let sumY = 0;
        for (let py = by * BS; py < (by + 1) * BS; py++) {
          for (let px = bx * BS; px < (bx + 1) * BS; px++) {
            const idx = (py * W + px) * 4;
            sumY += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          }
        }
        const meanY = sumY / (BS * BS);
        const k = Math.round(meanY / Z_Q_STEP);
        bits.push(k & 1);
        bitIdx++;
      }
      if (bitIdx >= totalBits) break;
    }
    return bits;
  }

  function decodeZtegFromImageData(imageData) {
    const W = imageData.width;
    const H = imageData.height;
    const totalBlocks = (W / BS) * (H / BS);
    const rawBits = extractRawBitsZteg(imageData, W, H, totalBlocks);
    const totalRepeated = Math.floor(rawBits.length / Z_REPEAT) * Z_REPEAT;
    const votedBits = [];
    for (let i = 0; i < totalRepeated; i += Z_REPEAT) {
      let sum = 0;
      for (let j = 0; j < Z_REPEAT; j++) sum += rawBits[i + j];
      votedBits.push(sum > Z_REPEAT / 2 ? 1 : 0);
    }
    return bitsToZtegText(votedBits);
  }

  function drawTo(ctx, img) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
  }

  /** Canvas novo a cada uso — evita canvas “tainted” (CORS / file://). */
  function workCanvas() {
    const c = document.createElement("canvas");
    c.width = SIZE;
    c.height = SIZE;
    const ctx = c.getContext("2d", {
      willReadFrequently: true,
      alpha: false,
      colorSpace: "srgb",
    });
    return { canvas: c, ctx };
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

  async function loadImageAsBlobUrl(url, label) {
    // Sempre passa por blob URL pra getImageData funcionar (incl. file:// / Netlify).
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await loadImageFromBlob(await res.blob());
    } catch (e) {
      throw new Error("falha ao carregar " + label + ": " + e.message);
    }
  }

  async function loadFile(file) {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    const { img, url } = await loadImageFromBlob(file);
    currentObjectUrl = url;
    currentImage = img;
    fileName.textContent = file.name;
  }

  async function loadDefaultImage() {
    try {
      const { img, url } = await loadImageAsBlobUrl(DEFAULT_IMAGE, DEFAULT_IMAGE);
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = url;
      currentImage = img;
    } catch {
      // Sem servidor local (file://) o fetch pode falhar — usuário escolhe a imagem.
      currentImage = null;
    }
  }

  function toBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), type, quality);
    });
  }

  /** Draw image into 1024 canvas with several layouts used by social apps. */
  function layoutsFor(img) {
    const layouts = [];
    const make = (drawFn) => {
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      const x = c.getContext("2d", {
        willReadFrequently: true,
        alpha: false,
        colorSpace: "srgb",
      });
      drawFn(x);
      return x.getImageData(0, 0, SIZE, SIZE);
    };

    if (img.naturalWidth >= SIZE && img.naturalHeight >= SIZE) {
      layouts.push(
        make((x) => {
          const sx = Math.floor((img.naturalWidth - SIZE) / 2);
          const sy = Math.floor((img.naturalHeight - SIZE) / 2);
          x.fillStyle = "#000";
          x.fillRect(0, 0, SIZE, SIZE);
          x.drawImage(img, sx, sy, SIZE, SIZE, 0, 0, SIZE, SIZE);
        })
      );
    }

    layouts.push(
      make((x) => {
        drawTo(x, img);
      })
    );

    layouts.push(
      make((x) => {
        x.fillStyle = "#000";
        x.fillRect(0, 0, SIZE, SIZE);
        const r = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
        const dw = img.naturalWidth * r;
        const dh = img.naturalHeight * r;
        x.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
      })
    );

    return layouts;
  }

  function pickBestDecode(candidates) {
    let best = null;
    let bestScore = -1;
    let bestAlgo = null;
    for (const c of candidates) {
      if (!c || c.text == null || c.text === "") continue;
      const sc = scoreMessage(c.text);
      if (sc > bestScore) {
        bestScore = sc;
        best = c.text;
        bestAlgo = c.algo;
      }
    }
    return best == null ? null : { text: best, algo: bestAlgo };
  }

  async function decodeFlow(img) {
    const candidates = [];
    const layouts = layoutsFor(img);

    for (const id of layouts) {
      const dct = decodeDctFromImageData(id);
      if (dct != null) candidates.push({ text: dct, algo: "dct" });
      const zteg = decodeZtegFromImageData(id);
      if (zteg != null) candidates.push({ text: zteg, algo: "zteg" });
      if (candidates.length) break; // first layout that yields anything
    }

    // If nothing yet, still scan all remaining (already done above in loop)
    const picked = pickBestDecode(candidates);
    return picked;
  }

  async function decodeBlobAsImageDct(blob) {
    const { img, url } = await loadImageFromBlob(blob);
    try {
      for (const id of layoutsFor(img)) {
        const t = decodeDctFromImageData(id);
        if (t !== null) return t;
      }
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function decodeBlobAsImageZteg(blob) {
    const { img, url } = await loadImageFromBlob(blob);
    try {
      for (const id of layoutsFor(img)) {
        const t = decodeZtegFromImageData(id);
        if (t !== null) return t;
      }
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function encodeFlowDct(text) {
    setStatus("encoding DCT+XOR (pode levar alguns segundos)…", "");
    await new Promise((r) => setTimeout(r, 20));

    const { canvas, ctx } = workCanvas();
    drawTo(ctx, currentImage);
    let id = ctx.getImageData(0, 0, SIZE, SIZE);
    const payload = buildPayloadDct(text);
    id = embedBitsDct(id, bytesToBits(payload));
    ctx.putImageData(id, 0, 0);

    const t1 = decodeDctFromImageData(ctx.getImageData(0, 0, SIZE, SIZE));
    if (t1 !== text) throw new Error("selftest canvas: " + JSON.stringify(t1));

    const png = await toBlob(canvas, "image/png");
    const t2 = await decodeBlobAsImageDct(png);
    if (t2 !== text) throw new Error("selftest PNG: " + JSON.stringify(t2));

    // JPEG Instagram-size: letterbox (sem stretch)
    const IG = 1080;
    const c = document.createElement("canvas");
    c.width = IG;
    c.height = IG;
    const x = c.getContext("2d", { alpha: false, colorSpace: "srgb" });
    x.fillStyle = "#000";
    x.fillRect(0, 0, IG, IG);
    const ox = Math.floor((IG - SIZE) / 2);
    const oy = Math.floor((IG - SIZE) / 2);
    x.drawImage(canvas, ox, oy);

    let t3 = null;
    const qualities = [0.95, 0.92, 0.88];
    for (const q of qualities) {
      const jpeg = await toBlob(c, "image/jpeg", q);
      t3 = await decodeBlobAsImageDct(jpeg);
      if (t3 === text) break;
    }
    if (t3 !== text) {
      throw new Error("selftest JPEG: encurte a msg. got=" + JSON.stringify(t3));
    }

    // Cross-check: ZTEG must NOT invent a fake message
    const cross = await decodeBlobAsImageZteg(png);
    if (cross != null && cross !== text) {
      throw new Error("conflito: ZTEG leu mensagem falsa do DCT");
    }

    return { blob: png, name: "kovil_stego_dct.png" };
  }

  async function encodeFlowZteg(text) {
    setStatus("encoding ZTEG brightness…", "");
    await new Promise((r) => setTimeout(r, 20));

    const { canvas, ctx } = workCanvas();
    drawTo(ctx, currentImage);
    let id = ctx.getImageData(0, 0, SIZE, SIZE);
    const bits = textToZtegBits(text);
    const repeatedBits = [];
    for (const b of bits) {
      for (let i = 0; i < Z_REPEAT; i++) repeatedBits.push(b);
    }
    if (repeatedBits.length > BLOCKS) throw new Error("message too large");
    embedBitsZteg(id, repeatedBits, SIZE, SIZE);
    ctx.putImageData(id, 0, 0);

    const t1 = decodeZtegFromImageData(ctx.getImageData(0, 0, SIZE, SIZE));
    if (t1 !== text) throw new Error("selftest canvas: " + JSON.stringify(t1));

    const png = await toBlob(canvas, "image/png");
    const t2 = await decodeBlobAsImageZteg(png);
    if (t2 !== text) throw new Error("selftest PNG: " + JSON.stringify(t2));

    // Cross-check: DCT must NOT invent a fake message
    const cross = await decodeBlobAsImageDct(png);
    if (cross != null && cross !== text) {
      throw new Error("conflito: DCT leu mensagem falsa do ZTEG");
    }

    return { blob: png, name: "stego.png" };
  }

  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function setAlgo(algo) {
    encodeAlgo = algo;
    for (const btn of algoBtns) {
      btn.classList.toggle("active", btn.dataset.algo === algo);
      btn.setAttribute("aria-pressed", btn.dataset.algo === algo ? "true" : "false");
    }
  }

  for (const btn of algoBtns) {
    btn.addEventListener("click", () => setAlgo(btn.dataset.algo));
  }
  setAlgo(encodeAlgo);

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
    const text = msgArea.value;
    if (!text) {
      setStatus("empty message", "error");
      return;
    }
    encodeBtn.disabled = true;
    try {
      const { blob, name } =
        encodeAlgo === "zteg" ? await encodeFlowZteg(text) : await encodeFlowDct(text);
      downloadBlob(blob, name);
      msgArea.value = "";
      const label = encodeAlgo === "zteg" ? "ZTEG" : "DCT+XOR";
      setStatus("PNG salvo (" + label + " · selftest OK)", "success");
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
    setStatus("decoding (DCT + ZTEG)…", "");
    try {
      const result = await decodeFlow(currentImage);
      if (!result) setStatus("no message found or corrupted", "error");
      else {
        msgArea.value = result.text;
        const label = result.algo === "zteg" ? "ZTEG" : "DCT+XOR";
        setStatus("message extracted (" + label + ")", "success");
      }
    } catch (err) {
      setStatus("error: " + err.message, "error");
    }
    decodeBtn.disabled = false;
  });

  loadDefaultImage().catch((e) => setStatus("error: " + e.message, "error"));
})();
