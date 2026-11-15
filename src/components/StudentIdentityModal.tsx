import { GraduationCap, Search, UserCheck, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ASSETS } from '../data/classroomSeed';
import type { RouteTab, StudentRecord } from '../types/classroom';
import { filterStudentsByQuery } from '../utils/studentSession';

interface StudentIdentityModalProps {
  students: StudentRecord[];
  currentStudentName: string;
  onSelectStudent: (name: string) => void;
  onClearStudent: () => void;
  onClose: () => void;
  onNavigate: (route: RouteTab) => void;
}

export function StudentIdentityModal({
  students,
  currentStudentName,
  onSelectStudent,
  onClearStudent,
  onClose,
  onNavigate,
}: StudentIdentityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(
    () => filterStudentsByQuery(students, searchQuery),
    [students, searchQuery]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-identity-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/40 p-4 backdrop-blur-md"
    >
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white/92 p-5 shadow-2xl md:p-7">
        {/* Close button only when switching from an already-selected name */}
        {currentStudentName && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng chọn tên / Close name picker"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#6b4869] shadow-xs transition-colors hover:bg-pink-100 hover:text-[#4f1d4b]"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Bilingual Header with Tho May Mascot */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img
              src={ASSETS.thoMayMascot}
              alt="Thỏ Mây"
              referrerPolicy="no-referrer"
              className="h-16 w-16 object-contain drop-shadow-md md:h-20 md:w-20"
            />
            <div className="text-left">
              <h2
                id="student-identity-title"
                className="font-display text-2xl font-extrabold text-[#4f1d4b] md:text-3xl"
              >
                Em là ai?
              </h2>
              <p className="text-sm font-extrabold text-[#7d26c9] md:text-base">
                Who are you?
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-sm font-bold text-[#4f1d4b]">
            Hãy chọn đúng tên của em trong danh sách học sinh Lớp 3.17 để bắt đầu hoạt động nhé!
          </p>
          <p className="text-xs font-semibold text-[#6b4869]">
            Please select your name from the Class 3.17 student list to get started!
          </p>
        </div>

        {/* Scrollable Class Student Roster Only */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {students.length > 0 ? (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-[#4f1d4b]">
                  Danh sách học sinh Lớp 3.17 ({students.length} bạn) · Class Student List
                </p>
                {currentStudentName && (
                  <span className="text-xs font-bold text-purple-700">
                    Đang chọn: {currentStudentName}
                  </span>
                )}
              </div>

              {students.length > 5 && (
                <div className="relative mt-2.5">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh tên trong danh sách... / Filter class list..."
                    aria-label="Tìm tên trong danh sách học sinh / Filter student list"
                    className="w-full rounded-xl border border-purple-200 bg-white py-2 pr-3 pl-9 text-sm font-bold text-[#4f1d4b] placeholder:text-purple-300 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}

              {filteredStudents.length === 0 ? (
                <p className="mt-4 text-center text-xs font-bold text-[#6b4869]">
                  Không tìm thấy tên khớp “{searchQuery}” trong danh sách lớp. Vui lòng thử lại nhé!
                </p>
              ) : (
                <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredStudents.map((st) => {
                    const isSelected = currentStudentName === st.name;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSelectStudent(st.name)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-extrabold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${
                          isSelected
                            ? 'border-purple-500 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
                            : 'border-white bg-white/90 text-[#4f1d4b] hover:border-purple-300 hover:bg-white'
                        }`}
                      >
                        {isSelected ? (
                          <UserCheck className="h-4 w-4 shrink-0" />
                        ) : (
                          <UserRound className="h-4 w-4 shrink-0 text-purple-500" />
                        )}
                        <span className="truncate">{st.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/55 px-5 py-6 text-center">
              <p className="text-sm font-extrabold text-[#4f1d4b]">
                Danh sách học sinh lớp 3.17 chưa được cô Tú tải lên.
              </p>
              <p className="mt-1 text-xs font-semibold text-[#6b4869]">
                Class 3.17 student roster has not been uploaded yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('teacher');
                }}
                className="btn-violet mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Cô Tú vào mục Giáo viên tải danh sách lớp →</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Bar: Teacher Portal link & Clear/Close when applicable */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-purple-100/80 pt-3">
          {students.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('teacher');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7d26c9] hover:underline"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Giáo viên đăng nhập / Teacher Portal →</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#7d4e78]">
              Chỉ chọn tên trong danh sách lớp · Select from class list only
            </span>
          )}

          {currentStudentName && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearStudent}
                className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
              >
                Bỏ chọn tên / Clear
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-[#6b4869] hover:bg-purple-50"
              >
                Đóng / Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
