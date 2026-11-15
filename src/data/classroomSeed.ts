import type {
  ActivityMemory,
  CustomGame,
  QuizResult,
  SiteConfig,
  StudentRecord,
  SubjectItem,
  TeamScore,
  WeeklyTask,
} from '../types/classroom';

export const ASSETS = {
  thoMayMascot: '/assets/aistudio/01_Linh_vat_Tho_May_e122a299.png',
  thoMayLogo: '/assets/aistudio/02_Logo_Tho_May_47eb3253.png',
  sloganBanner: '/assets/aistudio/03_Slogan_song_ngu_03d43617.png',
  btnHomepage: '/assets/aistudio/04_Trang_chu_Homepage_32bab461.png',
  btnKhoGame: '/assets/aistudio/05_Kho_game_Game_Zone_a61085d6.png',
  btnThemTroChoi: '/assets/aistudio/06_Them_tro_choi_Add_Game_a9444b22.png',
  btnToan: '/assets/aistudio/07_Toan_Math_02015b4a.png',
  btnTiengViet: '/assets/aistudio/08_Tieng_Viet_Vietnamese_fb6da6b0.png',
  btnTiengAnh: '/assets/aistudio/09_Tieng_Anh_English_0c9416e8.png',
  btnTnxh: '/assets/aistudio/10_Tu_nhien_Xa_hoi_Science_90334379.png',
  btnDaoDuc: '/assets/aistudio/11_Dao_duc_Morality_cb4c9941.png',
  btnMiThuat: '/assets/aistudio/12_Mi_thuat_Art_10c2d04b.png',
  btnAmNhac: '/assets/aistudio/13_Am_nhac_Music_79ba3531.png',
  btnCongNghe: '/assets/stickers/cong_nghe.png',
  btnTinHoc: '/assets/stickers/tin_hoc.png',
  btnGdtc: '/assets/stickers/gdtc.png',
  btnHdtn: '/assets/stickers/hdtn.png',
  btnHoatDongLop: '/assets/aistudio/15_Hoat_dong_cua_lop_Class_Activities_4bd5b33e.png',
  btnHinhAnhLop: '/assets/aistudio/16_Hinh_anh_lop_Class_Photos_376d32c6.png',
  btnBaiHoc: '/assets/aistudio/17_Bai_hoc_da_hoc_Learned_Lessons_f04eb419.png',
  btnKeHoach: '/assets/aistudio/18_Ke_hoach_Su_kien_Plans_Events_f3c84a60.png',
  classSportsDay: '/src/assets/images/class_sports_day_1794581798558.jpg',
};

