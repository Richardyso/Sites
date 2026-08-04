(() => {
  // Dual engines:
  // 1) Ztegonography (zr0n) — 8×8 mean QIM, JPEG-resistant
  // 2) StegOnline-style LSB + strings (Ge0rg3/StegOnline ExtractDataService)
  // Encode keeps Ztegonography only (LSB would fight QIM on the same pixels).

  const BS = 8;
  const REPEAT = 7;
  const Q_STEP = 4;
  const ENCODE_W = 1024;
  const ENCODE_H = 1024;
  const DEFAULT_IMAGE = "assets/kovil.jpg";
  const LSB_MIN_STRING = 8;
  const LSB_MAX_SCAN_BYTES = 64 * 1024;

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
  let currentFileBytes = null;

  function setStatus(msg, kind = "") {
    statusEl.textContent = msg;
    statusEl.className = kind;
  }

  /* ---------- Ztegonography ---------- */

  function textToBits(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
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

  function bitsToText(votedBits) {
    if (votedBits.length < 16) return null;
    let len = 0;
    for (let i = 0; i < 16; i++) len = (len << 1) | votedBits[i];
    if (len < 0 || len > 2048 || 16 + len * 8 + 8 > votedBits.length) return null;
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
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  function applyBlur(data, W, H) {
    const temp = new Uint8ClampedArray(data);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const norm = 16;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = (y * W + x) * 4;
        let r = 0;
        let g = 0;
        let b = 0;
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

  function embedBitsIntoImage(imageData, repeatedBits, W, H) {
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
        let k = Math.round(meanY / Q_STEP);
        if ((k & 1) !== bit) {
          k = meanY >= k * Q_STEP ? k + 1 : k - 1;
        }
        const targetY = k * Q_STEP;
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

  function extractRawBits(imageData, W, H, totalBits) {
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
        const k = Math.round(meanY / Q_STEP);
        bits.push(k & 1);
        bitIdx++;
      }
      if (bitIdx >= totalBits) break;
    }
    return bits;
  }

  function encodeImage(source, message, W = ENCODE_W, H = ENCODE_H) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false, colorSpace: "srgb" });
      ctx.drawImage(source, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      const bits = textToBits(message);
      const repeatedBits = [];
      for (const b of bits) {
        for (let i = 0; i < REPEAT; i++) repeatedBits.push(b);
      }
      const totalBlocks = (W / BS) * (H / BS);
      if (repeatedBits.length > totalBlocks) {
        reject(new Error("message too large"));
        return;
      }
      embedBitsIntoImage(imageData, repeatedBits, W, H);
      ctx.putImageData(imageData, 0, 0);
      pctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
    });
  }

  function decodeZtegonography(source, W = ENCODE_W, H = ENCODE_H) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false, colorSpace: "srgb" });
      ctx.drawImage(source, 0, 0, W, H);
      const imageData = ctx.getImageData(0, 0, W, H);
      const totalBlocks = (W / BS) * (H / BS);
      const rawBits = extractRawBits(imageData, W, H, totalBlocks);
      const totalRepeated = Math.floor(rawBits.length / REPEAT) * REPEAT;
      const votedBits = [];
      for (let i = 0; i < totalRepeated; i += REPEAT) {
        let sum = 0;
        for (let j = 0; j < REPEAT; j++) sum += rawBits[i + j];
        votedBits.push(sum > REPEAT / 2 ? 1 : 0);
      }
      resolve(bitsToText(votedBits));
    });
  }

  /* ---------- StegOnline-style LSB (ExtractDataService) ---------- */

  function intToBin8(n) {
    return (n & 255).toString(2).padStart(8, "0");
  }

  function splitChannels(imageData) {
    const d = imageData.data;
    const n = d.length / 4;
    const r = new Uint8Array(n);
    const g = new Uint8Array(n);
    const b = new Uint8Array(n);
    const a = new Uint8Array(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      r[i] = d[p];
      g[i] = d[p + 1];
      b[i] = d[p + 2];
      a[i] = d[p + 3];
    }
    return { r, g, b, a, rgba: d, width: imageData.width, height: imageData.height };
  }

  /**
   * Port of Ge0rg3/StegOnline ExtractDataService.extract
   * Returns Uint8Array of extracted bytes (trim trailing zeros optional).
   */
  function extractLsbBytes(ch, selectedBits, pixelOrder, bitOrder, bitPlaneOrder, trimBits) {
    const cleaned = {};
    for (const c of ["r", "g", "b", "a"]) {
      if (selectedBits[c] && selectedBits[c].length) cleaned[c] = selectedBits[c];
    }
    const colourArrays = { r: ch.r, g: ch.g, b: ch.b, a: ch.a };
    const rgbaChars = "rgba";
    const bitsOut = [];

    function pushBitsFromColour(colour, pixelVal) {
      const pixelBinary = intToBin8(pixelVal).split("");
      let extracted = pixelBinary.filter((_, index) => cleaned[colour].indexOf(7 - index) !== -1);
      if (bitOrder === "LSB") extracted = extracted.reverse();
      for (const bit of extracted) bitsOut.push(bit === "1" ? 1 : 0);
    }

    if (pixelOrder === "Row") {
      for (let i = 0; i < ch.r.length; i++) {
        for (const colour of bitPlaneOrder) {
          if (!cleaned[colour]) continue;
          pushBitsFromColour(colour, colourArrays[colour][i]);
        }
      }
    } else {
      for (let c = 0; c < ch.width; c++) {
        for (let r = 0; r < ch.height; r++) {
          const index = (r * ch.width + c) * 4;
          for (const colour of bitPlaneOrder) {
            if (!cleaned[colour]) continue;
            const colourIndex = rgbaChars.indexOf(colour);
            pushBitsFromColour(colour, ch.rgba[index + colourIndex]);
          }
        }
      }
    }

    const bytes = [];
    for (let i = 0; i + 7 < bitsOut.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bitsOut[i + j];
      bytes.push(b);
    }
    if (trimBits) {
      while (bytes.length && bytes[bytes.length - 1] === 0) bytes.pop();
    }
    return new Uint8Array(bytes);
  }

  function findPrintableStrings(bytes, minLen = LSB_MIN_STRING) {
    const texts = [];
    let buf = "";
    const flush = () => {
      if (buf.length >= minLen) texts.push(buf);
      buf = "";
    };
    const limit = Math.min(bytes.length, LSB_MAX_SCAN_BYTES);
    for (let i = 0; i < limit; i++) {
      const c = bytes[i];
      if (c >= 32 && c <= 126) buf += String.fromCharCode(c);
      else flush();
    }
    flush();
    texts.sort((a, b) => b.length - a.length || a.localeCompare(b));
    return texts;
  }

  function scoreCandidate(text) {
    if (!text) return -1;
    const letters = (text.match(/[A-Za-zÀ-ÿ0-9]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
    return letters * 2 + spaces + Math.min(text.length, 80);
  }

  function nullTerminatedUtf8(bytes) {
    let end = bytes.indexOf(0);
    if (end < 0) end = Math.min(bytes.length, 512);
    if (end < LSB_MIN_STRING) return null;
    const slice = bytes.subarray(0, end);
    if (![...slice].every((c) => (c >= 32 && c <= 126) || c === 9 || c === 10 || c === 13)) {
      return null;
    }
    return new TextDecoder().decode(slice);
  }

  function imageDataFromSource(source, W, H) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true, colorSpace: "srgb" });
    ctx.drawImage(source, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H);
  }

  // Common CTF paths (StegOnline defaults: Row, MSB, r→g→b→a)
  const LSB_PATHS = [
    { name: "R0 row", selected: { r: [0], g: [], b: [], a: [] }, order: "Row" },
    { name: "G0 row", selected: { r: [], g: [0], b: [], a: [] }, order: "Row" },
    { name: "B0 row", selected: { r: [], g: [], b: [0], a: [] }, order: "Row" },
    { name: "RGB0 row", selected: { r: [0], g: [0], b: [0], a: [] }, order: "Row" },
    { name: "BGR0 row", selected: { r: [0], g: [0], b: [0], a: [] }, order: "Row", planes: ["b", "g", "r", "a"] },
    { name: "RGB0 col", selected: { r: [0], g: [0], b: [0], a: [] }, order: "Column" },
    { name: "RGBA0 row", selected: { r: [0], g: [0], b: [0], a: [0] }, order: "Row" },
  ];

  function decodeStegOnlineLsb(source) {
    const W = source.naturalWidth || source.width;
    const H = source.naturalHeight || source.height;
    if (!W || !H) return [];

    const imageData = imageDataFromSource(source, W, H);
    const ch = splitChannels(imageData);
    const hits = [];
    const seen = new Set();

    for (const path of LSB_PATHS) {
      const planes = path.planes || ["r", "g", "b", "a"];
      const bytes = extractLsbBytes(ch, path.selected, path.order, "MSB", planes, true);
      const nt = nullTerminatedUtf8(bytes);
      if (nt && !seen.has(nt)) {
        seen.add(nt);
        hits.push({ engine: "stegonline-lsb", path: path.name, text: nt, score: scoreCandidate(nt) + 20 });
      }
      for (const s of findPrintableStrings(bytes).slice(0, 3)) {
        if (seen.has(s)) continue;
        seen.add(s);
        hits.push({ engine: "stegonline-lsb", path: path.name, text: s, score: scoreCandidate(s) });
      }
    }

    // Also try same paths on 1024 stretch (some tools dump then resize)
    if (W !== ENCODE_W || H !== ENCODE_H) {
      const scaled = imageDataFromSource(source, ENCODE_W, ENCODE_H);
      const ch2 = splitChannels(scaled);
      for (const path of LSB_PATHS.slice(0, 4)) {
        const planes = path.planes || ["r", "g", "b", "a"];
        const bytes = extractLsbBytes(ch2, path.selected, path.order, "MSB", planes, true);
        for (const s of findPrintableStrings(bytes).slice(0, 2)) {
          if (seen.has(s)) continue;
          seen.add(s);
          hits.push({
            engine: "stegonline-lsb",
            path: path.name + " @1024",
            text: s,
            score: scoreCandidate(s) - 5,
          });
        }
      }
    }

    hits.sort((a, b) => b.score - a.score);
    return hits;
  }

  function decodeFileStrings(bytes) {
    if (!bytes || !bytes.length) return [];
    const hits = [];
    const seen = new Set();
    for (const s of findPrintableStrings(bytes, 5).slice(0, 8)) {
      if (seen.has(s)) continue;
      seen.add(s);
      hits.push({
        engine: "stegonline-strings",
        path: "file bytes",
        text: s,
        score: scoreCandidate(s) - 10,
      });
    }
    return hits;
  }

  async function decodeAll(source) {
    const results = [];

    const z = await decodeZtegonography(source);
    if (z) {
      results.push({
        engine: "ztegonography",
        path: "8×8 QIM",
        text: z,
        score: 10_000,
      });
    }

    results.push(...decodeStegOnlineLsb(source));
    results.push(...decodeFileStrings(currentFileBytes));

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /* ---------- UI helpers ---------- */

  function drawTo(ctx, img) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ENCODE_W, ENCODE_H);
    ctx.drawImage(img, 0, 0, ENCODE_W, ENCODE_H);
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
    currentFileBytes = new Uint8Array(await file.arrayBuffer());
    const { img, url } = await loadImageFromBlob(file);
    currentObjectUrl = url;
    currentImage = img;
    fileName.textContent = file.name;
    drawTo(pctx, img);
  }

  async function loadDefaultImage() {
    const img = await loadImageFromUrl(DEFAULT_IMAGE, DEFAULT_IMAGE);
    currentImage = img;
    currentFileBytes = null;
    try {
      const res = await fetch(DEFAULT_IMAGE);
      if (res.ok) currentFileBytes = new Uint8Array(await res.arrayBuffer());
    } catch (_) {
      /* ignore */
    }
    fileName.textContent = DEFAULT_IMAGE;
    drawTo(pctx, img);
  }

  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
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
    const msg = msgArea.value;
    if (!msg.trim()) {
      setStatus("enter message", "error");
      return;
    }
    encodeBtn.disabled = true;
    setStatus("encoding (ztegonography)...", "");
    try {
      const blob = await encodeImage(currentImage, msg);
      downloadBlob(blob, "stego.png");
      msgArea.value = "";
      setStatus("encoded · ztegonography · png", "success");
    } catch (err) {
      setStatus("error: " + err.message, "error");
    }
    encodeBtn.disabled = false;
  });

  decodeBtn.addEventListener("click", async () => {
    if (!currentImage) {
      setStatus("no image selected", "error");
      return;
    }
    decodeBtn.disabled = true;
    setStatus("decoding (ztegonography → stegonline)...", "");
    try {
      const hits = await decodeAll(currentImage);
      if (!hits.length) {
        setStatus("no message found or corrupted", "error");
      } else {
        const best = hits[0];
        msgArea.value = best.text;
        const alt = hits.length > 1 ? ` · +${hits.length - 1} alt` : "";
        setStatus(`message extracted · ${best.engine}${best.path ? " / " + best.path : ""}${alt}`, "success");
      }
    } catch (err) {
      setStatus("error: " + err.message, "error");
    }
    decodeBtn.disabled = false;
  });

  loadDefaultImage().catch((e) => setStatus("error: " + e.message, "error"));
})();
