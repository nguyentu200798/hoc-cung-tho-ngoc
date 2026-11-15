import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeaderboard,
  calculateStarsEarned,
  generatePracticeQuestions,
  getThoMayAdvice,
} from './practiceEngine';
import type { QuizResult } from '../types/classroom';

test('generatePracticeQuestions creates deterministic Grade 3 math questions with 4 unique options', () => {
  const questions = generatePracticeQuestions('mul-6-9', 8, 42);
  assert.equal(questions.length, 8);

  for (const q of questions) {
    assert.equal(q.options.length, 4);
    const unique = new Set(q.options);
    assert.equal(unique.size, 4, `Expected 4 unique options for ${q.prompt}`);
    assert.ok(q.options.includes(q.correctAnswer), `Correct answer missing in options for ${q.prompt}`);
  }
});

test('generatePracticeQuestions supports division and addition/subtraction within 1000', () => {
  const divQuestions = generatePracticeQuestions('div-6-9', 5, 99);
  for (const q of divQuestions) {
    assert.ok(q.prompt.includes(':'));
    assert.ok(q.correctAnswer >= 2 && q.correctAnswer <= 9);
  }

  const addSubQuestions = generatePracticeQuestions('add-sub-1000', 6, 123);
  for (const q of addSubQuestions) {
    assert.ok(q.correctAnswer >= 0 && q.correctAnswer <= 1000);
  }
});

test('calculateStarsEarned awards 0 to 3 stars accurately', () => {
  assert.equal(calculateStarsEarned(10, 10), 3);
  assert.equal(calculateStarsEarned(9, 10), 3);
  assert.equal(calculateStarsEarned(7, 10), 2);
  assert.equal(calculateStarsEarned(5, 10), 1);
  assert.equal(calculateStarsEarned(2, 10), 0);
});

test('buildLeaderboard aggregates multiple attempts per student and sorts descending by totalCorrect', () => {
  const sample: QuizResult[] = [
    {
      id: '1',
      studentName: 'Minh Anh',
      teamId: 1,
      topic: 'mul-6-9',
      topicLabel: 'Bảng nhân',
      correctCount: 8,
      totalCount: 10,
      starsEarned: 2,
      completedAt: '2026-11-10T08:00:00Z',
    },
    {
      id: '2',
      studentName: 'Gia Bảo',
      teamId: 2,
      topic: 'div-6-9',
      topicLabel: 'Bảng chia',
      correctCount: 9,
      totalCount: 10,
      starsEarned: 3,
      completedAt: '2026-11-10T09:00:00Z',
    },
    {
      id: '3',
      studentName: 'Minh Anh',
      teamId: 1,
      topic: 'mixed',
      topicLabel: 'Tổng hợp',
      correctCount: 7,
      totalCount: 10,
      starsEarned: 2,
      completedAt: '2026-11-11T09:00:00Z',
    },
  ];

  const board = buildLeaderboard(sample);
  assert.equal(board.length, 2);
  assert.equal(board[0].studentName, 'Minh Anh');
  assert.equal(board[0].totalCorrect, 15);
  assert.equal(board[0].attempts, 2);
  assert.equal(board[0].bestAccuracy, 80);
  assert.equal(board[1].studentName, 'Gia Bảo');
  assert.equal(board[1].totalCorrect, 9);
});

test('getThoMayAdvice routes math, reading/writing, and english queries cleanly', () => {
  assert.equal(getThoMayAdvice('Tính toán').targetRoute, 'practice');
  assert.equal(getThoMayAdvice('Đọc và viết').targetRoute, 'study');
  assert.equal(getThoMayAdvice('Từ vựng tiếng Anh').targetRoute, 'games');
});
