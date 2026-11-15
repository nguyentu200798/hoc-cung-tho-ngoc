import { Award, CalendarDays, Trophy } from 'lucide-react';
import { ASSETS } from '../data/classroomSeed';
import type {
  ActivityMemory,
  RouteTab,
  StudentAchievement,
  TeamScore,
  WeeklyHonor,
  WeeklyTask,
} from '../types/classroom';
import { CheckSquare, Square } from 'lucide-react';

interface ActivitiesViewProps {
  currentStudentName: string;
  studentAchievements: StudentAchievement[];
  weeklyHonors: WeeklyHonor[];
  teams: TeamScore[];
  tasks: WeeklyTask[];
  activities: ActivityMemory[];
  onToggleTask: (taskId: string) => void;
  onNavigate: (route: RouteTab) => void;
}

export function ActivitiesView({
  currentStudentName,
  studentAchievements,
  weeklyHonors,
  teams,
  tasks,
  activities,
  onToggleTask,
  onNavigate,
}: ActivitiesViewProps) {
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-[1080px] px-5 pt-7 pb-12 md:px-8">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-sm font-extrabold text-[#62335f] hover:text-[#4f1d4b]"
      >
        <img
          src={ASSETS.btnHomepage}
          alt="Trang chủ - Homepage"
          referrerPolicy="no-referrer"
          className="h-11 w-auto object-contain"
        />
        <span>← Trang chủ / Home</span>
      </button>

      {/* Large Centered Class Activities Sticker */}
      <div className="mt-3 flex flex-col items-center text-center">
        <img
          src={ASSETS.btnHoatDongLop}
          alt="Hoạt động của lớp - Class Activities"
          referrerPolicy="no-referrer"
          className="sticker-shadow h-28 w-auto object-contain md:h-36"
        />
        <h1 className="sr-only">Hoạt động lớp 3.17 - Class 3.17 Activities</h1>
        {currentStudentName && (
          <p className="mt-2 text-sm font-extrabold text-[#4f1d4b]">
            Xin chào bạn nhỏ <span className="text-[#7d26c9]">{currentStudentName}</span> · Active Student
          </p>
        )}
      </div>

      {/* 1. Personal Achievements — Empty until Teacher publishes achievements */}
      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
          <Award className="h-5 w-5 text-amber-500" />
          <span>Thành tích cá nhân · Personal Achievements</span>
        </h2>

        {studentAchievements.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-[#6b4869]">
            Chưa có thành tích nào được đăng — Cô Tú sẽ cập nhật sau khi đăng nhập mục Giáo viên.
            <span className="mt-0.5 block text-xs font-semibold opacity-85">
              No personal achievements posted yet — Ms. Tu will add student awards from the Teacher portal.
            </span>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {studentAchievements.map((item) => {
              const isMine =
                Boolean(currentStudentName) &&
                item.studentName.trim().toLowerCase() === currentStudentName.trim().toLowerCase();
              return (
                <article
                  key={item.id}
                  className={`glass-card flex flex-col justify-between rounded-2xl p-4 ${
                    isMine ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-extrabold text-[#4f1d4b]">
                        🏅 {item.studentName}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#7d26c9]">
                        <CalendarDays className="h-3 w-3" />
                        {item.dateLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#4f1d4b]">{item.achievement}</p>
                    {item.achievementEn && (
                      <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
                        {item.achievementEn}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Weekly Honor Leaderboard — Only displayed when Teacher selects honored students */}
      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Bảng xếp hạng trong tuần · Weekly Honor Board</span>
          </h2>
          {weeklyHonors.length > 0 && weeklyHonors[0].weekLabel && (
            <span className="text-xs font-extrabold text-[#7d26c9]">
              {weeklyHonors[0].weekLabel}
            </span>
          )}
        </div>

        {weeklyHonors.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-[#6b4869]">
            Chưa có danh sách tuyên dương tuần này — Cô Tú sẽ chọn các bạn tiêu biểu trong mục Giáo viên.
            <span className="mt-0.5 block text-xs font-semibold opacity-85">
              Weekly honor board is empty — Ms. Tu will select honored students in the Teacher portal.
            </span>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeklyHonors.map((honor, index) => {
              const isMine =
                Boolean(currentStudentName) &&
                honor.studentName.trim().toLowerCase() === currentStudentName.trim().toLowerCase();
              return (
                <div
                  key={honor.id}
                  className={`glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ${
                    isMine ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base font-extrabold text-amber-800">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[#4f1d4b]">{honor.studentName}</p>
                      <p className="text-xs font-semibold text-[#6b4869]">
                        {honor.note || honor.weekLabel}
                      </p>
                    </div>
                  </div>
                  {honor.weekLabel && (
                    <span className="shrink-0 text-[11px] font-bold text-[#7d26c9]">
                      {honor.weekLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Team Competition */}
      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-7">
        <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
          ⭐ Thi đua tổ / nhóm · Team Points
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {teams.map((team) => (
            <div key={team.teamId} className="glass-card rounded-2xl p-5 text-center">
              <p className="text-sm font-extrabold text-[#4f1d4b]">
                {team.name} · {team.nameEn}
              </p>
              <p className="font-display mt-1.5 text-3xl font-extrabold text-[#4f1d4b] tabular-nums">
                {team.points} điểm
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Class Photos — Large "Hình ảnh của lớp / Class Photos" Sticker Replaces Heading Text */}
      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-7">
        <div className="flex justify-center md:justify-start">
          <img
            src={ASSETS.btnHinhAnhLop}
            alt="Hình ảnh của lớp - Class Photos"
            referrerPolicy="no-referrer"
            className="sticker-shadow h-24 w-auto object-contain md:h-28"
          />
          <h2 className="sr-only">Hình ảnh của lớp - Class Photos</h2>
        </div>

        <div className="mt-4 space-y-4">
          {activities.map((mem) => (
            <figure
              key={mem.id}
              className="overflow-hidden rounded-3xl border border-white/80 bg-white/55 shadow-sm backdrop-blur-sm"
            >
              <img
                src={mem.imageUrl}
                alt={mem.title}
                referrerPolicy="no-referrer"
                className="aspect-[16/9] max-h-[420px] w-full object-cover"
              />
              <figcaption className="p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-[#4f1d4b]">
                      {mem.title}
                    </h3>
                    {mem.titleEn && (
                      <p className="text-xs font-extrabold text-[#7d26c9]">{mem.titleEn}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#7d4e78]">{mem.dateLabel}</span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-[#4f1d4b]">{mem.caption}</p>
                {mem.captionEn && (
                  <p className="text-xs font-semibold text-[#6b4869]">{mem.captionEn}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 5. Plans & Events — Large "Kế hoạch & Sự kiện / Plans & Events" Sticker */}
      <section className="glass-panel mt-6 rounded-[1.75rem] p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <img
            src={ASSETS.btnKeHoach}
            alt="Kế hoạch & Sự kiện - Plans & Events"
            referrerPolicy="no-referrer"
            className="sticker-shadow h-24 w-auto object-contain md:h-28"
          />
          <h2 className="sr-only">Kế hoạch &amp; Sự kiện - Plans &amp; Events</h2>
          <span className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-extrabold text-[#7d26c9] tabular-nums">
            {completedTasks}/{tasks.length} ✓
          </span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  task.completed
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 line-through'
                    : 'border-white/85 bg-white/65 text-[#4f1d4b] hover:bg-white/90'
                }`}
              >
                {task.completed ? (
                  <CheckSquare className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 shrink-0 text-purple-600" />
                )}
                <span>
                  <span className="block text-sm font-extrabold">{task.title}</span>
                  <span className="block text-xs font-semibold opacity-80">
                    {task.titleEn}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
