/**
 * ============================================================
 * script.js  —  Arch-Bit: Low-Level Data Translator
 * Mata Kuliah: Arsitektur dan Organisasi Komputer
 *
 * Alur konversi:
 *   Teks (String)
 *     └─► split('')          → Array of characters
 *           └─► charCodeAt(0) → Kode ASCII (desimal)
 *                 ├─► toString(2).padStart(8,'0') → Biner 8-bit
 *                 └─► toString(16).toUpperCase()  → Hexadesimal
 * ============================================================
 */

'use strict';

// ── DOM References ──────────────────────────────────────────
const inputText          = document.getElementById('inputText');
const outputBinary       = document.getElementById('outputBinary');
const outputHex          = document.getElementById('outputHex');
const charCountDisplay   = document.getElementById('charCount');
const breakdownTableBody = document.getElementById('breakdownTableBody');
const tablePlaceholder   = document.getElementById('tablePlaceholder');
const clearBtn           = document.getElementById('clearBtn');
const copyBtns           = document.querySelectorAll('.copy-btn');


// ── Core Conversion Functions ───────────────────────────────

/**
 * Mengonversi satu karakter menjadi biner 8-bit.
 *
 * Langkah:
 *  1. charCodeAt(0) → ambil nilai ASCII desimal karakter (mis. 'A' → 65)
 *  2. toString(2)   → ubah ke basis 2 (biner), hasilnya bisa < 8 digit (mis. '1000001')
 *  3. padStart(8,'0') → padding kiri dengan '0' agar selalu 8 digit (mis. '01000001')
 *
 * @param {string} char - Satu karakter
 * @returns {string} String biner 8-bit, contoh: '01000001'
 */
function charToBinary(char) {
  const asciiCode  = char.charCodeAt(0);        // Step 1: ASCII code
  const binaryRaw  = asciiCode.toString(2);     // Step 2: base-2 string
  const binaryByte = binaryRaw.padStart(8, '0'); // Step 3: 8-bit padding
  return binaryByte;
}

/**
 * Mengonversi satu karakter menjadi hexadesimal (2 digit uppercase).
 *
 * Langkah:
 *  1. charCodeAt(0)    → nilai ASCII desimal
 *  2. toString(16)     → ubah ke basis 16 (mis. 65 → '41')
 *  3. toUpperCase()    → ubah ke huruf kapital ('41' → '41')
 *  4. padStart(2, '0') → pastikan selalu 2 digit (mis. '\n' (10) → '0A')
 *
 * @param {string} char - Satu karakter
 * @returns {string} String hex 2-digit uppercase, contoh: '41'
 */
function charToHex(char) {
  const asciiCode = char.charCodeAt(0);                       // Step 1
  const hexRaw    = asciiCode.toString(16);                   // Step 2
  const hexUpper  = hexRaw.toUpperCase();                     // Step 3
  const hexByte   = hexUpper.padStart(2, '0');                // Step 4
  return hexByte;
}

/**
 * Mengonversi seluruh string teks menjadi output biner.
 *
 * Menggunakan array method chain:
 *   split('')  → pecah string menjadi array karakter
 *   map(...)   → terapkan charToBinary() ke setiap karakter
 *   join(' ')  → gabung kembali dengan spasi sebagai pemisah byte
 *
 * @param {string} text - Teks input
 * @returns {string} Setiap karakter sebagai blok biner 8-bit, dipisah spasi
 */
function textToBinary(text) {
  return text
    .split('')                        // ["A", "r", "c", "h", ...]
    .map(char => charToBinary(char))  // ["01000001", "01110010", ...]
    .join(' ');                       // "01000001 01110010 ..."
}

/**
 * Mengonversi seluruh string teks menjadi output hexadesimal.
 *
 * Pola yang sama dengan textToBinary, namun menggunakan charToHex().
 *
 * @param {string} text - Teks input
 * @returns {string} Setiap karakter sebagai pasang digit hex, dipisah spasi
 */
function textToHex(text) {
  return text
    .split('')                     // ["A", "r", "c", "h", ...]
    .map(char => charToHex(char))  // ["41", "72", "63", "68", ...]
    .join(' ');                    // "41 72 63 68 ..."
}


// ── Table Builder ───────────────────────────────────────────

/**
 * Membangun tabel breakdown per karakter ke dalam DOM.
 * Tabel memperlihatkan: index, karakter, ASCII, biner, hex.
 * Batas tampilan 128 baris agar tidak membebani DOM.
 *
 * @param {string} text - Teks input
 */
