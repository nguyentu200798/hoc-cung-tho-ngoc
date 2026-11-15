import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudentRosterText } from './rosterParser';

test('parseStudentRosterText parses numbered newline lists and strips prefixes', () => {
  const input = `
    1. Nguyễn Ngọc Minh Anh
    2) Trần Gia Bảo
    3 - Lê Thảo Vy
    - Phạm Hoàng Nam
  `;
  const parsed = parseStudentRosterText(input);
  assert.deepEqual(parsed, [
    'Nguyễn Ngọc Minh Anh',
    'Trần Gia Bảo',
    'Lê Thảo Vy',
    'Phạm Hoàng Nam',
  ]);
});

test('parseStudentRosterText handles CSV headers, BOM, and STT columns', () => {
  const csv = '\uFEFFSTT,Họ và tên,Giới tính\n1,Võ Bảo Hân,Nữ\n2,Bùi Minh Khôi,Nam\n';
  const parsed = parseStudentRosterText(csv);
  assert.deepEqual(parsed, ['Võ Bảo Hân', 'Bùi Minh Khôi']);
});

test('parseStudentRosterText parses comma-separated names and deduplicates against existing roster', () => {
  const input = 'Đặng Khánh Duy, Huỳnh Tường Lam, Lê Thảo Vy, Đặng Khánh Duy';
  const parsed = parseStudentRosterText(input, ['Lê Thảo Vy']);
  assert.deepEqual(parsed, ['Đặng Khánh Duy', 'Huỳnh Tường Lam']);
});
