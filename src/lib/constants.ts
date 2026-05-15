export const ACTIVITY_CATEGORIES = [
  'Writing',
  'Cinematography',
  'Acting',
  'Cooking',
  'General',
  'Workshop',
  'Performance',
  'Discussion'
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
