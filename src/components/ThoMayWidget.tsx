import { Send, X } from 'lucide-react';
import { useState } from 'react';
import { ASSETS } from '../data/classroomSeed';
import type { RouteTab } from '../types/classroom';
import { getThoMayAdvice, type ThoMayReply } from '../utils/practiceEngine';

interface ThoMayWidgetProps {
  onNavigate: (route: RouteTab) => void;
}

const QUICK_GOALS = [
  { vi: 'Tính toán', en: 'Math' },
  { vi: 'Đọc và viết', en: 'Reading & Writing' },
  { vi: 'Từ vựng tiếng Anh', en: 'English' },
];

export function ThoMayWidget({ onNavigate }: ThoMayWidgetProps) {
  const [open, setOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [reply, setReply] = useState<ThoMayReply | null>(null);

  const handleSelectGoal = (goal: string) => {
    setReply(getThoMayAdvice(goal));
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    setReply(getThoMayAdvice(questionInput));
    setQuestionInput('');
  };

  return (
    <div
      className="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5 sm:gap-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {open && (
        <section
          aria-label="Hộp thoại Thỏ Mây tư vấn"
          className="glass-panel max-h-[calc(100dvh-6rem)] w-[min(calc(100vw-1.5rem),355px)] overflow-y-auto rounded-[1.75rem] bg-white/95 p-4 shadow-2xl sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#4f1d4b]">
                Thỏ Mây chào bạn! 🐰
              </h2>
              <p className="text-[11px] font-extrabold text-[#7d26c9]">
                Hello from Tho May!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng Thỏ Mây"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b4869] hover:bg-pink-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm font-bold text-[#4f1d4b]">
            Bạn muốn luyện tập điều gì?
          </p>
          <p className="text-xs font-semibold text-[#6b4869]">
            What would you like to practice today?
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_GOALS.map((goal) => (
              <button
                key={goal.vi}
                type="button"
                onClick={() => handleSelectGoal(goal.vi)}
                className="btn-violet min-h-[40px] rounded-2xl px-3.5 py-1.5 text-left leading-tight whitespace-nowrap"
              >
                <span className="block text-xs font-extrabold">{goal.vi}</span>
                <span className="block text-[10px] font-bold opacity-85">{goal.en}</span>
              </button>
            ))}
          </div>

          {reply ? (
            <div className="mt-4 rounded-2xl bg-white/85 p-3.5 text-xs font-semibold text-[#4f1d4b] shadow-xs">
              <p>{reply.message}</p>
              <p className="mt-2 rounded-xl bg-purple-50 px-3 py-2 text-[#5b2358]">
                {reply.tip}
              </p>
              <button
                type="button"
                onClick={() => {
                  onNavigate(reply.targetRoute);
                  setOpen(false);
                }}
                className="mt-2.5 min-h-[36px] font-extrabold text-[#7d26c9] hover:underline"
              >
                {reply.actionLabel}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-xs font-semibold text-[#6b4869]">
              Chọn một mục tiêu để nhận gợi ý nhé · Pick a goal for tips!
            </p>
          )}

          <form onSubmit={handleAsk} className="mt-3.5 flex items-center gap-2">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Nhắn cho Thỏ Mây / Ask Tho May..."
              aria-label="Nhắn câu hỏi cho Thỏ Mây"
              className="min-h-[40px] flex-1 rounded-full border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b] focus:border-purple-500 focus:outline-none sm:text-xs"
            />
            <button
              type="submit"
              aria-label="Gửi câu hỏi"
              className="btn-violet flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="glass-card flex min-h-[46px] cursor-pointer items-center gap-2 rounded-full bg-white/85 py-1.5 pr-3.5 pl-2 text-left shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 sm:pr-4"
      >
        <img
          src={ASSETS.thoMayMascot}
          alt="Thỏ Mây tư vấn"
          referrerPolicy="no-referrer"
          className="h-8 w-8 object-contain sm:h-10 sm:w-10"
        />
        <span className="leading-tight whitespace-nowrap">
          <span className="block text-xs font-extrabold text-[#4f1d4b] sm:text-sm">
            Hỏi Thỏ Mây ✨
          </span>
          <span className="block text-[10px] font-bold text-[#7d26c9]">
            Ask Tho May
          </span>
        </span>
      </button>
    </div>
  );
}
