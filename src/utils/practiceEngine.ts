import type {
  LeaderboardEntry,
  PracticeQuestion,
  PracticeTopic,
  QuizResult,
} from '../types/classroom';

export const PRACTICE_TOPIC_LABELS: Record<PracticeTopic, string> = {
  'mul-6-9': 'Bảng nhân 6, 7, 8, 9',
  'div-6-9': 'Bảng chia 6, 7, 8, 9',
  'add-sub-1000': 'Cộng, trừ trong phạm vi 1000',
  mixed: 'Tổng hợp Toán lớp 3',
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildOptions(correct: number, rand: () => number, spread: number): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard < 40) {
    guard += 1;
    const offset = Math.floor(rand() * (spread * 2 + 1)) - spread;
    const candidate = correct + (offset === 0 ? 1 : offset);
    if (candidate >= 0 && candidate !== correct) {
      set.add(candidate);
    }
  }
  while (set.size < 4) {
    set.add(correct + set.size + 1);
  }
  const arr = Array.from(set);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generatePracticeQuestions(
  topic: PracticeTopic,
  count = 10,
  seed?: number
): PracticeQuestion[] {
  const rand = seed !== undefined ? mulberry32(seed) : Math.random;
  const questions: PracticeQuestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const activeTopic: PracticeTopic =
      topic === 'mixed'
        ? (['mul-6-9', 'div-6-9', 'add-sub-1000'] as const)[i % 3]
        : topic;

    if (activeTopic === 'mul-6-9') {
      const a = 6 + Math.floor(rand() * 4);
      const b = 2 + Math.floor(rand() * 8);
      const correct = a * b;
      questions.push({
        id: `q-${i + 1}`,
        prompt: `${a} × ${b} = ?`,
        hint: `Nhẩm bảng nhân ${a}: ${a} được lấy ${b} lần.`,
        options: buildOptions(correct, rand, 8),
        correctAnswer: correct,
        topic: activeTopic,
      });
    } else if (activeTopic === 'div-6-9') {
      const divisor = 6 + Math.floor(rand() * 4);
      const quotient = 2 + Math.floor(rand() * 8);
      const dividend = divisor * quotient;
      questions.push({
        id: `q-${i + 1}`,
        prompt: `${dividend} : ${divisor} = ?`,
        hint: `Nhẩm ngược: ${divisor} nhân mấy thì bằng ${dividend}?`,
        options: buildOptions(quotient, rand, 4),
        correctAnswer: quotient,
        topic: activeTopic,
      });
    } else {
      const isAdd = rand() > 0.45;
      if (isAdd) {
        const a = 120 + Math.floor(rand() * 480);
        const b = 105 + Math.floor(rand() * 350);
        const correct = a + b;
        questions.push({
          id: `q-${i + 1}`,
          prompt: `${a} + ${b} = ?`,
          hint: 'Cộng lần lượt từ hàng đơn vị, nhớ sang hàng chục nếu tổng từ 10 trở lên.',
          options: buildOptions(correct, rand, 30),
          correctAnswer: correct,
          topic: activeTopic,
        });
      } else {
        const a = 450 + Math.floor(rand() * 520);
        const b = 110 + Math.floor(rand() * 320);
        const correct = a - b;
        questions.push({
          id: `q-${i + 1}`,
          prompt: `${a} - ${b} = ?`,
          hint: 'Đặt tính thẳng hàng đơn vị, chục, trăm rồi trừ từ phải sang trái.',
          options: buildOptions(correct, rand, 30),
          correctAnswer: correct,
          topic: activeTopic,
        });
      }
    }
  }

  return questions;
}

export function calculateStarsEarned(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const ratio = correctCount / totalCount;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

export function buildLeaderboard(results: QuizResult[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();

  for (const r of results) {
    const key = r.studentName.trim().toLowerCase();
    if (!key) continue;
    const accuracy = r.totalCount > 0 ? Math.round((r.correctCount / r.totalCount) * 100) : 0;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        studentName: r.studentName.trim(),
        teamId: r.teamId,
        totalCorrect: r.correctCount,
        totalAnswered: r.totalCount,
        attempts: 1,
        bestAccuracy: accuracy,
      });
    } else {
      existing.totalCorrect += r.correctCount;
      existing.totalAnswered += r.totalCount;
      existing.attempts += 1;
      if (accuracy > existing.bestAccuracy) {
        existing.bestAccuracy = accuracy;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
    if (b.bestAccuracy !== a.bestAccuracy) return b.bestAccuracy - a.bestAccuracy;
    return a.studentName.localeCompare(b.studentName, 'vi');
  });
}

export interface ThoMayReply {
  message: string;
  tip: string;
  actionLabel: string;
  targetRoute: 'study' | 'practice' | 'games' | 'activities';
}

export function getThoMayAdvice(input: string): ThoMayReply {
  const q = input.toLowerCase();
  if (q.includes('toán') || q.includes('tính') || q.includes('nhân') || q.includes('chia')) {
    return {
      message: 'Thỏ Mây gợi ý bí kíp tính siêu nhanh nè! Hãy ôn lại bảng nhân chia 6–9 rồi làm 10 câu thử thách nhé.',
      tip: 'Mẹo nhỏ: Nếu quên 7 × 8, hãy nhớ 7 × 7 = 49 rồi cộng thêm 7 là ra 56 ngay!',
      actionLabel: 'Vào Ôn tập Toán →',
      targetRoute: 'practice',
    };
  }
  if (q.includes('đọc') || q.includes('viết') || q.includes('tiếng việt') || q.includes('tả')) {
    return {
      message: 'Viết đoạn văn tả đồ vật rất vui đó! Em hãy quan sát hình dáng, màu sắc và tình cảm của em với đồ vật ấy nhé.',
      tip: 'Cấu trúc 3 phần: Mở bài giới thiệu đồ vật → Thân bài tả bao quát & chi tiết → Kết bài nêu cảm nghĩ.',
      actionLabel: 'Mở môn Tiếng Việt →',
      targetRoute: 'study',
    };
  }
  if (q.includes('anh') || q.includes('từ vựng') || q.includes('english')) {
    return {
      message: 'Học từ vựng Tiếng Anh mỗi ngày 5 từ là siêu đỉnh luôn! Thử chơi game Ghép Từ để nhớ lâu hơn nha.',
      tip: 'Mẹo nhỏ: Đọc to từ mới 3 lần và ghép thành một câu ngắn về lớp 3.17 của mình!',
      actionLabel: 'Chơi Ghép Từ Tiếng Anh →',
      targetRoute: 'games',
    };
  }
  return {
    message: 'Thỏ Mây luôn sẵn sàng đồng hành cùng em ở Lớp 3.17! Em muốn ôn bài, chơi game hay xem bảng thi đua tổ nào?',
    tip: 'Hoàn thành bài ôn tập để ghi tên lên Bảng xếp hạng và tích sao cho tổ của mình nhé ✨',
    actionLabel: 'Xem Hoạt động lớp →',
    targetRoute: 'activities',
  };
}
