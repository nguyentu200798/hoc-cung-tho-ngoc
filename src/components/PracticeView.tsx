import { Award, CheckCircle2, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  PracticeQuestion,
  PracticeTopic,
  QuizResult,
  RouteTab,
  StudentRecord,
} from '../types/classroom';
import {
  calculateStarsEarned,
  generatePracticeQuestions,
  PRACTICE_TOPIC_LABELS,
} from '../utils/practiceEngine';

interface PracticeViewProps {
  students: StudentRecord[];
  currentStudentName: string;
  onSaveResult: (result: QuizResult) => void;
  onNavigate: (route: RouteTab) => void;
}

const TOPIC_EN: Record<PracticeTopic, string> = {
  'mul-6-9': 'Multiplication 6–9',
  'div-6-9': 'Division 6–9',
  'add-sub-1000': 'Add & Subtract within 1000',
  mixed: 'Grade 3 Mixed Review',
};

export function PracticeView({
  students,
  currentStudentName,
  onSaveResult,
  onNavigate,
}: PracticeViewProps) {
  const [studentName, setStudentName] = useState(currentStudentName);
  const [teamId, setTeamId] = useState<1 | 2 | 3 | 4>(1);
  const [topic, setTopic] = useState<PracticeTopic>('mul-6-9');
  const [formError, setFormError] = useState('');

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finishedResult, setFinishedResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (currentStudentName) {
      setStudentName(currentStudentName);
      setFormError('');
    }
  }, [currentStudentName]);

  const handleSelectRosterStudent = (id: string) => {
    const found = students.find((s) => s.id === id);
    if (found) {
      setStudentName(found.name);
      setTeamId(found.teamId ?? 1);
      setFormError('');
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = studentName.trim();
    if (!trimmed) {
      setFormError('Em hãy nhập hoặc chọn tên của mình nhé! / Please enter or pick your name.');
      return;
    }
    setFormError('');
    setQuestions(generatePracticeQuestions(topic, 10));
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setShowHint(false);
    setFinishedResult(null);
  };

  const handlePickOption = (val: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(val);
    if (val === questions[currentIndex].correctAnswer) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      const finalCorrect = correctCount;
      const result: QuizResult = {
        id: `qr-${Date.now()}`,
        studentName: studentName.trim(),
        teamId,
        topic,
        topicLabel: PRACTICE_TOPIC_LABELS[topic],
        correctCount: finalCorrect,
        totalCount: questions.length,
        starsEarned: calculateStarsEarned(finalCorrect, questions.length),
        completedAt: new Date().toISOString(),
      };
      onSaveResult(result);
      setFinishedResult(result);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setFinishedResult(null);
    setSelectedOption(null);
  };

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-[780px] px-5 pt-7 pb-12 md:px-8">
        <button
          type="button"
          onClick={() => onNavigate('study')}
          className="text-sm font-extrabold text-[#62335f] hover:text-[#4f1d4b]"
        >
          ← Quay lại Học tập / Back to Learning
        </button>

        <section className="glass-panel mt-4 rounded-[1.75rem] p-6 md:p-8">
          <h1 className="font-display text-3xl font-extrabold text-[#4f1d4b]">
            Ôn tập Toán lớp 3
          </h1>
          <p className="text-xs font-extrabold text-[#7d26c9]">
            Grade 3 Interactive Math Practice
          </p>
          <p className="mt-2 text-sm font-bold text-[#4f1d4b]">
            Hoàn thành 10 câu hỏi để nhận sao thưởng và ghi tên lên Bảng xếp hạng lớp 3.17!
          </p>
          <p className="text-xs font-semibold text-[#6b4869]">
            Complete 10 questions to earn bonus stars and climb the Class 3.17 leaderboard!
          </p>

          <form onSubmit={handleStart} className="mt-6 space-y-5">
            <div>
              <p className="block text-sm font-extrabold text-[#4f1d4b]">
                Chọn tên học sinh trong lớp 3.17 / Pick Student Name
              </p>

              {studentName && (
                <p className="mt-1.5 text-sm font-extrabold text-[#7d26c9]">
                  Đang chọn: {studentName}
                </p>
              )}

              {formError && (
                <p role="alert" className="mt-1.5 text-xs font-bold text-rose-700">
                  {formError}
                </p>
              )}

              {students.length > 0 ? (
                <div className="mt-2.5 flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-purple-100 bg-white/65 p-3">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectRosterStudent(st.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        studentName === st.name
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-[#5b2358] hover:bg-purple-50'
                      }`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-2xl border border-purple-100 bg-white/70 px-4 py-3 text-xs font-bold text-[#6b4869]">
                  Danh sách học sinh chưa được cô Tú tải lên. Cô Tú hãy vào mục Giáo viên để thêm danh sách lớp nhé!
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="team-select"
                  className="block text-sm font-extrabold text-[#4f1d4b]"
                >
                  Tổ của em / Your Team
                </label>
                <select
                  id="team-select"
                  value={teamId}
                  onChange={(e) => setTeamId(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="mt-1.5 w-full rounded-2xl border border-purple-200 bg-white/90 px-4 py-3 text-sm font-bold text-[#4f1d4b] focus:border-purple-500 focus:outline-none"
                >
                  <option value={1}>Tổ 1 / Team 1</option>
                  <option value={2}>Tổ 2 / Team 2</option>
                  <option value={3}>Tổ 3 / Team 3</option>
                  <option value={4}>Tổ 4 / Team 4</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="topic-select"
                  className="block text-sm font-extrabold text-[#4f1d4b]"
                >
                  Chủ đề luyện tập / Topic
                </label>
                <select
                  id="topic-select"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as PracticeTopic)}
                  className="mt-1.5 w-full rounded-2xl border border-purple-200 bg-white/90 px-4 py-3 text-sm font-bold text-[#4f1d4b] focus:border-purple-500 focus:outline-none"
                >
                  {Object.entries(PRACTICE_TOPIC_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label} ({TOPIC_EN[k as PracticeTopic]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-violet w-full rounded-2xl py-3.5 text-center leading-tight transition-all sm:w-auto sm:px-8"
            >
              <span className="block text-sm font-extrabold">Bắt đầu làm bài (10 câu) →</span>
              <span className="block text-[11px] font-bold opacity-90">Start 10 Questions</span>
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (finishedResult) {
    return (
      <div className="mx-auto max-w-[720px] px-5 pt-8 pb-12 md:px-8">
        <section className="glass-panel rounded-[2rem] p-7 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <Award className="h-9 w-9" />
          </div>
          <h1 className="font-display mt-4 text-3xl font-extrabold text-[#4f1d4b]">
            Hoàn thành xuất sắc!
          </h1>
          <p className="text-xs font-extrabold text-[#7d26c9]">Well Done!</p>
          <p className="mt-2 text-base font-bold text-[#4f1d4b]">
            {finishedResult.studentName} (Tổ {finishedResult.teamId}) ·{' '}
            {finishedResult.topicLabel}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-3xl bg-white/75 p-5">
            <div>
              <span className="text-xs font-bold text-[#6b4869]">
                Số câu đúng / Correct
              </span>
              <p className="font-display mt-1 text-3xl font-extrabold text-[#4f1d4b] tabular-nums">
                {finishedResult.correctCount} / {finishedResult.totalCount}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-[#6b4869]">
                Sao thưởng / Stars
              </span>
              <p className="font-display mt-1 text-3xl font-extrabold text-amber-500 tabular-nums">
                {'⭐'.repeat(Math.max(1, finishedResult.starsEarned))}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-bold text-emerald-700">
            Kết quả đã được lưu vào Bảng xếp hạng! / Saved to Leaderboard!
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#4f1d4b] shadow-sm hover:bg-purple-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Làm lượt mới / Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('activities')}
              className="btn-violet rounded-full px-6 py-3 text-sm font-extrabold"
            >
              Xem Bảng xếp hạng / Leaderboard →
            </button>
          </div>
        </section>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === q.correctAnswer;

  return (
    <div className="mx-auto max-w-[760px] px-5 pt-7 pb-12 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-extrabold text-[#62335f] hover:text-[#4f1d4b]"
        >
          ← Thoát / Exit Quiz
        </button>
        <span className="text-sm font-extrabold text-[#4f1d4b] tabular-nums">
          Câu {currentIndex + 1}/{questions.length} · Đúng/Correct: {correctCount}
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-8">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#7d4e78]">
            {PRACTICE_TOPIC_LABELS[topic]} · {studentName}
          </span>
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#62335f] hover:bg-white"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Gợi ý / Hint
          </button>
        </div>

        <h1 className="font-display mt-5 text-center text-4xl font-extrabold text-[#4f1d4b] tabular-nums md:text-5xl">
          {q.prompt}
        </h1>

        {showHint && (
          <p className="mt-4 rounded-2xl bg-purple-50/90 px-4 py-3 text-center text-sm font-semibold text-[#5b2358]">
            <Sparkles className="mr-1.5 inline h-4 w-4 text-purple-600" />
            {q.hint}
          </p>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3.5">
          {q.options.map((opt) => {
            let btnStyle =
              'border-white/90 bg-white/85 text-[#4f1d4b] hover:bg-white hover:-translate-y-0.5';
            if (isAnswered) {
              if (opt === q.correctAnswer) {
                btnStyle = 'border-emerald-500 bg-emerald-500 text-white shadow-md';
              } else if (opt === selectedOption) {
                btnStyle = 'border-rose-400 bg-rose-500 text-white';
              } else {
                btnStyle = 'border-white/50 bg-white/50 text-[#7d4e78] opacity-65';
              }
            }

            return (
              <button
                key={opt}
                type="button"
                disabled={isAnswered}
                onClick={() => handlePickOption(opt)}
                className={`rounded-2xl border-2 py-4 text-2xl font-extrabold tabular-nums shadow-xs transition-all ${btnStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white/75 px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm font-bold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-800">
                    Chính xác! / Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <span className="text-rose-800">
                    Đáp án đúng là {q.correctAnswer} / Answer: {q.correctAnswer}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="btn-violet rounded-full px-6 py-2.5 text-sm font-extrabold whitespace-nowrap"
            >
              {currentIndex + 1 < questions.length
                ? 'Câu tiếp theo / Next →'
                : 'Nộp bài / Submit →'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
