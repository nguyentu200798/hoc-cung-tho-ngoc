import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Paperclip,
  RotateCw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { ASSETS, SUBJECTS_DATA } from '../data/classroomSeed';
import type {
  LessonAttachment,
  RouteTab,
  SubjectId,
  SubjectItem,
  SubjectLesson,
} from '../types/classroom';
import { buildLessonDownloadUrl } from '../utils/lessonAttachments';
import {
  InlineDocumentAttachmentCard,
  InlineImageAttachmentCard,
} from './LessonAttachmentViewer';

interface StudyViewProps {
  onNavigate: (route: RouteTab) => void;
  selectedSubjectId: SubjectId | null;
  onSelectSubject: (id: SubjectId | null) => void;
  customLessons?: SubjectLesson[];
}

const SUBJECT_EMOJIS: Record<SubjectId, string> = {
  toan: '🧮',
  'tieng-viet': '📖',
  'tieng-anh': '🔤',
  'cong-nghe': '🛠️',
  'tin-hoc': '💻',
  tnxh: '🌱',
  'dao-duc': '💛',
  'mi-thuat': '🎨',
  'am-nhac': '🎵',
  'the-duc': '⚽',
  hdtn: '🌿',
};

function SubjectDetail({
  subject,
  onBack,
  onStartPractice,
}: {
  subject: SubjectItem;
  onBack: () => void;
  onStartPractice: () => void;
}) {
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<LessonAttachment | null>(null);

  const toggleCard = (key: string) => {
    setFlippedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-[1040px] px-3.5 pt-6 pb-12 sm:px-5 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-white/75 px-4 py-1.5 text-sm font-extrabold text-[#62335f] shadow-xs transition-colors hover:bg-white hover:text-[#4f1d4b]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại / Back</span>
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {subject.stickerImage ? (
            <img
              src={subject.stickerImage}
              alt={`${subject.name} - ${subject.englishLabel}`}
              referrerPolicy="no-referrer"
              className="sticker-shadow h-16 w-auto object-contain sm:h-20 md:h-24"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${subject.accentFrom}, ${subject.accentTo})`,
              }}
            >
              <span aria-hidden="true">{SUBJECT_EMOJIS[subject.id]}</span>
            </div>
          )}
          <h1 className="sr-only">
            {subject.name} - {subject.englishLabel}
          </h1>
        </div>

        {subject.id === 'toan' && (
          <button
            type="button"
            onClick={onStartPractice}
            className="btn-violet min-h-[44px] cursor-pointer rounded-2xl px-6 py-2.5 text-center leading-tight whitespace-nowrap transition-all"
          >
            <span className="block text-sm font-extrabold">Bắt đầu ôn tập Toán →</span>
            <span className="block text-[11px] font-bold opacity-90">Start Math Practice</span>
          </button>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {subject.lessons.map((lesson) => {
          const imageAttachments = (lesson.attachments ?? []).filter(
            (a) => a.kind === 'image'
          );
          const docAttachments = (lesson.attachments ?? []).filter(
            (a) => a.kind !== 'image'
          );

          return (
            <section
              key={lesson.id}
              className="glass-panel rounded-3xl p-4 sm:p-6 md:p-7"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="mt-1 h-5 w-5 shrink-0 text-[#7d26c9]" />
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-extrabold text-[#4f1d4b] sm:text-xl">
                    {lesson.title}
                  </h2>
                  <p className="text-xs font-extrabold text-[#7d26c9]">{lesson.titleEn}</p>
                  <p className="mt-1.5 text-sm font-bold text-[#4f1d4b]">{lesson.summary}</p>
                  <p className="text-xs font-semibold text-[#6b4869]">{lesson.summaryEn}</p>
                </div>
              </div>

              {lesson.keyPoints.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {lesson.keyPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-2xl bg-white/55 px-4 py-3 text-sm font-semibold text-[#4f1d4b] backdrop-blur-xs"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8a2be2]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(imageAttachments.length > 0 || docAttachments.length > 0) && (
                <div className="mt-5 space-y-4 border-t border-purple-200/60 pt-5">
                  <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-[#4f1d4b]">
                    <Paperclip className="h-4 w-4 text-[#7d26c9]" />
                    <span>Nội dung &amp; Tài liệu bài học · Lesson Materials</span>
                  </h3>

                  {imageAttachments.length > 0 && (
                    <div className="space-y-4">
                      {imageAttachments.map((img) => (
                        <InlineImageAttachmentCard
                          key={img.id}
                          image={img}
                          onZoom={setLightboxImage}
                        />
                      ))}
                    </div>
                  )}

                  {docAttachments.length > 0 && (
                    <div className="space-y-4">
                      {docAttachments.map((docItem) => (
                        <InlineDocumentAttachmentCard
                          key={docItem.id}
                          docItem={docItem}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {lesson.flashcards.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-base font-extrabold text-[#4f1d4b]">
                    Thẻ ghi nhớ nhanh · Quick Flashcards
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {lesson.flashcards.map((card, cIdx) => {
                      const cardKey = `${lesson.id}-${cIdx}`;
                      const isFlipped = Boolean(flippedMap[cardKey]);
                      return (
                        <button
                          key={cardKey}
                          type="button"
                          onClick={() => toggleCard(cardKey)}
                          className={`flex min-h-[116px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                            isFlipped
                              ? 'border-purple-300 bg-purple-600/90 text-white shadow-md backdrop-blur-md'
                              : 'border-white/90 bg-white/65 text-[#4f1d4b] hover:bg-white/90'
                          }`}
                        >
                          <span className="text-sm font-extrabold">
                            {isFlipped ? card.back : card.front}
                          </span>
                          <span
                            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${
                              isFlipped ? 'text-purple-100' : 'text-[#7d4e78]'
                            }`}
                          >
                            <RotateCw className="h-3 w-3" />
                            {isFlipped ? 'Đáp án / Answer' : 'Lật thẻ / Flip'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Image Lightbox Preview */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.name}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl border-2 border-white bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-2 pt-1">
              <p className="truncate text-sm font-extrabold text-[#4f1d4b]">
                {lightboxImage.name}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={buildLessonDownloadUrl(lightboxImage.url)}
                  download={lightboxImage.name}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-extrabold text-[#5b2358] hover:bg-purple-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải ảnh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  aria-label="Đóng ảnh"
                  className="rounded-full bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-h-[78vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function StudyView({
  onNavigate,
  selectedSubjectId,
  onSelectSubject,
  customLessons = [],
}: StudyViewProps) {
  const mergedSubjects = SUBJECTS_DATA.map((subj) => {
    const extra = customLessons.filter((l) => l.subjectId === subj.id);
    return extra.length > 0 ? { ...subj, lessons: [...extra, ...subj.lessons] } : subj;
  });

  const activeSubject = mergedSubjects.find((s) => s.id === selectedSubjectId) ?? null;

  if (activeSubject) {
    return (
      <SubjectDetail
        subject={activeSubject}
        onBack={() => onSelectSubject(null)}
        onStartPractice={() => onNavigate('practice')}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1220px] px-5 pt-7 pb-14 md:px-8">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-sm font-extrabold text-[#62335f] transition-colors hover:text-[#4f1d4b]"
      >
        <img
          src={ASSETS.btnHomepage}
          alt="Trang chủ - Homepage"
          referrerPolicy="no-referrer"
          className="h-11 w-auto object-contain"
        />
        <span>← Trang chủ / Home</span>
      </button>

      {/* Large Centered Learned Lessons Emblem — Minimal Text */}
      <div className="mt-2 flex flex-col items-center text-center">
        <img
          src={ASSETS.btnBaiHoc}
          alt="Bài học đã học - Learned Lessons"
          referrerPolicy="no-referrer"
          className="sticker-shadow h-36 w-auto object-contain md:h-48"
        />
        <h1 className="font-display mt-1 text-lg font-extrabold text-[#4f1d4b] md:text-xl">
          Học tập · Learning
        </h1>
      </div>

      {/* Large Balanced Subject Sticker Buttons — Minimal Text */}
      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {mergedSubjects.map((subj) => (
          <button
            key={subj.id}
            type="button"
            onClick={() => onSelectSubject(subj.id)}
            aria-label={`${subj.name} - ${subj.englishLabel}`}
            className="glass-card group flex flex-col items-center justify-center rounded-[2rem] px-5 py-6 text-center transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
          >
            <div className="flex h-28 w-full items-center justify-center sm:h-32">
              {subj.stickerImage ? (
                <img
                  src={subj.stickerImage}
                  alt={`${subj.name} - ${subj.englishLabel}`}
                  referrerPolicy="no-referrer"
                  className="sticker-shadow max-h-28 max-w-full w-auto object-contain transition-transform duration-200 group-hover:scale-105 sm:max-h-32"
                />
              ) : (
                <span className="font-display text-lg font-extrabold text-[#4f1d4b]">
                  {subj.name} · {subj.englishLabel}
                </span>
              )}
            </div>

            <span className="mt-3 rounded-full bg-white/75 px-3.5 py-1 text-xs font-extrabold text-[#7d26c9]">
              {subj.lessons.length} bài · {subj.lessons.length === 1 ? '1 lesson' : `${subj.lessons.length} lessons`} →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
