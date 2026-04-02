function normalizeToken(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function rangesOverlap(start, end, usedRanges) {
  return usedRanges.some(([usedStart, usedEnd]) => start < usedEnd && end > usedStart);
}

function isUsableRange(text, start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
  if (start < 0 || end <= start || end > text.length) return false;

  const slice = text.slice(start, end);
  if (!slice.trim()) return false;

  // Extremely long spans are usually malformed model offsets.
  if (slice.length > 48) return false;

  return true;
}

function findWordSpan(text, rawWord, usedRanges) {
  const word = String(rawWord || '').trim();
  if (!word) return null;

  const source = text.toLowerCase();
  const target = word.toLowerCase();
  let index = source.indexOf(target);

  while (index !== -1) {
    const start = index;
    const end = index + target.length;
    if (!rangesOverlap(start, end, usedRanges)) {
      return [start, end];
    }
    index = source.indexOf(target, index + 1);
  }

  return null;
}

function classifyError(err) {
  const rawType = String(err?.type || '').trim().toLowerCase().replace(/\s+/g, '_');
  const rawColor = String(err?.color || '').trim().toLowerCase();
  const isSpelling = rawType === 'spelling' || rawColor === 'red';

  return {
    type: isSpelling ? 'spelling' : 'grammar',
    colorName: isSpelling ? 'red' : 'yellow',
    isSpelling,
  };
}

export function errorUnderlineStyle(colorName) {
  const color = colorName === 'red' ? '#EF4444' : '#EAB308';

  return {
    textDecorationLine: 'underline',
    textDecorationStyle: 'wavy',
    textDecorationColor: color,
    textDecorationThickness: '2px',
    textUnderlineOffset: '3px',
  };
}

export function buildHighlightSegments(text, errors = []) {
  if (!text) return [];
  if (!Array.isArray(errors) || errors.length === 0) {
    return [{ type: 'text', text }];
  }

  const normalizedErrors = [];
  const usedRanges = [];

  for (const sourceErr of errors) {
    const err = sourceErr && typeof sourceErr === 'object' ? sourceErr : {};
    const meta = classifyError(err);

    const position = err.position || {};
    let start = position.start;
    let end = position.end;
    let word = String(err.word || err.original || '').trim();

    let hasRange = isUsableRange(text, start, end);

    // If we have both a word and a position, ensure they roughly match.
    if (hasRange && word) {
      const slice = text.slice(start, end);
      const sliceToken = normalizeToken(slice);
      const wordToken = normalizeToken(word);
      const looksLikeSameWord =
        wordToken &&
        (
          sliceToken === wordToken ||
          slice.toLowerCase().includes(word.toLowerCase()) ||
          word.toLowerCase().includes(slice.toLowerCase())
        );

      if (!looksLikeSameWord) {
        hasRange = false;
      }
    }

    if (!hasRange && word) {
      const span = findWordSpan(text, word, usedRanges);
      if (span) {
        start = span[0];
        end = span[1];
        hasRange = true;
      }
    }

    if (!hasRange || rangesOverlap(start, end, usedRanges)) {
      continue;
    }

    const slice = text.slice(start, end);
    if (!slice.trim()) continue;

    if (!word) {
      word = slice.trim();
    }

    usedRanges.push([start, end]);
    normalizedErrors.push({
      ...err,
      ...meta,
      word,
      position: { start, end },
    });
  }

  if (normalizedErrors.length === 0) {
    return [{ type: 'text', text }];
  }

  normalizedErrors.sort((a, b) => a.position.start - b.position.start);

  const segments = [];
  let cursor = 0;

  for (const err of normalizedErrors) {
    const { start, end } = err.position;

    if (start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, start) });
    }

    if (start < cursor) {
      continue;
    }

    segments.push({ type: 'error', text: text.slice(start, end), err, start, end });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }

  return segments;
}
