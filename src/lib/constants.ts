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

export const SKILLS = [
  'Writing',
  'Editing',
  'Photography',
  'Direction',
  'Production',
  'Acting',
  'Cooking',
  'Technical',
  'Social Media',
  'Marketing',
  'Coordination'
] as const;

export type Skill = (typeof SKILLS)[number];

export const GOOGLE_MAPS_LINK =
  '3am Tea Cigaz, 18th Cross St, GOCHS Colony, Besant Nagar, Chennai, Tamil Nadu 600090, India';

/** Directory containing gallery photos (local filesystem path) */
export const PHOTOS_DIRECTORY = '/Users/prassi/Downloads/3am photos';