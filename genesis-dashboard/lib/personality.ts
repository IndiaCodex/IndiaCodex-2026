export type PersonalityName = 'Aggressive' | 'Conservative' | 'Creative';

type PersonalityBadgeTheme = {
  label: string;
  wrapperClassName: string;
  iconClassName: string;
  textClassName: string;
};

const DEFAULT_THEME: PersonalityBadgeTheme = {
  label: 'Unknown',
  wrapperClassName: 'bg-zinc-800/80 border-zinc-700',
  iconClassName: 'text-zinc-400',
  textClassName: 'text-zinc-300',
};

const THEMES: Record<PersonalityName, PersonalityBadgeTheme> = {
  Aggressive: {
    label: 'Aggressive',
    wrapperClassName: 'bg-red-500/15 border-red-500/30',
    iconClassName: 'text-red-400',
    textClassName: 'text-red-300',
  },
  Conservative: {
    label: 'Conservative',
    wrapperClassName: 'bg-blue-500/15 border-blue-500/30',
    iconClassName: 'text-blue-400',
    textClassName: 'text-blue-300',
  },
  Creative: {
    label: 'Creative',
    wrapperClassName: 'bg-purple-500/15 border-purple-500/30',
    iconClassName: 'text-purple-400',
    textClassName: 'text-purple-300',
  },
};

export function getPersonalityBadgeTheme(personality?: string | null): PersonalityBadgeTheme {
  const normalized = personality?.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_THEME;
  }

  switch (normalized) {
    case 'aggressive':
      return THEMES.Aggressive;
    case 'conservative':
      return THEMES.Conservative;
    case 'creative':
      return THEMES.Creative;
    default:
      return {
        ...DEFAULT_THEME,
        label: personality?.trim() ?? DEFAULT_THEME.label,
      };
  }
}
