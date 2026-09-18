import type { DishIllustKind } from '../lib/dishIllust'

const BG = {
  warm: '#FFF4E8',
  cool: '#EEF6F2',
  soft: '#FFF8F0',
  rosy: '#FFF0EE',
  cream: '#FFF7E6',
}

/** やわらかい手描き風。線は太めで角を丸く */
export function DishIllustIcon({
  kind,
  className = '',
}: {
  kind: DishIllustKind
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill={bgFor(kind)} />
      {draw(kind)}
    </svg>
  )
}

function bgFor(kind: DishIllustKind): string {
  switch (kind) {
    case 'fish':
    case 'salad':
    case 'veggie':
    case 'aemono':
      return BG.cool
    case 'soup':
    case 'nabe':
    case 'curry':
      return BG.rosy
    case 'egg':
    case 'bread':
    case 'rice':
    case 'don':
      return BG.cream
    default:
      return BG.warm
  }
}

function draw(kind: DishIllustKind) {
  switch (kind) {
    case 'fish':
      return (
        <g fill="none" stroke="#3A7A8C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 34c8-12 20-16 32-10 6 3 10 8 12 12-2 4-6 9-12 12-12 6-24 2-32-10z" fill="#9ED4E0" />
          <circle cx="42" cy="30" r="1.6" fill="#2F5F6C" stroke="none" />
          <path d="M12 34l-5-5M12 34l-5 5" />
          <path d="M28 28c2 2 3 5 2 8" />
        </g>
      )
    case 'meat':
      return (
        <g fill="none" stroke="#B85C3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="34" rx="18" ry="12" fill="#E8A07A" />
          <path d="M18 30c4-6 10-8 16-6" />
          <path d="M24 38c3 2 8 3 14 1" />
          <path d="M38 18c2 3 3 6 2 10" stroke="#7A9A5A" />
        </g>
      )
    case 'stirfry':
      return (
        <g fill="none" stroke="#C46A2D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 28c0-4 4-8 10-8h16c6 0 10 4 10 8v4H14v-4z" fill="#F0C9A0" />
          <path d="M12 32h40l-3 14H15z" fill="#E8B070" />
          <path d="M24 22l2-6M32 20v-6M40 22l-2-6" stroke="#7A9A5A" />
          <circle cx="26" cy="38" r="2.2" fill="#7CB87A" stroke="none" />
          <circle cx="36" cy="40" r="2" fill="#E07060" stroke="none" />
        </g>
      )
    case 'nimono':
      return (
        <g fill="none" stroke="#A86B3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="40" rx="18" ry="8" fill="#F2D2A8" />
          <path d="M14 40v-8c0-8 8-14 18-14s18 6 18 14v8" fill="#F8E0C0" />
          <circle cx="24" cy="36" r="3.5" fill="#E8A06A" stroke="none" />
          <circle cx="36" cy="34" r="4" fill="#D4885A" stroke="none" />
          <path d="M44 30c1 2 1 4 0 6" />
        </g>
      )
    case 'fried':
      return (
        <g fill="none" stroke="#C47A2A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="34" rx="16" ry="12" fill="#F0C878" />
          <path d="M22 30c3-2 8-3 14-1M24 38c4 1 10 1 14-1" />
          <path d="M18 24c2-4 6-6 10-5" stroke="#E8A040" />
        </g>
      )
    case 'don':
      return (
        <g fill="none" stroke="#8B5A3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 丼ぶり：底の深い器＋盛ったご飯＋具 */}
          <path d="M12 34h40l-4 16H16z" fill="#E8C4A0" />
          <ellipse cx="32" cy="34" rx="20" ry="5" fill="#F0D4B0" />
          <path d="M18 32c2-10 8-14 14-14s12 4 14 14" fill="#FFF8EC" stroke="#D8C4A0" />
          <circle cx="26" cy="26" r="1.4" fill="#E8D8C0" stroke="none" />
          <circle cx="32" cy="24" r="1.3" fill="#E8D8C0" stroke="none" />
          <circle cx="38" cy="27" r="1.2" fill="#E8D8C0" stroke="none" />
          <path d="M22 28c4 4 10 5 16 2" stroke="#D4785A" strokeWidth="2.4" />
          <circle cx="28" cy="22" r="2.4" fill="#E07060" stroke="none" />
          <circle cx="36" cy="20" r="2.2" fill="#F0C060" stroke="none" />
        </g>
      )
    case 'noodle':
      return (
        <g fill="none" stroke="#8B5A3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="46" rx="18" ry="5" fill="#E8C8A0" />
          <path d="M14 46V34c0-8 8-14 18-14s18 6 18 14v12" fill="#F5E0C0" />
          <path d="M20 34c4 2 8-2 12 0s8-2 12 0" stroke="#D4A060" />
          <path d="M22 38c4 2 8-1 12 1s7-1 10 0" stroke="#D4A060" />
          <path d="M40 22v10M44 24v8" stroke="#5A4A3A" />
        </g>
      )
    case 'pasta':
      return (
        <g fill="none" stroke="#B85C3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="44" rx="18" ry="6" fill="#F0D8B8" />
          <path d="M14 44c2-12 10-18 18-18s16 6 18 18" fill="#F8E8D0" />
          <path d="M20 36c6 4 12-2 18 2s8 0 10-2" stroke="#E07050" />
          <path d="M22 40c5 2 10-1 14 1" stroke="#E07050" />
          <circle cx="28" cy="30" r="2" fill="#7CB87A" stroke="none" />
          <circle cx="38" cy="32" r="1.8" fill="#E07060" stroke="none" />
        </g>
      )
    case 'rice':
      return (
        <g fill="none" stroke="#8B6A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* お茶碗＋白いご飯の山＋箸 */}
          <path d="M16 36h32l-3 14H19z" fill="#F2D2A8" />
          <ellipse cx="32" cy="36" rx="16" ry="4.5" fill="#F8E0C0" />
          <path d="M20 35c1-11 7-16 12-16s11 5 12 16" fill="#FFF9F0" stroke="#D8C4A0" />
          <circle cx="26" cy="28" r="1.5" fill="#E8D8C0" stroke="none" />
          <circle cx="32" cy="25" r="1.6" fill="#E8D8C0" stroke="none" />
          <circle cx="37" cy="29" r="1.4" fill="#E8D8C0" stroke="none" />
          <circle cx="29" cy="31" r="1.2" fill="#E8D8C0" stroke="none" />
          <path d="M46 18l6 20M50 16l6 20" stroke="#5A4A3A" strokeWidth="2" />
        </g>
      )
    case 'soup':
      return (
        <g fill="none" stroke="#8B5A3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 30h32l-3 18H19z" fill="#F0C878" />
          <ellipse cx="32" cy="30" rx="16" ry="5" fill="#F8D898" />
          <path d="M24 26c1-4 3-6 5-6M32 24c1-3 2-5 4-5M40 26c0-3 1-5 3-5" stroke="#C4A070" />
          <circle cx="28" cy="36" r="2" fill="#7CB87A" stroke="none" />
          <circle cx="36" cy="38" r="2.2" fill="#E8A06A" stroke="none" />
        </g>
      )
    case 'salad':
      return (
        <g fill="none" stroke="#5A8A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="44" rx="16" ry="5" fill="#E8F0D8" />
          <path d="M18 44c2-10 8-16 14-16 3 0 6 2 8 5" fill="#A8D48A" />
          <path d="M28 28c4-6 10-8 14-4 2 3 2 7 0 10" fill="#8BC46A" />
          <circle cx="26" cy="38" r="2.5" fill="#E07060" stroke="none" />
          <circle cx="38" cy="36" r="2" fill="#F0C060" stroke="none" />
        </g>
      )
    case 'curry':
      return (
        <g fill="none" stroke="#8B5A3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 皿：左カレー・右白いご飯 */}
          <ellipse cx="32" cy="40" rx="20" ry="12" fill="#F0D8B8" />
          <path d="M14 40c2-8 8-12 16-10v16c-8 0-14-2-16-6z" fill="#E09040" stroke="#C47030" />
          <path d="M34 30c8-2 14 2 16 10-2 4-8 6-16 6V30z" fill="#FFF8EC" stroke="#D8C4A0" />
          <circle cx="40" cy="36" r="1.3" fill="#E8D8C0" stroke="none" />
          <circle cx="44" cy="40" r="1.2" fill="#E8D8C0" stroke="none" />
          <circle cx="38" cy="42" r="1.1" fill="#E8D8C0" stroke="none" />
        </g>
      )
    case 'egg':
      return (
        <g fill="none" stroke="#C49A3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="36" rx="16" ry="12" fill="#FFF4D0" />
          <circle cx="32" cy="36" r="6" fill="#F0C040" stroke="#D4A020" />
          <path d="M20 28c2-2 4-2 6 0" />
        </g>
      )
    case 'tofu':
      return (
        <g fill="none" stroke="#8A9A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="22" width="28" height="24" rx="4" fill="#F4F6F0" />
          <path d="M18 32h28M32 22v24" stroke="#D0D8D0" />
          <path d="M40 18c2 2 3 4 2 7" stroke="#7A9A5A" />
        </g>
      )
    case 'nabe':
      return (
        <g fill="none" stroke="#6A5A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 34h40l-4 14H16z" fill="#C47050" />
          <ellipse cx="32" cy="34" rx="20" ry="6" fill="#D48860" />
          <path d="M10 34h4M50 34h4" />
          <path d="M24 28c1-4 3-6 5-6M32 26c1-3 3-5 5-5M40 28c0-3 2-5 4-5" stroke="#C4A070" />
          <circle cx="26" cy="38" r="2" fill="#F0C878" stroke="none" />
          <circle cx="36" cy="40" r="2.2" fill="#7CB87A" stroke="none" />
        </g>
      )
    case 'steam':
      return (
        <g fill="none" stroke="#6A8A9A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="30" width="32" height="16" rx="3" fill="#E8F0F4" />
          <path d="M16 36h32" />
          <path d="M24 24c0-3 2-5 4-5M32 22c0-3 2-5 4-5M40 24c0-3 1-4 3-4" stroke="#A0B8C4" />
          <ellipse cx="32" cy="38" rx="8" ry="3" fill="#F0C8A0" stroke="#C49A70" />
        </g>
      )
    case 'aemono':
      return (
        <g fill="none" stroke="#5A8A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="42" rx="16" ry="6" fill="#E8F0D8" />
          <path d="M20 42c2-8 6-12 12-12s10 4 12 12" fill="#B8D89A" />
          <path d="M26 34c2 2 6 3 10 1" stroke="#6A9A4A" />
          <circle cx="28" cy="38" r="1.8" fill="#5A4A3A" stroke="none" />
          <circle cx="36" cy="39" r="1.5" fill="#5A4A3A" stroke="none" />
        </g>
      )
    case 'dumpling':
      return (
        <g fill="none" stroke="#C49A5A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 38c4-12 12-16 16-16s12 4 16 16c-4 4-10 6-16 6s-12-2-16-6z" fill="#F8E8C8" />
          <path d="M24 30c2 2 4 3 8 2M32 28c2 2 4 3 8 2" />
        </g>
      )
    case 'bread':
      return (
        <g fill="none" stroke="#C49A5A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="36" rx="18" ry="12" fill="#F0D8A0" />
          <path d="M18 34c4-6 10-8 16-6 4 1 8 4 10 8" />
          <path d="M24 30c1-2 3-3 5-2M34 28c2-1 4 0 5 2" stroke="#D4B070" />
        </g>
      )
    case 'veggie':
      return (
        <g fill="none" stroke="#5A8A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 44c-8-2-14-10-12-18 6-2 12 2 14 8 2-6 8-10 14-8 2 8-4 16-12 18z" fill="#8BC46A" />
          <path d="M32 34v-12" stroke="#6A9A4A" />
          <path d="M28 26c2-3 4-4 6-2" />
        </g>
      )
    case 'staple':
      return (
        <g fill="none" stroke="#8B6A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 主食フォールバックもお茶碗ごはん */}
          <path d="M16 38h32l-3 12H19z" fill="#F2D2A8" />
          <ellipse cx="32" cy="38" rx="16" ry="4" fill="#F8E0C0" />
          <path d="M20 37c1-10 7-14 12-14s11 4 12 14" fill="#FFF9F0" stroke="#D8C4A0" />
          <circle cx="27" cy="30" r="1.4" fill="#E8D8C0" stroke="none" />
          <circle cx="33" cy="28" r="1.5" fill="#E8D8C0" stroke="none" />
          <circle cx="37" cy="32" r="1.3" fill="#E8D8C0" stroke="none" />
          <path d="M46 20l5 16M50 18l5 16" stroke="#5A4A3A" strokeWidth="2" />
        </g>
      )
    case 'main':
      return (
        <g fill="none" stroke="#B85C3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="40" rx="18" ry="8" fill="#F0D0B0" />
          <ellipse cx="32" cy="30" rx="12" ry="8" fill="#E8A07A" />
          <path d="M24 28c3 2 8 3 12 0" />
          <path d="M40 20c1 2 2 4 1 7" stroke="#7A9A5A" />
        </g>
      )
    case 'side':
      return (
        <g fill="none" stroke="#6A8A5A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="32" cy="42" rx="14" ry="6" fill="#E8F0D8" />
          <path d="M22 42c1-8 5-12 10-12s9 4 10 12" fill="#C8E0A8" />
          <circle cx="30" cy="36" r="2" fill="#E07060" stroke="none" />
          <circle cx="36" cy="38" r="1.6" fill="#F0C060" stroke="none" />
        </g>
      )
  }
}
