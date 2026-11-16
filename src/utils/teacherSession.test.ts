import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTeacherPasswordInput } from './teacherSession';

test('validateTeacherPasswordInput rejects empty/whitespace passwords and allows non-empty input', () => {
  assert.ok(validateTeacherPasswordInput(''));
  assert.ok(validateTeacherPasswordInput('   '));
  assert.equal(validateTeacherPasswordInput('nguyentu200798'), null);
});
