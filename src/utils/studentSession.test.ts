import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterStudentsByQuery,
  normalizeVietnameseText,
  shouldAutoShowStudentPicker,
} from './studentSession';

test('normalizeVietnameseText strips Vietnamese diacritics and handles đ/Đ', () => {
  assert.equal(normalizeVietnameseText('Đặng Khánh Duy'), 'dang khanh duy');
  assert.equal(normalizeVietnameseText('  Nguyễn Ngọc Minh Anh '), 'nguyen ngoc minh anh');
});

test('filterStudentsByQuery filters students accent-insensitively', () => {
  const roster = [
    { id: '1', name: 'Nguyễn Ngọc Minh Anh', bonusStars: 0 },
    { id: '2', name: 'Đặng Khánh Duy', bonusStars: 0 },
    { id: '3', name: 'Võ Bảo Hân', bonusStars: 0 },
  ];

  assert.deepEqual(
    filterStudentsByQuery(roster, 'minh anh').map((s) => s.name),
    ['Nguyễn Ngọc Minh Anh']
  );
  assert.deepEqual(
    filterStudentsByQuery(roster, 'dang').map((s) => s.name),
    ['Đặng Khánh Duy']
  );
  assert.equal(filterStudentsByQuery(roster, '').length, 3);
});

test('shouldAutoShowStudentPicker obeys route, saved name, session dismissal, and autostart', () => {
  assert.equal(
    shouldAutoShowStudentPicker({
      activeStudentName: '',
      activeRoute: 'home',
      search: '',
      dismissedForSession: false,
    }),
    true
  );

  assert.equal(
    shouldAutoShowStudentPicker({
      activeStudentName: 'Võ Bảo Hân',
      activeRoute: 'home',
      search: '',
      dismissedForSession: false,
    }),
    false
  );

  assert.equal(
    shouldAutoShowStudentPicker({
      activeStudentName: '',
      activeRoute: 'teacher',
      search: '',
      dismissedForSession: false,
    }),
    false
  );

  assert.equal(
    shouldAutoShowStudentPicker({
      activeStudentName: '',
      activeRoute: 'home',
      search: '?autostart=1',
      dismissedForSession: false,
    }),
    false
  );

  assert.equal(
    shouldAutoShowStudentPicker({
      activeStudentName: '',
      activeRoute: 'home',
      search: '',
      dismissedForSession: true,
    }),
    false
  );
});
