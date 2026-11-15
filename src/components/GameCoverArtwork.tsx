import { useState } from 'react';
import type { CustomGame } from '../types/classroom';
import { resolveGameTopic } from '../utils/gameCatalog';

interface GameCoverArtworkProps {
  game: CustomGame;
  index: number;
}

export function GameCoverArtwork({ game, index }: GameCoverArtworkProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (game.imageUrl && !imgFailed) {
    return (
      <img
        src={game.imageUrl}
        alt={`Minh họa trò chơi ${game.title}`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  const topic = resolveGameTopic(game);

  if (topic === 'toan') {
    return (
      <svg
        viewBox="0 0 400 240"
        aria-hidden="true"
        className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`mathBg-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff4d6" />
            <stop offset="100%" stopColor="#ffe1a8" />
          </linearGradient>
          <linearGradient id={`board-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26644a" />
            <stop offset="100%" stopColor="#1b4d38" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#mathBg-${index})`} />
        <circle cx="348" cy="48" r="24" fill="#fde047" opacity="0.7" />
        {/* Wooden Chalkboard */}
        <rect
          x="52"
          y="20"
          width="296"
          height="148"
          rx="16"
          fill="#c27a38"
        />
        <rect
          x="62"
          y="30"
          width="276"
          height="128"
          rx="10"
          fill={`url(#board-${index})`}
        />
        <text
          x="200"
          y="104"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="44"
          fontWeight="800"
          fontFamily="Nunito, sans-serif"
        >
          5 + 3 = ?
        </text>
        {/* Smiling golden star */}
        <circle cx="322" cy="126" r="26" fill="#facc15" />
        <circle cx="313" cy="122" r="3.2" fill="#713f12" />
        <circle cx="331" cy="122" r="3.2" fill="#713f12" />
        <path
          d="M313 132 Q322 140 331 132"
          fill="none"
          stroke="#713f12"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Desk & colorful number blocks */}
        <rect x="0" y="176" width="400" height="64" fill="#f4be7e" />
        <rect x="78" y="138" width="46" height="46" rx="10" fill="#fb923c" />
        <text x="101" y="169" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">
          1
        </text>
        <rect x="132" y="132" width="46" height="46" rx="10" fill="#4ade80" />
        <text x="155" y="163" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">
          2
        </text>
        <rect x="186" y="142" width="46" height="46" rx="10" fill="#60a5fa" />
        <text x="209" y="173" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">
          +
        </text>
        <rect x="240" y="136" width="46" height="46" rx="10" fill="#f472b6" />
        <text x="263" y="167" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">
          3
        </text>
      </svg>
    );
  }

  if (topic === 'tieng-viet') {
    return (
      <svg
        viewBox="0 0 400 240"
        aria-hidden="true"
        className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`tvBg-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe5f1" />
            <stop offset="65%" stopColor="#ffd3e6" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#tvBg-${index})`} />
        {/* Rainbow */}
        <path
          d="M40 165 A160 125 0 0 1 360 165"
          fill="none"
          stroke="#ff6b9d"
          strokeWidth="12"
          opacity="0.7"
        />
        <path
          d="M54 165 A146 112 0 0 1 346 165"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="12"
          opacity="0.75"
        />
        <path
          d="M68 165 A132 100 0 0 1 332 165"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="12"
          opacity="0.7"
        />
        {/* Meadow hills */}
        <ellipse cx="110" cy="222" rx="150" ry="52" fill="#86efac" />
        <ellipse cx="305" cy="225" rx="155" ry="50" fill="#4ade80" />
        {/* Open smiling storybook */}
        <path
          d="M110 105 Q155 88 200 108 L200 185 Q155 168 110 182 Z"
          fill="#ffffff"
          stroke="#ec4899"
          strokeWidth="5"
        />
        <path
          d="M290 105 Q245 88 200 108 L200 185 Q245 168 290 182 Z"
          fill="#fff5fa"
          stroke="#ec4899"
          strokeWidth="5"
        />
        <text
          x="154"
          y="150"
          textAnchor="middle"
          fill="#db2777"
          fontSize="30"
          fontWeight="800"
        >
          A Ă
        </text>
        <text
          x="246"
          y="150"
          textAnchor="middle"
          fill="#7c3aed"
          fontSize="30"
          fontWeight="800"
        >
          Â B
        </text>
        {/* Fluffy clouds */}
        <circle cx="88" cy="56" r="22" fill="#ffffff" />
        <circle cx="110" cy="48" r="26" fill="#ffffff" />
        <circle cx="134" cy="56" r="20" fill="#ffffff" />
        <circle cx="290" cy="52" r="20" fill="#ffffff" />
        <circle cx="312" cy="46" r="24" fill="#ffffff" />
        <circle cx="334" cy="54" r="18" fill="#ffffff" />
      </svg>
    );
  }

  if (topic === 'tieng-anh') {
    return (
      <svg
        viewBox="0 0 400 240"
        aria-hidden="true"
        className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`enBg-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#ddd6fe" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#enBg-${index})`} />
        <circle cx="70" cy="55" r="28" fill="#fde047" />
        {/* Floating clouds */}
        <ellipse cx="200" cy="195" rx="150" ry="42" fill="#ffffff" />
        <circle cx="120" cy="175" r="36" fill="#ffffff" />
        <circle cx="280" cy="178" r="34" fill="#ffffff" />
        {/* ABC Tiles */}
        <rect x="86" y="72" width="66" height="66" rx="16" fill="#ff5c97" />
        <text x="119" y="117" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800">
          A
        </text>
        <rect x="167" y="56" width="66" height="66" rx="16" fill="#f59e0b" />
        <text x="200" y="101" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800">
          B
        </text>
        <rect x="248" y="72" width="66" height="66" rx="16" fill="#10b981" />
        <text x="281" y="117" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="800">
          C
        </text>
        <text
          x="200"
          y="186"
          textAnchor="middle"
          fill="#6d28d9"
          fontSize="20"
          fontWeight="800"
        >
          ★ ENGLISH ★
        </text>
      </svg>
    );
  }

  // Khám phá (Discovery): match Ocean vs Forest keywords or alternate cleanly
  const lowerTitle = `${game.title} ${game.titleEn ?? ''}`.toLowerCase();
  const isOceanThemed =
    /(đại dương|dai duong|biển|bien|ocean|sea|turtle|rùa|rua|dolphin|cá heo|underwater)/.test(
      lowerTitle
    );
  const isForestThemed =
    /(rừng|rung|forest|jungle|cây|cay|thiên nhiên|thien nhien|nature)/.test(
      lowerTitle
    );
  const showOcean = isOceanThemed || (!isForestThemed && index % 2 === 0);

  if (showOcean) {
    return (
      <svg
        viewBox="0 0 400 240"
        aria-hidden="true"
        className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
      >
        <defs>
          <linearGradient id={`seaBg-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="65%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#seaBg-${index})`} />
        {/* Light rays */}
        <polygon points="90,0 145,0 110,200 40,200" fill="#bae6fd" opacity="0.22" />
        <polygon points="210,0 275,0 245,210 175,210" fill="#bae6fd" opacity="0.18" />
        {/* Ocean floor & corals */}
        <ellipse cx="200" cy="232" rx="230" ry="38" fill="#fcd34d" />
        <circle cx="52" cy="204" r="24" fill="#fb7185" />
        <circle cx="76" cy="212" r="18" fill="#f472b6" />
        <circle cx="348" cy="204" r="22" fill="#a855f7" />
        {/* Cute sea turtle */}
        <ellipse cx="185" cy="148" rx="46" ry="30" fill="#22c55e" />
        <ellipse cx="185" cy="144" rx="34" ry="20" fill="#15803d" />
        <circle cx="236" cy="142" r="15" fill="#4ade80" />
        <circle cx="241" cy="139" r="3" fill="#0f172a" />
        {/* Smiling dolphin */}
        <path
          d="M240 68 Q285 40 326 68 Q305 84 268 82 Q245 80 240 68 Z"
          fill="#93c5fd"
        />
        <circle cx="298" cy="64" r="2.8" fill="#0f172a" />
        {/* Treasure chest */}
        <rect x="275" y="168" width="58" height="38" rx="8" fill="#d97706" />
        <rect x="275" y="168" width="58" height="14" rx="6" fill="#fbbf24" />
        {/* Bubbles */}
        <circle cx="115" cy="84" r="9" fill="#e0f2fe" opacity="0.7" />
        <circle cx="134" cy="60" r="6" fill="#e0f2fe" opacity="0.7" />
        <circle cx="215" cy="86" r="7" fill="#e0f2fe" opacity="0.7" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 240"
      aria-hidden="true"
      className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
    >
      <defs>
        <linearGradient id={`forestBg-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="60%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#forestBg-${index})`} />
      {/* Sunbeams */}
      <circle cx="320" cy="46" r="30" fill="#fef08a" opacity="0.85" />
      {/* Trees & foliage */}
      <circle cx="52" cy="70" r="56" fill="#16a34a" />
      <circle cx="105" cy="50" r="46" fill="#22c55e" />
      <circle cx="352" cy="75" r="52" fill="#15803d" />
      {/* Waterfall */}
      <rect x="255" y="92" width="44" height="118" rx="14" fill="#7dd3fc" />
      <ellipse cx="277" cy="212" rx="64" ry="20" fill="#38bdf8" />
      {/* Meadow hills */}
      <ellipse cx="145" cy="222" rx="165" ry="46" fill="#4ade80" />
      {/* Cute forest explorer cabin */}
      <rect x="135" y="114" width="84" height="68" rx="14" fill="#fef3c7" />
      <polygon points="122,120 177,74 232,120" fill="#fb7185" />
      <rect x="163" y="142" width="28" height="40" rx="12" fill="#f59e0b" />
      <circle cx="177" cy="112" r="10" fill="#fde68a" />
      {/* Flowers */}
      <circle cx="68" cy="196" r="7" fill="#f472b6" />
      <circle cx="96" cy="204" r="6" fill="#fde047" />
      <circle cx="228" cy="200" r="7" fill="#f472b6" />
    </svg>
  );
}