function buildBreakdownTable(text) {
  const MAX_ROWS = 128; // Batas tampilan agar performa tetap optimal

  // Kosongkan isi tabel sebelum mengisi ulang
  breakdownTableBody.innerHTML = '';

  if (text.length === 0) {
    // Jika tidak ada input, tampilkan placeholder
    tablePlaceholder.style.display = 'block';
    return;
  }

  tablePlaceholder.style.display = 'none';

  // Ambil array karakter, batasi ke MAX_ROWS
  const chars = text.split('').slice(0, MAX_ROWS);

  // Buat fragment agar hanya satu reflow DOM (lebih efisien)
  const fragment = document.createDocumentFragment();

  chars.forEach((char, index) => {
    const asciiCode = char.charCodeAt(0);
    const binary    = charToBinary(char);
    const hex       = charToHex(char);

    // Tampilkan karakter yang tidak tercetak sebagai label khusus
    const displayChar = asciiCode < 32
      ? `<span style="color:#4b5563">[${asciiCode === 10 ? 'LF' : asciiCode === 13 ? 'CR' : asciiCode === 32 ? 'SP' : 'CTL'}]</span>`
      : escapeHtml(char);

    const row = document.createElement('tr');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <td class="col-index">${index + 1}</td>
      <td class="col-char">${displayChar}</td>
      <td class="col-ascii">${asciiCode}</td>
      <td class="col-binary">${binary}</td>
      <td class="col-hex">0x${hex}</td>
    `;

    fragment.appendChild(row);
  });

  // Jika teks melebihi batas tampilan, tambahkan baris keterangan
  if (text.length > MAX_ROWS) {
    const moreRow = document.createElement('tr');
    moreRow.innerHTML = `
      <td colspan="5" style="padding:0.5rem 1rem; color:#4b5563; text-align:center; font-size:0.7rem; letter-spacing:0.1em;">
        ... dan ${text.length - MAX_ROWS} karakter lainnya (batas tampilan tabel: ${MAX_ROWS})
      </td>
    `;
    fragment.appendChild(moreRow);
  }

  breakdownTableBody.appendChild(fragment);
}


// ── Utility ─────────────────────────────────────────────────

/**
 * Escape karakter HTML agar tidak diinterpretasikan sebagai tag.
 * Penting untuk menampilkan karakter seperti '<', '>', '&' dengan aman.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Memperbarui semua output berdasarkan nilai teks saat ini.
 * Dipanggil setiap kali event 'input' terjadi pada inputText.
 */
function updateOutputs() {
  const text = inputText.value;

  // ── 1. Perbarui counter karakter di header
  charCountDisplay.textContent = text.length;

  // ── 2. Perbarui panel output Biner
  //       Jika teks kosong, kosongkan juga output-nya
  outputBinary.value = text.length > 0 ? textToBinary(text) : '';

  // ── 3. Perbarui panel output Hexadesimal
  outputHex.value = text.length > 0 ? textToHex(text) : '';

  // ── 4. Perbarui tabel breakdown per karakter
  buildBreakdownTable(text);
}


// ── Event Listeners ─────────────────────────────────────────

/**
 * Event: input
 * Dipicu setiap kali pengguna mengetik atau menghapus karakter.
 * Memastikan output selalu sinkron secara real-time tanpa tombol submit.
 */
inputText.addEventListener('input', updateOutputs);

/**
 * Event: click — Tombol CLEAR
 * Mengosongkan semua panel dan mereset tampilan.
 */
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  updateOutputs();     // Reset semua output
  inputText.focus();   // Kembalikan fokus ke area input
});

/**
 * Event: click — Semua tombol COPY
 * Menyalin konten textarea target ke clipboard.
 * Menampilkan feedback visual singkat pada tombol.
 */
copyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;                // ID textarea target
    const targetEl = document.getElementById(targetId);

    if (!targetEl || targetEl.value.trim() === '') return; // Tidak ada yang dicopy jika kosong

    // Salin ke clipboard menggunakan Clipboard API modern
    navigator.clipboard.writeText(targetEl.value)
      .then(() => {
        // Feedback visual: ubah teks tombol sementara
        const originalText = btn.textContent;
        btn.textContent    = '✓ COPIED';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 1500);
      })
      .catch(() => {
        // Fallback untuk browser lama yang tidak support Clipboard API
        targetEl.select();
        document.execCommand('copy');
      });
  });
});


// ── Init ─────────────────────────────────────────────────────

/**
 * Inisialisasi aplikasi saat halaman selesai dimuat.
 * Fokuskan cursor ke area input agar siap digunakan langsung.
 */
(function init() {
  inputText.focus();
  // Tidak ada initial value — tunggu input dari pengguna
})();
