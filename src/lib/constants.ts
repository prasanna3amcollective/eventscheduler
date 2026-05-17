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

export const GOOGLE_MAPS_LINK =
  '3am Tea Cigaz, 18th Cross St, GOCHS Colony, Besant Nagar, Chennai, Tamil Nadu 600090, India';