export const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'toan',
    name: 'Toán',
    englishLabel: 'Math',
    subtitle: 'Khám phá những con số',
    subtitleEn: 'Explore numbers & calculations',
    stickerImage: ASSETS.btnToan,
    accentFrom: '#22a7f0',
    accentTo: '#1c7ed6',
    lessons: [
      {
        id: 'toan-1',
        title: 'Bảng nhân 6, 7, 8, 9',
        titleEn: 'Multiplication Tables 6, 7, 8, 9',
        summary: 'Ghi nhớ nhanh các phép nhân trọng tâm học kì 1 lớp 3.',
        summaryEn: 'Quickly memorize Grade 3 multiplication tables.',
        keyPoints: [
          'Nhân là phép cộng lặp lại các số hạng bằng nhau: 7 × 4 = 7 + 7 + 7 + 7 = 28.',
          'Tính chất giao hoán giúp em nhẩm nhanh: 8 × 6 = 6 × 8 = 48.',
          'Mẹo bảng nhân 9: Chữ số hàng chục tăng dần, hàng đơn vị giảm dần và tổng bằng 9.',
        ],
        flashcards: [
          { front: '6 × 7 = ?', back: '42' },
          { front: '7 × 8 = ?', back: '56' },
          { front: '8 × 9 = ?', back: '72' },
          { front: '9 × 6 = ?', back: '54' },
        ],
      },
      {
        id: 'toan-2',
        title: 'Bảng chia và tìm thành phần chưa biết',
        titleEn: 'Division Tables & Finding Unknowns',
        summary: 'Liên hệ giữa phép nhân và phép chia để giải toán có lời văn.',
        summaryEn: 'Connect multiplication and division to solve word problems.',
        keyPoints: [
          'Muốn tìm thương, ta nhẩm ngược bảng nhân tương ứng: 63 : 7 = 9 vì 7 × 9 = 63.',
          'Muốn tìm thừa số chưa biết, lấy tích chia cho thừa số đã biết.',
        ],
        flashcards: [
          { front: '48 : 6 = ?', back: '8' },
          { front: '63 : 9 = ?', back: '7' },
          { front: '56 : 8 = ?', back: '7' },
          { front: '49 : 7 = ?', back: '7' },
        ],
      },
    ],
  },
  {
    id: 'tieng-viet',
    name: 'Tiếng Việt',
    englishLabel: 'Vietnamese',
    subtitle: 'Yêu tiếng Việt mỗi ngày',
    subtitleEn: 'Love Vietnamese every day',
    stickerImage: ASSETS.btnTiengViet,
    accentFrom: '#ff4d94',
    accentTo: '#e83e8c',
    lessons: [
      {
        id: 'tv-1',
        title: 'Luyện viết đoạn văn tả đồ vật',
        titleEn: 'Writing a Descriptive Paragraph',
        summary: 'Cách quan sát và dùng hình ảnh so sánh khi tả đồ dùng học tập thân thuộc.',
        summaryEn: 'Observe details and use similes to describe school supplies.',
        keyPoints: [
          'Mở đoạn: Giới thiệu đồ vật em yêu thích (chiếc bút, hộp bút, chiếc cặp sách…).',
          'Thân đoạn: Tả hình dáng, màu sắc, chất liệu và các bộ phận nổi bật.',
          'Kết đoạn: Nêu ích lợi và tình cảm giữ gìn đồ vật của em.',
        ],
        flashcards: [
          { front: 'Từ chỉ sự vật là gì?', back: 'Tên người, đồ vật, con vật, cây cối (VD: quyển vở, thỏ trắng).' },
          { front: 'Từ chỉ đặc điểm?', back: 'Từ chỉ màu sắc, hình dáng, tính chất (VD: hồng phấn, xinh xắn).' },
          { front: 'Phép so sánh mẫu?', back: 'Chiếc cặp hồng xinh xắn như một đám mây nhỏ.' },
        ],
      },
    ],
  },
  {
    id: 'tieng-anh',
    name: 'Tiếng Anh',
    englishLabel: 'English',
    subtitle: 'Cùng học từ mới',
    subtitleEn: 'Learn new vocabulary together',
    stickerImage: ASSETS.btnTiengAnh,
    accentFrom: '#65d63e',
    accentTo: '#2fb344',
    lessons: [
      {
        id: 'en-1',
        title: 'My Classroom & School Things',
        titleEn: 'Vocabulary & Sentence Patterns',
        summary: 'Từ vựng và mẫu câu giới thiệu đồ dùng học tập lớp 3.',
        summaryEn: 'Key classroom words and polite greeting sentences.',
        keyPoints: [
          'Mẫu câu hỏi: "What is this?" — "It is a ruler / notebook / pencil case."',
          'Mẫu câu số nhiều: "What are these?" — "They are colored pencils."',
          'Chào cô giáo lịch sự: "Good morning, Ms. Tu!"',
        ],
        flashcards: [
          { front: 'Notebook', back: 'Quyển vở ghi chép' },
          { front: 'Pencil case', back: 'Hộp đựng bút' },
          { front: 'Ruler', back: 'Cái thước kẻ' },
          { front: 'Backpack', back: 'Cái ba lô / cặp sách' },
        ],
      },
    ],
  },
  {
    id: 'cong-nghe',
    name: 'Công nghệ',
    englishLabel: 'Technology',
    subtitle: 'Sáng tạo & lắp ghép kỹ thuật',
    subtitleEn: 'Creative crafts & tech models',
    stickerImage: ASSETS.btnCongNghe,
    accentFrom: '#f59f00',
    accentTo: '#e8590c',
    lessons: [
      {
        id: 'cn-1',
        title: 'Sử dụng đèn học & làm đồ dùng học tập',
        titleEn: 'Using a Study Lamp & Making Crafts',
        summary: 'Nhận biết các bộ phận của đèn học, giữ an toàn điện và làm thước kẻ giấy.',
        summaryEn: 'Identify lamp parts, practice electrical safety, and craft a paper ruler.',
        keyPoints: [
          'Đặt đèn học ở phía tay nghịch (bên trái nếu viết tay phải) để không bị sấp bóng.',
          'Không chạm tay ướt vào công tắc hay dây cắm điện.',
          'Khi làm đồ thủ công, dùng kéo cẩn thận và thu dọn giấy vụn gọn gàng.',
        ],
        flashcards: [
          { front: 'Đèn học đặt phía nào khi viết tay phải?', back: 'Đặt phía bên trái để tránh bóng che chữ.' },
          { front: '4 bộ phận chính của đèn học?', back: 'Đế đèn, thân đèn, chụp đèn và bóng đèn.' },
        ],
      },
    ],
  },
  {
    id: 'tin-hoc',
    name: 'Tin học',
    englishLabel: 'Informatics',
    subtitle: 'Làm quen máy tính thông minh',
    subtitleEn: 'Discover computers & coding',
    stickerImage: ASSETS.btnTinHoc,
    accentFrom: '#7950f2',
    accentTo: '#5f3dc4',
    lessons: [
      {
        id: 'th-1',
        title: 'Các bộ phận máy tính & gõ phím 10 ngón',
        titleEn: 'Computer Parts & Touch Typing',
        summary: 'Phân biệt màn hình, thân máy, bàn phím, chuột và tư thế ngồi đúng.',
        summaryEn: 'Identify monitor, CPU, keyboard, mouse and proper sitting posture.',
        keyPoints: [
          'Hàng phím cơ sở gồm: A S D F G H J K L ; — hai ngón trỏ đặt lên phím có gai F và J.',
          'Giữ lưng thẳng, mắt cách màn hình từ 50cm đến 80cm.',
          'Không tự ý mở tệp lạ hoặc chia sẻ thông tin cá nhân trên mạng.',
        ],
        flashcards: [
          { front: 'Hai phím có gai để đặt ngón trỏ?', back: 'Phím F và phím J trên hàng phím cơ sở.' },
          { front: '4 bộ phận cơ bản của máy tính để bàn?', back: 'Màn hình, thân máy, bàn phím, chuột.' },
        ],
      },
    ],
  },
  {
    id: 'tnxh',
    name: 'Tự nhiên và Xã hội',
    englishLabel: 'Science & Social Studies',
    subtitle: 'Khám phá thế giới quanh em',
    subtitleEn: 'Discover the world around you',
    stickerImage: ASSETS.btnTnxh,
    accentFrom: '#17b9c4',
    accentTo: '#0ca678',
    lessons: [
      {
        id: 'tnxh-1',
        title: 'Cây xanh quanh em & An toàn ở trường',
        titleEn: 'Plants & School Safety',
        summary: 'Tìm hiểu các bộ phận của cây và giữ gìn vệ sinh trường lớp 3.17.',
        summaryEn: 'Learn plant parts and keep our school clean and safe.',
        keyPoints: [
          'Cây xanh gồm: rễ, thân, lá, hoa và quả. Lá cây giúp quang hợp và tạo không khí trong lành.',
          'Giữ an toàn giờ ra chơi: không chạy xô đẩy ở cầu thang, chơi đúng khu vực quy định.',
        ],
        flashcards: [
          { front: 'Bộ phận nào hút nước cho cây?', back: 'Rễ cây (Roots)' },
          { front: 'Khi thấy bạn bị ngã ở sân trường?', back: 'Đỡ bạn và báo ngay cho cô giáo.' },
        ],
      },
    ],
  },
  {
    id: 'dao-duc',
    name: 'Đạo đức',
    englishLabel: 'Morality',
    subtitle: 'Học điều hay, làm việc tốt',
    subtitleEn: 'Kindness & good habits',
    stickerImage: ASSETS.btnDaoDuc,
    accentFrom: '#ff922b',
    accentTo: '#f76707',
    lessons: [
      {
        id: 'dd-1',
        title: 'Em yêu lao động và giữ lời hứa',
        titleEn: 'Responsibility & Keeping Promises',
        summary: 'Những việc làm nhỏ hằng ngày giúp lớp học luôn sạch đẹp, đoàn kết.',
        summaryEn: 'Daily habits that keep Classroom 3.17 happy and united.',
        keyPoints: [
          'Tự giác trực nhật, xếp bàn ghế ngay ngắn trước khi ra về.',
          'Đã hứa với bạn hoặc cô giáo điều gì thì cố gắng thực hiện đúng hẹn.',
        ],
        flashcards: [
          { front: 'Thấy rác dưới sân trường em làm gì?', back: 'Nhặt bỏ vào thùng rác đúng nơi quy định.' },
          { front: 'Khi mượn đồ của bạn?', back: 'Hỏi phép trước khi mượn và trả lại nguyên vẹn.' },
        ],
      },
    ],
  },
  {
    id: 'mi-thuat',
    name: 'Mĩ thuật',
    englishLabel: 'Art',
    subtitle: 'Thỏa sức sáng tạo',
    subtitleEn: 'Unleash your creativity',
    stickerImage: ASSETS.btnMiThuat,
    accentFrom: '#ae3ec9',
    accentTo: '#845ef7',
    lessons: [
      {
        id: 'mt-1',
        title: 'Phối màu nóng - lạnh và vẽ tranh 20/11',
        titleEn: 'Warm & Cool Colors',
        summary: 'Nhận biết sắc màu tươi vui khi vẽ thiệp tặng cô Tú.',
        summaryEn: 'Explore bright colors for greeting cards.',
        keyPoints: [
          'Gam màu nóng: đỏ, cam, vàng tạo cảm giác ấm áp, rực rỡ.',
          'Gam màu lạnh: xanh dương, xanh lá, tím nhạt tạo cảm giác dịu mắt.',
        ],
        flashcards: [
          { front: '3 màu cơ bản?', back: 'Đỏ, Vàng, Xanh lam (Red, Yellow, Blue)' },
          { front: 'Đỏ + Vàng = ?', back: 'Màu Cam (Orange)' },
        ],
      },
    ],
  },
  {
    id: 'am-nhac',
    name: 'Âm nhạc',
    englishLabel: 'Music',
    subtitle: 'Giai điệu tuổi thơ',
    subtitleEn: 'Childhood melodies',
    stickerImage: ASSETS.btnAmNhac,
    accentFrom: '#339af0',
    accentTo: '#22b8cf',
    lessons: [
      {
        id: 'an-1',
        title: '7 nốt nhạc cơ bản & nhịp 2/4',
        titleEn: '7 Musical Notes & Rhythm',
        summary: 'Làm quen với khuông nhạc và giữ nhịp 2/4 trong các bài hát thiếu nhi.',
        summaryEn: 'Clap along to 2/4 rhythm and sing the 7 basic notes.',
        keyPoints: [
          '7 nốt nhạc: Đô (C) - Rê (D) - Mi (E) - Pha (F) - Son (G) - La (A) - Si (B).',
          'Nhịp 2/4 gồm 1 phách mạnh và 1 phách nhẹ.',
        ],
        flashcards: [
          { front: 'Đọc tên 7 nốt nhạc?', back: 'Đô - Rê - Mi - Pha - Son - La - Si' },
          { front: 'Nhịp 2/4 có mấy phách?', back: '2 phách (1 mạnh, 1 nhẹ)' },
        ],
      },
    ],
  },
  {
    id: 'the-duc',
    name: 'Giáo dục thể chất',
    englishLabel: 'Physical Education',
    subtitle: 'Khỏe mạnh mỗi ngày',
    subtitleEn: 'Stay active & healthy',
    stickerImage: ASSETS.btnGdtc,
    accentFrom: '#ff7b00',
    accentTo: '#f03e3e',
    lessons: [
      {
        id: 'td-1',
        title: 'Khởi động đúng cách & tinh thần Hội thao',
        titleEn: 'Warm-Up & Team Spirit',
        summary: 'Giữ cơ thể dẻo dai và cổ vũ đồng đội văn minh.',
        summaryEn: 'Stretch safely before sports and cheer for teammates.',
        keyPoints: [
          'Luôn xoay kĩ các khớp cổ tay, cổ chân, đầu gối trước khi chạy nhảy.',
          'Uống đủ nước và hít thở sâu sau khi vận động.',
        ],
        flashcards: [
          { front: 'Trước khi chạy bền cần làm gì?', back: 'Khởi động làm nóng các khớp từ 5–7 phút.' },
          { front: 'Tinh thần thi đấu đẹp?', back: 'Đoàn kết, trung thực và cổ vũ hết mình!' },
        ],
      },
    ],
  },
  {
    id: 'hdtn',
    name: 'Hoạt động trải nghiệm',
    englishLabel: 'Experiential Learning',
    subtitle: 'Trải nghiệm & kỹ năng sống',
    subtitleEn: 'Hands-on discovery & life skills',
    stickerImage: ASSETS.btnHdtn,
    accentFrom: '#ff4d94',
    accentTo: '#e83e8c',
    lessons: [
      {
        id: 'hdtn-1',
        title: 'Góc học tập gọn gàng & Chung tay bảo vệ môi trường',
        titleEn: 'Tidy Desk & Green Classroom',
        summary: 'Rèn luyện thói quen sắp xếp sách vở ngăn nắp và chăm sóc cây xanh lớp 3.17.',
        summaryEn: 'Keep study corners tidy and care for classroom plants.',
        keyPoints: [
          'Sắp xếp sách giáo khoa, vở bài tập theo từng môn sau mỗi buổi học.',
          'Tưới cây vừa đủ nước và giữ lớp học luôn xanh - sạch - đẹp.',
        ],
        flashcards: [
          { front: 'Sau khi học xong em làm gì?', back: 'Xếp gọn sách vở và dụng cụ học tập vào ngăn bàn.' },
          { front: 'Cách chăm sóc chậu cây lớp?', back: 'Tưới nước vào buổi sáng và nhặt lá úa.' },
        ],
      },
    ],
  },
];

