// Korean Hangul phonetics, Choseong extraction, and Romaja matching utility

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNGSEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

const JONGSEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const ROMAJA_INITIAL: Record<string, string> = {
  'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt',
  'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's',
  'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch',
  'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h'
};

const ROMAJA_MEDIAL: Record<string, string> = {
  'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo',
  'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa',
  'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo',
  'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i'
};

const ROMAJA_FINAL: Record<string, string> = {
  '': '', 'ㄱ': 'k', 'ㄲ': 'k', 'ㄳ': 'k', 'ㄴ': 'n', 'ㄵ': 'n',
  'ㄶ': 'n', 'ㄷ': 't', 'ㄹ': 'l', 'ㄺ': 'k', 'ㄻ': 'm', 'ㄼ': 'p',
  'ㄽ': 'l', 'ㄾ': 't', 'ㄿ': 'p', 'ㅀ': 'l', 'ㅁ': 'm', 'ㅂ': 'p',
  'ㅄ': 'p', 'ㅅ': 't', 'ㅆ': 't', 'ㅇ': 'ng', 'ㅈ': 't', 'ㅊ': 't',
  'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 't'
};

/**
 * Extract initial consonants (Choseong) from Hangul text.
 * e.g. "바꾸다" -> "ㅂㄲㄷ", "축구" -> "ㅊㄱ"
 */
export function extractChoseong(text: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const choIndex = Math.floor((code - 0xac00) / (21 * 28));
      result += CHOSEONG[choIndex];
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Convert Hangul text into standard Romanization (Romaja) for phonetic searching.
 * e.g. "바꾸다" -> "bakkuda", "축구" -> "chukkgu" / "chuguk"
 */
export function romanizeKorean(text: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;

      const rCho = ROMAJA_INITIAL[CHOSEONG[cho]] || '';
      const rJung = ROMAJA_MEDIAL[JUNGSEONG[jung]] || '';
      const rJong = ROMAJA_FINAL[JONGSEONG[jong]] || '';

      result += rCho + rJung + rJong;
    } else {
      result += text[i];
    }
  }
  return result.toLowerCase();
}

/**
 * Decompose precomposed Hangul syllables into individual compatibility Jamo.
 * e.g. "가방" -> "ㄱㅏㅂㅏㅇ", "바꾸다" -> "ㅂㅏㄲㅜㄷㅏ"
 */
export function decomposeHangulToJamo(text: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      result += CHOSEONG[cho] + JUNGSEONG[jung] + (JONGSEONG[jong] || '');
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Helper to compose consonants and vowels when typed on the virtual keypad.
 * e.g. typing 'ㄱ' then 'ㅏ' produces '가'
 */
export function appendHangulChar(current: string, char: string): string {
  if (!current) return char;
  const lastChar = current[current.length - 1];
  const choIdx = CHOSEONG.indexOf(lastChar);
  const jungIdx = JUNGSEONG.indexOf(char);
  if (choIdx !== -1 && jungIdx !== -1) {
    const syllable = String.fromCharCode(0xac00 + choIdx * 588 + jungIdx * 28);
    return current.slice(0, -1) + syllable;
  }
  return current + char;
}

export const simplifyRomaja = (s: string): string =>
  s
    .replace(/[kg]/g, 'k')
    .replace(/[pb]/g, 'p')
    .replace(/[td]/g, 't')
    .replace(/ch/g, 'j')
    .replace(/[rl]/g, 'l')
    .replace(/eo/g, 'o')
    .replace(/eu/g, 'u');

export const extractConsonantSkeleton = (s: string): string =>
  simplifyRomaja(s).replace(/[aeiou]/g, '');

/**
 * Check if a Hangul word matches a query by:
 * 1. Direct text substring
 * 2. Indonesian meaning
 * 3. Decomposed Hangul (virtual keypad jamo matching)
 * 4. Choseong (initial consonant) match
 * 5. Romaja phonetic representation
 */
export function matchesKoreanQuery(
  korean: string,
  indonesian: string = '',
  rawQuery: string
): boolean {
  if (!rawQuery.trim()) return true;
  const q = rawQuery.trim().toLowerCase();

  // 1. Direct substring in Korean or Indonesian
  if (korean.toLowerCase().includes(q)) return true;
  if (indonesian.toLowerCase().includes(q)) return true;

  // 2. Decomposed Hangul match (allows "ㄱㅏ" or "가ㅂ" to match "가방")
  const decompKorean = decomposeHangulToJamo(korean);
  const decompQ = decomposeHangulToJamo(q);
  if (decompKorean.includes(decompQ)) return true;

  // 3. Choseong check (if query consists of Korean consonants)
  const isChoseongQuery = /^[ㄱ-ㅎ]+$/.test(q);
  if (isChoseongQuery) {
    const wordChoseong = extractChoseong(korean);
    if (wordChoseong.includes(q)) return true;
  }

  // 4. Romaja search (direct & phonetic tolerance for Indonesian learners)
  const romaja = romanizeKorean(korean);
  const normalizedRomaja = romaja.replace(/[^a-z0-9]/g, '');
  const normalizedQ = q.replace(/[^a-z0-9]/g, '');

  if (normalizedQ) {
    if (normalizedRomaja.includes(normalizedQ)) return true;

    const simpRomaja = simplifyRomaja(normalizedRomaja);
    const simpQ = simplifyRomaja(normalizedQ);
    if (simpRomaja.includes(simpQ)) return true;

    // Consonant skeleton match (e.g. "chuguk" vs "chukgu")
    const cRomaja = extractConsonantSkeleton(normalizedRomaja);
    const cQ = extractConsonantSkeleton(normalizedQ);
    if (cQ.length >= 2 && cRomaja.includes(cQ)) return true;
  }

  return false;
}

