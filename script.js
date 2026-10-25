/**
 * ============================================================
 * script.js  —  Arch-Bit: Low-Level Data Translator v2
 * Mata Kuliah: Arsitektur dan Organisasi Komputer
 *
 * FITUR BARU:
 *   ✦ Bidirectional conversion — 5 mode bolak-balik:
 *       1. text-to-both  : Text  → Binary + Hex
 *       2. bin-to-text   : Binary → Text
 *       3. hex-to-text   : Hex   → Text
 *       4. bin-to-hex    : Binary → Hex
 *       5. hex-to-bin    : Hex   → Binary
 *   ✦ Linux terminal UI (matrix rain, boot sequence, live clock)
 *   ✦ Line number gutter pada input panel
 *   ✦ Paste button (Clipboard API read)
 *   ✦ Error bar untuk input tidak valid
 * ============================================================
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. DOM REFERENCES
   ══════════════════════════════════════════════════════════ */
const inputArea        = document.getElementById('inputArea');
const outputAreaA      = document.getElementById('outputAreaA');
const outputAreaB      = document.getElementById('outputAreaB');
const outputPanelB     = document.getElementById('outputPanelB');
const inputPanelTitle  = document.getElementById('inputPanelTitle');
const inputPanelBadge  = document.getElementById('inputPanelBadge');
const inputHint        = document.getElementById('inputHint');
const inputInfo        = document.getElementById('inputInfo');
const outputATitleEl   = document.getElementById('outputATitleEl');
const outputABadge     = document.getElementById('outputABadge');
const outputAHint      = document.getElementById('outputAHint');
const outputBTitleEl   = document.getElementById('outputBTitleEl');
const outputBBadge     = document.getElementById('outputBBadge');
const outputBHint      = document.getElementById('outputBHint');
const charCountDisplay = document.getElementById('charCount');
const byteCountDisplay = document.getElementById('byteCount');
const modeLabel        = document.getElementById('modeLabel');
const breakdownBody    = document.getElementById('breakdownBody');
const tablePlaceholder = document.getElementById('tablePlaceholder');
const tableRowCount    = document.getElementById('tableRowCount');
const clearBtn         = document.getElementById('clearBtn');
const pasteBtn         = document.getElementById('pasteBtn');
const lineNumbers      = document.getElementById('lineNumbers');
const errorBar         = document.getElementById('errorBar');
const errorMsg         = document.getElementById('errorMsg');
const modeTabs         = document.querySelectorAll('.mode-tab');
const copyBtns         = document.querySelectorAll('.copy-btn');

/* ══════════════════════════════════════════════════════════
   2. STATE
   ══════════════════════════════════════════════════════════ */
let currentMode = 'text-to-both'; // default mode

/* ══════════════════════════════════════════════════════════
   3. CORE CONVERSION FUNCTIONS
   ══════════════════════════════════════════════════════════ */

// ── 3a. Text → Binary / Hex ──────────────────────────────

/**
 * Satu karakter → biner 8-bit.
 *   charCodeAt(0) → desimal ASCII
 *   toString(2)   → string biner (mungkin < 8 digit)
 *   padStart(8)   → padded ke tepat 8 bit (1 byte)
 *
 * @param {string} char
 * @returns {string}  e.g. 'A' → '01000001'
 */
function charToBinary(char) {
  return char.charCodeAt(0).toString(2).padStart(8, '0');
}

/**
 * Satu karakter → hex 2-digit uppercase.
 *   charCodeAt(0) → desimal
 *   toString(16)  → hex lowercase
 *   padStart(2)   → selalu 2 digit (mis. '\t' (9) → '09')
 *
 * @param {string} char
 * @returns {string}  e.g. 'A' → '41'
 */