export const INITIAL_STUDENTS: StudentRecord[] = [];

export const INITIAL_TEAMS: TeamScore[] = [
  { teamId: 1, name: 'Tổ 1', nameEn: 'Team 1', points: 35 },
  { teamId: 2, name: 'Tổ 2', nameEn: 'Team 2', points: 30 },
  { teamId: 3, name: 'Tổ 3', nameEn: 'Team 3', points: 40 },
  { teamId: 4, name: 'Tổ 4', nameEn: 'Team 4', points: 25 },
];

export const INITIAL_TASKS: WeeklyTask[] = [
  { id: 't-1', title: 'Ôn bảng nhân chia', titleEn: 'Review multiplication & division tables', completed: false },
  { id: 't-2', title: 'Luyện tính nhân chia', titleEn: 'Practice multiplication & division exercises', completed: false },
  { id: 't-3', title: 'Luyện viết đoạn văn tả đồ vật', titleEn: 'Write a descriptive paragraph about an object', completed: false },
];

export const INITIAL_QUIZ_RESULTS: QuizResult[] = [];

export const ACTIVITY_MEMORIES: ActivityMemory[] = [
  {
    id: 'mem-1',
    title: 'Hội thao 20/11 (ngày 11/11) đạt giải Ba',
    titleEn: '20/11 School Sports Day — 3rd Place Winner',
    dateLabel: '11/11 · Sân trường / Schoolyard',
    imageUrl: ASSETS.classSportsDay,
    caption: 'Các bạn nhỏ lớp 3.17 đoàn kết hết mình trong ngày Hội thao chào mừng 20/11 và xuất sắc mang về giải Ba!',
    captionEn: 'Class 3.17 united with joy on Teachers’ Day Sports Festival and proudly won 3rd Prize!',
  },
];

// Kho game starts empty as requested by the teacher
export const INITIAL_GAMES: CustomGame[] = [];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  classTitle: 'Học Cùng Thỏ Mây và cô Tú',
  classSubtitle: 'Learn with Tho May & Ms. Tu · Class 3.17',
  heroHeadline: 'Chọn một cánh cửa để bắt đầu hành trình hôm nay!',
  heroHeadlineEn: 'Choose a magical door to start today’s learning adventure!',
  announcement:
    'Chào mừng các bạn nhỏ Lớp 3.17 đến với Thế Giới Học Tập của Thỏ Mây! Hãy cùng xem lại bài đã học, khám phá Kho game và thi đua thật vui nhé!',
  announcementEn:
    'Welcome Class 3.17 to Tho May’s Learning World! Review learned lessons, explore the Game Zone, and join class activities!',
  footerCredit: 'website by Nguyen Tu',
};

