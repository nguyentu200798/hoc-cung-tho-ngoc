import { Menu, UserCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { ASSETS } from '../data/classroomSeed';
import type { RouteTab, SiteConfig } from '../types/classroom';

interface HeaderProps {
  activeRoute: RouteTab;
  siteConfig: SiteConfig;
  currentStudentName: string;
  onOpenStudentPicker: () => void;
  onNavigate: (route: RouteTab) => void;
}

const NAV_ITEMS: Array<{ id: RouteTab; vi: string; en: string }> = [
  { id: 'home', vi: 'Trang chủ', en: 'Homepage' },
  { id: 'games', vi: 'Kho game', en: 'Game Zone' },
  { id: 'study', vi: 'Học tập', en: 'Learning' },
  { id: 'activities', vi: 'Hoạt động lớp', en: 'Class Activities' },
];

export function Header({
  activeRoute,
  siteConfig,
  currentStudentName,
  onOpenStudentPicker,
  onNavigate,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (route: RouteTab) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/65 bg-white/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2.5 md:px-7">
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex min-w-0 items-center gap-2.5 text-left transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
        >
          <img
            src={ASSETS.thoMayMascot}
            alt="Thỏ Mây"
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 object-contain drop-shadow-sm"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display truncate text-sm font-extrabold tracking-tight text-[#4f1d4b] md:text-base">
              {siteConfig.classTitle}
            </span>
            <span className="hidden truncate text-[11px] font-bold text-[#7d4e78] sm:block">
              {siteConfig.classSubtitle}
            </span>
          </span>
        </button>

        <nav
          className="hidden items-center gap-1.5 lg:flex xl:gap-2"
          aria-label="Điều hướng chính / Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeRoute === item.id ||
              (item.id === 'study' && activeRoute === 'practice') ||
              (item.id === 'games' && activeRoute === 'play');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`flex flex-col items-center rounded-2xl px-3.5 py-1.5 leading-tight whitespace-nowrap shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 xl:px-4 ${
                  isActive
                    ? 'bg-white/85 text-[#4f1d4b] shadow-sm ring-1 ring-white'
                    : 'bg-white/40 text-[#5d2c59] hover:bg-white/75'
                }`}
              >
                <span className="text-xs font-extrabold">{item.vi}</span>
                <span className="text-[10px] font-bold opacity-75">{item.en}</span>
              </button>
            );
          })}

          {/* Selected Student Identity Button right next to Teacher Button */}
          <button
            type="button"
            onClick={onOpenStudentPicker}
            aria-label={
              currentStudentName
                ? `Học sinh: ${currentStudentName}. Nhấn để đổi tên / Click to switch student`
                : 'Em là ai? Nhấn để chọn tên học sinh / Click to pick your name'
            }
            className="flex items-center gap-2 rounded-2xl border border-purple-200/80 bg-white/85 px-3.5 py-1.5 text-left leading-tight whitespace-nowrap shrink-0 shadow-xs transition-all hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
          >
            {currentStudentName ? (
              <UserCheck className="h-4 w-4 shrink-0 text-purple-600" />
            ) : (
              <UserRound className="h-4 w-4 shrink-0 text-purple-600" />
            )}
            <span className="flex flex-col leading-tight">
              <span className="max-w-[145px] truncate text-xs font-extrabold text-[#4f1d4b] xl:max-w-[180px]">
                {currentStudentName || 'Em là ai?'}
              </span>
              <span className="text-[10px] font-bold text-[#7d26c9]">
                {currentStudentName ? 'Đổi tên · Switch' : 'Who are you?'}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('teacher')}
            className={`btn-violet flex flex-col items-center rounded-2xl px-4 py-1.5 leading-tight whitespace-nowrap shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-900 xl:px-5 ${
              activeRoute === 'teacher' ? 'ring-2 ring-white ring-offset-2 ring-offset-pink-200' : ''
            }`}
          >
            <span className="text-xs font-extrabold tracking-wide">GIÁO VIÊN</span>
            <span className="text-[10px] font-bold opacity-90">Teacher</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenStudentPicker}
            aria-label={
              currentStudentName
                ? `Học sinh: ${currentStudentName}. Nhấn để đổi tên`
                : 'Em là ai? / Who are you?'
            }
            className="flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/85 px-3 py-1.5 text-xs font-extrabold text-[#4f1d4b] shadow-xs"
          >
            {currentStudentName ? (
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-purple-600" />
            ) : (
              <UserRound className="h-3.5 w-3.5 shrink-0 text-purple-600" />
            )}
            <span className="max-w-[110px] truncate sm:max-w-[150px]">
              {currentStudentName || 'Em là ai?'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Đóng menu / Close menu' : 'Mở menu / Open menu'}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/75 text-[#4f1d4b] shadow-sm backdrop-blur-md"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/60 bg-white/75 px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                activeRoute === item.id ||
                (item.id === 'study' && activeRoute === 'practice') ||
                (item.id === 'games' && activeRoute === 'play');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex flex-col items-start rounded-2xl px-3.5 py-2 leading-tight whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#4f1d4b] shadow-sm'
                      : 'bg-white/60 text-[#5d2c59]'
                  }`}
                >
                  <span className="text-xs font-extrabold">{item.vi}</span>
                  <span className="text-[10px] font-bold opacity-75">{item.en}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleSelect('teacher')}
              className="btn-violet flex flex-col items-start rounded-2xl px-4 py-2 leading-tight whitespace-nowrap"
            >
              <span className="text-xs font-extrabold">GIÁO VIÊN</span>
              <span className="text-[10px] font-bold opacity-90">Teacher</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