function charToHex(char) {
  return char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * String teks → deretan blok biner 8-bit, dipisah spasi.
 * Menggunakan chain: split → map → join
 *
 * @param {string} text
 * @returns {string}  e.g. 'Hi' → '01001000 01101001'
 */
function textToBinary(text) {
  return text.split('').map(charToBinary).join(' ');
}

/**
 * String teks → deretan pasang digit hex, dipisah spasi.
 *
 * @param {string} text
 * @returns {string}  e.g. 'Hi' → '48 69'
 */
function textToHex(text) {
  return text.split('').map(charToHex).join(' ');
}

// ── 3b. Binary → Text / Hex ──────────────────────────────

/**
 * Membersihkan string biner: hapus semua karakter selain 0 dan 1,
 * lalu pecah menjadi array blok 8-bit.
 *
 * Input bisa berupa:
 *   "01001000 01101001"  → spasi sebagai separator
 *   "0100100001101001"   → tanpa spasi (rawai panjang)
 *
 * @param {string} raw  - Input biner mentah dari user
 * @returns {{ valid: boolean, blocks: string[] }}
 */
function parseBinaryInput(raw) {
  // Hapus semua karakter selain 0 dan 1
  const clean = raw.replace(/[^01]/g, '');

  if (clean.length === 0) return { valid: false, blocks: [] };

  // Panjang harus kelipatan 8 (tiap byte = 8 bit)
  if (clean.length % 8 !== 0) {
    return {
      valid: false,
      blocks: [],
      error: `Panjang bit ${clean.length} bukan kelipatan 8. Kurang ${8 - (clean.length % 8)} bit.`
    };
  }

  // Pecah ke blok 8-bit
  const blocks = clean.match(/.{8}/g); // regex: ambil 8 karakter per grup
  return { valid: true, blocks };
}

/**
 * Satu blok biner 8-bit → karakter teks.
 *   parseInt(bin, 2) → konversi dari basis 2 ke desimal
 *   String.fromCharCode() → kembalikan karakter dari kode ASCII
 *
 * @param {string} block  - 8-bit biner, contoh: '01001000'
 * @returns {string}  karakter, contoh: 'H'
 */
function binaryBlockToChar(block) {
  const decimal = parseInt(block, 2); // basis 2 → desimal
  return String.fromCharCode(decimal); // desimal → karakter
}

/**
 * Deretan biner → string teks.
 * Parsing → validasi → map tiap blok ke karakter → join.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, result: string, error?: string }}
 */
function binaryToText(raw) {
  const { valid, blocks, error } = parseBinaryInput(raw);
  if (!valid) return { ok: false, result: '', error: error || 'Input biner tidak valid.' };
  const text = blocks.map(binaryBlockToChar).join('');
  return { ok: true, result: text };
}

/**
 * Deretan biner → deretan hex.
 * Setiap blok 8-bit dikonversi ke hex 2-digit.
 *   parseInt(block, 2) → desimal dari biner
 *   toString(16)       → hex
 *
 * @param {string} raw
 * @returns {{ ok: boolean, result: string, error?: string }}
 */
function binaryToHex(raw) {
  const { valid, blocks, error } = parseBinaryInput(raw);
  if (!valid) return { ok: false, result: '', error: error || 'Input biner tidak valid.' };
  const hex = blocks
    .map(block => parseInt(block, 2).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
  return { ok: true, result: hex };
}

// ── 3c. Hex → Text / Binary ──────────────────────────────

/**
 * Membersihkan string hex dan pecah menjadi array pasang digit.
 * Mendukung format: "48 69", "4869", "0x48 0x69", "48,69"
 *
 * @param {string} raw
 * @returns {{ valid: boolean, pairs: string[], error?: string }}
 */
function parseHexInput(raw) {
  // Hapus prefix "0x", karakter non-hex, lalu ambil pasangan digit
  const clean = raw.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');

  if (clean.length === 0) return { valid: false, pairs: [] };

  if (clean.length % 2 !== 0) {
    return {
      valid: false,
      pairs: [],
      error: `Panjang hex ${clean.length} digit ganjil. Pastikan setiap byte = 2 digit hex.`
    };
  }

  // Pecah ke pasangan 2-digit
  const pairs = clean.match(/.{2}/g); // regex: ambil 2 karakter per grup
  return { valid: true, pairs };
}

/**
 * Satu pasang hex → karakter teks.
 *   parseInt(hex, 16) → konversi dari basis 16 ke desimal
 *   String.fromCharCode() → karakter
 *
 * @param {string} pair  - 2-digit hex, contoh: '48'
 * @returns {string}  karakter, contoh: 'H'
 */
function hexPairToChar(pair) {
  const decimal = parseInt(pair, 16); // basis 16 → desimal
  return String.fromCharCode(decimal);
}

/**
 * Deretan hex → string teks.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, result: string, error?: string }}
 */
function hexToText(raw) {
  const { valid, pairs, error } = parseHexInput(raw);
  if (!valid) return { ok: false, result: '', error: error || 'Input hex tidak valid.' };
  const text = pairs.map(hexPairToChar).join('');
  return { ok: true, result: text };
}

/**
 * Deretan hex → deretan biner 8-bit.
 *   parseInt(pair, 16) → desimal dari hex
 *   toString(2).padStart(8) → biner 8-bit
 *
 * @param {string} raw
 * @returns {{ ok: boolean, result: string, error?: string }}
 */
function hexToBinary(raw) {
  const { valid, pairs, error } = parseHexInput(raw);
  if (!valid) return { ok: false, result: '', error: error || 'Input hex tidak valid.' };
  const binary = pairs
    .map(pair => parseInt(pair, 16).toString(2).padStart(8, '0'))
    .join(' ');
  return { ok: true, result: binary };
}

/* ══════════════════════════════════════════════════════════
   4. MODE CONFIGURATION
   ══════════════════════════════════════════════════════════ */

/**
 * Konfigurasi tiap mode konversi:
 *   label       → teks di header stats bar
 *   inputTitle  → judul panel input
 *   inputBadge  → badge info encoding input
 *   inputHint   → hint JS method di footer input
 *   inputPH     → placeholder textarea input
 *   outputATitle, outputABadge, outputAHint → panel output pertama
 *   outputBTitle, outputBBadge, outputBHint → panel output kedua (jika ada)
 *   showPanelB  → apakah panel output B ditampilkan
 *   convert     → fungsi konversi utama, dipanggil saat input berubah
 */
const MODE_CONFIG = {
  'text-to-both': {
    label:        'TEXT → BIN / HEX',
    inputTitle:   'TEXT INPUT',
    inputBadge:   'ASCII / UTF-8',
    inputHint:    'charCodeAt(0) per char',
    inputPH:      'Ketik teks di sini...',
    outputATitle: 'BINARY',
    outputABadge: 'Base-2 · 8-bit',
    outputAHint:  ".toString(2).padStart(8,'0')",
    outputAClass: 'output-area',
    outputBTitle: 'HEXADECIMAL',
    outputBBadge: 'Base-16 · Memory',
    outputBHint:  '.toString(16).toUpperCase()',
    outputBClass: 'output-area output-hex',
    showPanelB:   true,
    convert(raw) {
      if (!raw) return { a: '', b: '', ok: true };
      return { a: textToBinary(raw), b: textToHex(raw), ok: true };
    }
  },
  'bin-to-text': {
    label:        'BINARY → TEXT',
    inputTitle:   'BINARY INPUT',
    inputBadge:   'Base-2 · 8-bit blocks',
    inputHint:    'pisahkan per byte, mis: 01001000 01101001',
    inputPH:      'Ketik binary, contoh: 01001000 01101001',
    outputATitle: 'TEXT OUTPUT',
    outputABadge: 'ASCII / UTF-8',
    outputAHint:  'parseInt(bin,2) → fromCharCode()',
    outputAClass: 'output-area output-text',
    showPanelB:   false,
    convert(raw) {
      if (!raw.trim()) return { a: '', ok: true };
      return binaryToText(raw);
    }
  },
  'hex-to-text': {
    label:        'HEX → TEXT',
    inputTitle:   'HEX INPUT',
    inputBadge:   'Base-16 · supports 0x prefix',
    inputHint:    'pisahkan per byte, mis: 48 69 atau 0x48 0x69',
    inputPH:      'Ketik hex, contoh: 48 65 6C 6C 6F',
    outputATitle: 'TEXT OUTPUT',
    outputABadge: 'ASCII / UTF-8',
    outputAHint:  'parseInt(hex,16) → fromCharCode()',
    outputAClass: 'output-area output-text',
    showPanelB:   false,
    convert(raw) {
      if (!raw.trim()) return { a: '', ok: true };
      return hexToText(raw);
    }
  },
  'bin-to-hex': {
    label:        'BINARY → HEX',
    inputTitle:   'BINARY INPUT',
    inputBadge:   'Base-2 · 8-bit',
    inputHint:    'kelipatan 8-bit per byte',
    inputPH:      'Ketik binary, contoh: 01001000 01101001',
    outputATitle: 'HEXADECIMAL',
    outputABadge: 'Base-16 · Memory',
    outputAHint:  'parseInt(bin,2).toString(16)',
    outputAClass: 'output-area output-hex',
    showPanelB:   false,
    convert(raw) {
      if (!raw.trim()) return { a: '', ok: true };
      return binaryToHex(raw);
    }
  },
  'hex-to-bin': {
    label:        'HEX → BINARY',
    inputTitle:   'HEX INPUT',
    inputBadge:   'Base-16 · supports 0x prefix',
    inputHint:    'mis: 48 65 6C atau 486C',
    inputPH:      'Ketik hex, contoh: 41 72 63 68',
    outputATitle: 'BINARY',
    outputABadge: 'Base-2 · 8-bit',
    outputAHint:  'parseInt(hex,16).toString(2).padStart(8)',
    outputAClass: 'output-area',
    showPanelB:   false,
    convert(raw) {
      if (!raw.trim()) return { a: '', ok: true };
      return hexToBinary(raw);
    }
  }
};

/* ══════════════════════════════════════════════════════════
   5. UI HELPERS
   ══════════════════════════════════════════════════════════ */

/** Tampilkan error bar dengan pesan */
function showError(msg) {
  errorMsg.textContent = msg;
  errorBar.classList.remove('hidden');
}

/** Sembunyikan error bar */
function hideError() {
  errorBar.classList.add('hidden');
  errorMsg.textContent = '';
}

/**
 * Perbarui atribut CSS class pada elemen output area.
 * Reset dulu semua class output, lalu tambahkan yang baru.
 */
function setOutputClass(el, classString) {
  el.className = 'term-textarea ' + classString;
}

/**
 * Update line numbers di gutter input panel.
 * Hitung jumlah baris dari newline + 1, render sebagai div.
 */
function updateLineNumbers() {
  const lines     = inputArea.value.split('\n').length;
  const fragment  = document.createDocumentFragment();

  for (let i = 1; i <= lines; i++) {
    const div = document.createElement('div');
    div.textContent = i;
    fragment.appendChild(div);
  }

  lineNumbers.innerHTML = '';
  lineNumbers.appendChild(fragment);

  // Sinkronkan scroll gutter dengan textarea
  lineNumbers.scrollTop = inputArea.scrollTop;
}

/** Update stats bar di header */
function updateStats(inputLength, outputLength) {
  charCountDisplay.textContent = inputLength;
  byteCountDisplay.textContent = outputLength;
}

/* ══════════════════════════════════════════════════════════
   6. BREAKDOWN TABLE
   ══════════════════════════════════════════════════════════ */

const MAX_TABLE_ROWS = 100;

/**
 * Bangun tabel breakdown berdasarkan mode aktif.
 * Untuk text-to-both: tampilkan kolom Char / ASCII / Binary / Hex
 * Untuk mode lainnya: tampilkan baris input → decoded result
 *
 * @param {string} inputRaw - Input mentah dari user
 * @param {string} mode     - Mode aktif
 */
function buildBreakdownTable(inputRaw, mode) {
  breakdownBody.innerHTML = '';

  if (!inputRaw || !inputRaw.trim()) {
    tablePlaceholder.style.display = 'block';
    tableRowCount.textContent = '';
    return;
  }

  tablePlaceholder.style.display = 'none';
  const fragment = document.createDocumentFragment();

  if (mode === 'text-to-both') {
    // ── Mode teks → tampilkan per karakter ──
    const chars = inputRaw.split('').slice(0, MAX_TABLE_ROWS);

    chars.forEach((char, idx) => {
      const ascii  = char.charCodeAt(0);
      const binary = charToBinary(char);
      const hex    = charToHex(char);

      // Karakter kontrol (ASCII < 32) ditampilkan sebagai label
      const displayChar = ascii < 32
        ? `<span style="color:#3d444d">[${
            ascii === 10 ? 'LF' : ascii === 13 ? 'CR' : ascii === 9 ? 'TAB' : ascii === 32 ? 'SP' : 'CTL'
          }]</span>`
        : escapeHtml(char);

      const row = document.createElement('tr');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <td class="col-index">${idx + 1}</td>
        <td class="col-char">${displayChar}</td>
        <td class="col-ascii">${ascii}</td>
        <td class="col-binary">${binary}</td>
        <td class="col-hex">0x${hex}</td>
      `;
      fragment.appendChild(row);
    });

    tableRowCount.textContent =
      inputRaw.length > MAX_TABLE_ROWS
        ? `(menampilkan ${MAX_TABLE_ROWS} dari ${inputRaw.length} karakter)`
        : `(${inputRaw.length} karakter)`;

    if (inputRaw.length > MAX_TABLE_ROWS) {
      const moreRow = document.createElement('tr');
      moreRow.innerHTML = `
        <td colspan="5" style="padding:0.4rem 0.75rem;color:#3d444d;text-align:center;font-size:0.67rem;letter-spacing:0.08em">
          ... +${inputRaw.length - MAX_TABLE_ROWS} karakter lagi
        </td>`;
      fragment.appendChild(moreRow);
    }

  } else if (mode === 'bin-to-text' || mode === 'hex-to-text') {
    // ── Mode decode → tampilkan per byte → karakter ──
    let pairs = [];

    if (mode === 'bin-to-text') {
      const parsed = parseBinaryInput(inputRaw);
      if (!parsed.valid) { tablePlaceholder.style.display = 'block'; return; }
      pairs = parsed.blocks.map(b => ({
        input: b,
        ascii: parseInt(b, 2),
        hex:   parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')
      }));
    } else {
      const parsed = parseHexInput(inputRaw);
      if (!parsed.valid) { tablePlaceholder.style.display = 'block'; return; }
      pairs = parsed.pairs.map(p => ({
        input: p.toUpperCase(),
        ascii: parseInt(p, 16),
        binary: parseInt(p, 16).toString(2).padStart(8, '0')
      }));
    }

    const slice = pairs.slice(0, MAX_TABLE_ROWS);
    const colLabel = mode === 'bin-to-text' ? 'Binary' : 'Hex';

    slice.forEach((item, idx) => {
      const ascii = item.ascii;
      const char  = ascii < 32 ? `<span style="color:#3d444d">[CTL]</span>` : escapeHtml(String.fromCharCode(ascii));
      const binCell  = mode === 'bin-to-text'
        ? `<td class="col-binary">${item.input}</td>`
        : `<td class="col-binary">${item.binary || ''}</td>`;
      const hexCell  = mode === 'bin-to-text'
        ? `<td class="col-hex">0x${item.hex}</td>`
        : `<td class="col-hex">0x${item.input}</td>`;

      const row = document.createElement('tr');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <td class="col-index">${idx + 1}</td>
        <td class="col-char">${char}</td>
        <td class="col-ascii">${ascii}</td>
        ${binCell}
        ${hexCell}
      `;
      fragment.appendChild(row);
    });

    tableRowCount.textContent = `(${pairs.length} byte)`;

  } else {
    // ── Mode bin↔hex — tampilkan pasangan konversi ──
    let pairs = [];

    if (mode === 'bin-to-hex') {
      const parsed = parseBinaryInput(inputRaw);
      if (!parsed.valid) { tablePlaceholder.style.display = 'block'; return; }
      pairs = parsed.blocks.map(b => ({
        binary: b,
        hex: parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0'),
        ascii: parseInt(b, 2)
      }));
    } else { // hex-to-bin
      const parsed = parseHexInput(inputRaw);
      if (!parsed.valid) { tablePlaceholder.style.display = 'block'; return; }
      pairs = parsed.pairs.map(p => ({
        hex:    p.toUpperCase(),
        binary: parseInt(p, 16).toString(2).padStart(8, '0'),
        ascii:  parseInt(p, 16)
      }));
    }

    const slice = pairs.slice(0, MAX_TABLE_ROWS);
    slice.forEach((item, idx) => {
      const row = document.createElement('tr');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <td class="col-index">${idx + 1}</td>
        <td class="col-char">${escapeHtml(String.fromCharCode(item.ascii < 128 ? item.ascii : 63))}</td>
        <td class="col-ascii">${item.ascii}</td>
        <td class="col-binary">${item.binary}</td>
        <td class="col-hex">0x${item.hex}</td>
      `;
      fragment.appendChild(row);
    });

    tableRowCount.textContent = `(${pairs.length} byte)`;
  }

  breakdownBody.appendChild(fragment);
}

/* ══════════════════════════════════════════════════════════
   7. MAIN UPDATE FUNCTION
   ══════════════════════════════════════════════════════════ */

/**
 * Inti update: dipanggil tiap kali input berubah.
 * Menjalankan konversi sesuai mode aktif, lalu memperbarui semua UI.
 */
function updateOutputs() {
  const raw    = inputArea.value;
  const config = MODE_CONFIG[currentMode];

  hideError();
  updateLineNumbers();

  // Jalankan fungsi konversi mode saat ini
  const result = config.convert(raw);

  // ── Tulis ke output A ──
  outputAreaA.value = result.ok ? (result.a ?? result.result ?? '') : '';

  // ── Tulis ke output B (hanya text-to-both) ──
  if (config.showPanelB) {
    outputAreaB.value = result.b ?? '';
  }

  // ── Tampilkan error jika ada ──
  if (!result.ok && result.error && raw.trim().length > 0) {
    showError(result.error);
  }

  // ── Hitung panjang output untuk stats bar ──
  const outputLen = outputAreaA.value.replace(/\s/g, '').length / 2 || outputAreaA.value.length;
  updateStats(raw.length, Math.ceil(outputLen));

  // ── Rebuild tabel breakdown ──
  buildBreakdownTable(raw, currentMode);
}

/* ══════════════════════════════════════════════════════════
   8. MODE SWITCHING
   ══════════════════════════════════════════════════════════ */

/**
 * Terapkan konfigurasi mode baru ke seluruh UI:
 * judul panel, badge, hint, placeholder, visibilitas panel B,
 * class warna output, dan label stats bar.
 *
 * @param {string} mode - key mode baru
 */
function applyMode(mode) {
  currentMode   = mode;
  const config  = MODE_CONFIG[mode];
  const panelB  = outputPanelB;

  // Update teks panel input
  inputPanelTitle.textContent = config.inputTitle;
  inputPanelBadge.textContent = config.inputBadge;
  inputHint.textContent       = config.inputHint;
  inputArea.placeholder       = config.inputPH;

  // Update teks panel output A
  outputATitleEl.textContent  = config.outputATitle;
  outputABadge.textContent    = config.outputABadge;
  outputAHint.textContent     = config.outputAHint;
  setOutputClass(outputAreaA, config.outputAClass);

  // Toggle panel B
  if (config.showPanelB) {
    panelB.style.display      = '';
    outputBTitleEl.textContent = config.outputBTitle;
    outputBBadge.textContent   = config.outputBBadge;
    outputBHint.textContent    = config.outputBHint;
    setOutputClass(outputAreaB, config.outputBClass);
  } else {
    panelB.style.display = 'none';
  }

  // Update stats mode label
  modeLabel.textContent = config.label;

  // Kosongkan output & error, lalu jalankan ulang konversi
  outputAreaA.value = '';
  outputAreaB.value = '';
  hideError();
  updateOutputs();
}

/* ══════════════════════════════════════════════════════════
   9. UTILITY
   ══════════════════════════════════════════════════════════ */

/** Escape HTML untuk safe insertion di innerHTML */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Copy teks ke clipboard dengan feedback visual pada tombol */
function copyToClipboard(btn, text) {
  if (!text.trim()) return;

  navigator.clipboard.writeText(text)
    .then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ COPIED';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1500);
    })
    .catch(() => {
      // Fallback execCommand untuk browser lama
      const tmp = document.createElement('textarea');
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
    });
}

/* ══════════════════════════════════════════════════════════
   10. EVENT LISTENERS
   ══════════════════════════════════════════════════════════ */

// Input: update real-time
inputArea.addEventListener('input', updateOutputs);

// Sinkronkan scroll gutter dengan textarea saat scroll
inputArea.addEventListener('scroll', () => {
  lineNumbers.scrollTop = inputArea.scrollTop;
});

// Clear
clearBtn.addEventListener('click', () => {
  inputArea.value = '';
  hideError();
  updateOutputs();
  inputArea.focus();
});

// Paste dari clipboard
pasteBtn.addEventListener('click', () => {
  navigator.clipboard.readText()
    .then(text => {
      inputArea.value = text;
      updateOutputs();
    })
    .catch(() => {
      inputArea.focus();
      document.execCommand('paste');
    });
});

// Mode tabs
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    modeTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    // Kosongkan input saat ganti mode
    inputArea.value = '';
    applyMode(tab.dataset.mode);
    inputArea.focus();
  });
});

// Copy buttons
copyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.target);
    if (el) copyToClipboard(btn, el.value);
  });
});

/* ══════════════════════════════════════════════════════════
   11. VISUAL EXTRAS — Matrix Rain + Boot + Clock
   ══════════════════════════════════════════════════════════ */

// ── Matrix Rain Canvas ───────────────────────────────────
(function initMatrixRain() {
  const canvas = document.getElementById('matrixCanvas');
  const ctx    = canvas.getContext('2d');

  const CHARS  = '01アイウエオカキクケコサシスセソタチツテト'; // biner + katakana
  const FONT_SIZE = 14;
  let columns, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops   = Array(columns).fill(1);
  }

  function draw() {
    // Fade jejak sebelumnya
    ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#39d353';
    ctx.font      = FONT_SIZE + 'px "Fira Code", monospace';

    drops.forEach((y, i) => {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillText(char, i * FONT_SIZE, y * FONT_SIZE);

      // Reset ke atas secara acak setelah melewati layar
      if (y * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    });
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 55); // ~18 fps — ringan di CPU
})();

// ── Boot sequence typewriter ─────────────────────────────
(function initBootSequence() {
  const el  = document.getElementById('bootLine');
  const msg = '[  OK  ] Loaded arch-bit v2.0 — bidirectional codec module initialized';
  let i = 0;

  const tick = setInterval(() => {
    el.textContent = msg.slice(0, i++) + (i % 2 === 0 ? '▌' : '');
    if (i > msg.length + 2) {
      clearInterval(tick);
      el.textContent = msg;
    }
  }, 28);
})();

// ── Live clock (header top-right) ────────────────────────
(function initClock() {
  const el = document.getElementById('liveClock');

  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }

  tick();
  setInterval(tick, 1000);
})();

/* ══════════════════════════════════════════════════════════
   12. INIT
   ══════════════════════════════════════════════════════════ */
(function init() {
  applyMode('text-to-both'); // Mulai di mode default
  inputArea.focus();
})();
