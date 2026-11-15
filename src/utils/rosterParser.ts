const HEADER_TOKENS = new Set([
  'stt',
  'họ và tên',
  'họ tên',
  'tên học sinh',
  'danh sách học sinh',
  'học sinh',
  'giới tính',
  'tổ',
  'lớp',
  'ngày sinh',
  'ghi chú',
  'student name',
  'full name',
  'name',
  'gender',
  'team',
]);

export function parseStudentRosterText(
  rawText: string,
  existingNames: string[] = []
): string[] {
  if (!rawText || !rawText.trim()) return [];

  const cleanedText = rawText.replace(/^\uFEFF/, '');
  const seen = new Set(
    existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean)
  );
  const results: string[] = [];

  const rawLines = cleanedText.split(/\r?\n/);

  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    const hasTabOrSemi = /[\t;]/.test(trimmedLine);
    const commaParts = trimmedLine.split(',').map((p) => p.trim());

    let candidateSegments: string[];
    if (hasTabOrSemi) {
      const sepParts = trimmedLine.split(/[\t;]/).map((p) => p.trim());
      if (sepParts.some((c) => isHeaderRow(c.replace(/^["']|["']$/g, '').trim()))) {
        continue;
      }
      candidateSegments = [pickNameColumn(sepParts)];
    } else if (commaParts.length >= 2) {
      if (commaParts.some((c) => isHeaderRow(c.replace(/^["']|["']$/g, '').trim()))) {
        continue;
      }
      if (/^\d{1,3}\.?$/.test(commaParts[0])) {
        candidateSegments = [pickNameColumn(commaParts)];
      } else if (
        commaParts.length === 2 &&
        /^(nam|nữ|nu|boy|girl|tổ\s*\d+|team\s*\d+)$/i.test(commaParts[1])
      ) {
        candidateSegments = [commaParts[0]];
      } else {
        candidateSegments = commaParts;
      }
    } else {
      candidateSegments = [trimmedLine];
    }

    for (const seg of candidateSegments) {
      const normalized = normalizeStudentName(seg);
      if (!normalized || isHeaderRow(normalized)) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(normalized.slice(0, 100));
    }
  }

  return results;
}

function pickNameColumn(columns: string[]): string {
  const nonEmpty = columns.map((c) => c.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
  if (nonEmpty.length === 0) return '';
  if (nonEmpty.length >= 2 && /^\d{1,3}\.?$/.test(nonEmpty[0])) {
    return nonEmpty[1];
  }
  return nonEmpty[0];
}

function normalizeStudentName(input: string): string {
  return input
    .replace(/^["']|["']$/g, '')
    .replace(/^\d{1,3}\s*[.):\-–]\s*/, '')
    .replace(/^[-•*+]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeaderRow(value: string): boolean {
  return HEADER_TOKENS.has(value.toLowerCase());
}
