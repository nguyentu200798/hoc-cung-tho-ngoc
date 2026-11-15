import { ASSETS } from '../data/classroomSeed';
import type { RouteTab, SiteConfig } from '../types/classroom';

interface HomeViewProps {
  siteConfig: SiteConfig;
  onNavigate: (route: RouteTab) => void;
}

interface DoorCard {
  id: RouteTab;
  stickerUrl: string;
  stickerAlt: string;
  guideVi: string;
  guideEn: string;
}

const DOOR_CARDS: DoorCard[] = [
  {
    id: 'study',
    stickerUrl: ASSETS.btnBaiHoc,
    stickerAlt: 'Bài học đã học - Learned Lessons',
    guideVi: 'Xem lại bài đã học theo từng môn học và lật thẻ ghi nhớ nhanh.',
    guideEn: 'Review learned subject lessons & flip quick flashcards.',
  },
  {
    id: 'games',
    stickerUrl: ASSETS.btnKhoGame,
    stickerAlt: 'Kho game - Game Zone',
    guideVi: 'Ôn luyện kiến thức qua các trò chơi thử thách, khám phá trên mây trắng.',
    guideEn: 'Practice knowledge via challenge & discovery cloud games.',
  },
  {
    id: 'activities',
    stickerUrl: ASSETS.btnHoatDongLop,
    stickerAlt: 'Hoạt động của lớp - Class Activities',
    guideVi:
      'Xem hình ảnh hoạt động lớp, việc cần làm trong ngày, thành tích cá nhân & thi đua tổ/nhóm.',
    guideEn: 'View class photos, daily tasks, personal stars & team scores.',
  },
];

export function HomeView({ siteConfig, onNavigate }: HomeViewProps) {
  return (
    <div className="mx-auto max-w-[1220px] px-4 pt-4 pb-10 md:px-8 md:pt-6">
      {/* Main Centerpiece Hero Stage */}
      <section className="glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] px-5 py-7 text-center md:px-10 md:py-10">
        {/* Soft translucent ambient glow orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/5 h-64 w-64 rounded-full bg-white/55 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-1/5 h-64 w-64 rounded-full bg-purple-200/55 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-200/35 blur-3xl"
        />

        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
          {/* Mascot Standing Horizontally Beside Tho May Learning World Logo */}
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
            <div className="relative flex shrink-0 items-center justify-center">
              <span
                aria-hidden="true"
                className="animate-sparkle absolute -top-1 -left-5 text-xl text-amber-400"
              >
                ✦
              </span>
              <span
                aria-hidden="true"
                className="animate-sparkle absolute top-3 -right-4 text-lg text-pink-400"
              >
                ✧
              </span>
              <img
                src={ASSETS.thoMayMascot}
                alt="Linh vật Thỏ Mây nhảy nhót vui vẻ"
                referrerPolicy="no-referrer"
                className="animate-tho-may-dance sticker-shadow h-32 w-auto object-contain sm:h-40 md:h-44"
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              aria-label="Thế Giới Học Tập của Thỏ Mây - Tho May's Learning World"
              className="transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-700"
            >
              <img
                src={ASSETS.thoMayLogo}
                alt="Thế Giới Học Tập của Thỏ Mây - Tho May's Learning World"
                referrerPolicy="no-referrer"
                className="sticker-shadow mx-auto max-h-36 w-auto object-contain sm:max-h-44 md:max-h-52"
              />
            </button>
          </div>

          {/* Bilingual Slogan Ribbon */}
          <div className="mt-2 max-w-2xl">
            <img
              src={ASSETS.sloganBanner}
              alt="Học cùng Thỏ Mây và cô Tú – Mỗi ngày một niềm vui! / Learn with Tho May and Ms. Tu – A New Joy Every Day!"
              referrerPolicy="no-referrer"
              className="sticker-shadow mx-auto max-h-14 w-auto object-contain sm:max-h-16 md:max-h-20"
            />
          </div>

          {/* Balanced Sub-headline Scaled Proportionately Below Slogan */}
          <div className="mt-3 max-w-2xl">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-[#4f1d4b] sm:text-xl md:text-[22px]">
              {siteConfig.heroHeadline}
            </h1>
            <p className="mt-0.5 text-xs font-extrabold text-[#7d26c9] sm:text-sm">
              {siteConfig.heroHeadlineEn}
            </p>
          </div>

          {/* Centered, Italic, Compact Welcome Note */}
          {siteConfig.announcement && (
            <div className="mt-3.5 w-full max-w-2xl rounded-2xl border border-white/85 bg-white/55 px-5 py-2.5 text-center shadow-xs backdrop-blur-md">
              <p className="text-xs leading-relaxed font-semibold text-[#5a2a56] italic sm:text-[13px]">
                {siteConfig.announcement}
              </p>
              {siteConfig.announcementEn && (
                <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-[#755173] italic">
                  {siteConfig.announcementEn}
                </p>
              )}
            </div>
          )}

          {/* 3 Doorway Sticker Buttons with Embedded Guidance Underneath */}
          <div
            aria-label="Các cánh cửa học tập / Learning Doorways"
            className="mt-6 grid w-full grid-cols-1 gap-5 md:grid-cols-3"
          >
            {DOOR_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigate(card.id)}
                aria-label={card.stickerAlt}
                className="glass-card group flex flex-col items-center justify-start rounded-[2rem] px-5 py-6 text-center transition-all duration-200 hover:-translate-y-1.5 hover:bg-white/80 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
              >
                <div className="flex h-28 w-full items-center justify-center sm:h-32">
                  <img
                    src={card.stickerUrl}
                    alt={card.stickerAlt}
                    referrerPolicy="no-referrer"
                    className="sticker-shadow max-h-28 max-w-full w-auto object-contain transition-transform duration-200 group-hover:scale-105 sm:max-h-32"
                  />
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs leading-relaxed font-bold text-[#4f1d4b] sm:text-[13px]">
                    {card.guideVi}
                  </p>
                  <p className="text-[11px] leading-relaxed font-semibold text-[#6b4869]">
                    {card.guideEn}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
