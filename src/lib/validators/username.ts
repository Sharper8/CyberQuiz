import { z } from 'zod';
import { prisma } from '../db/prisma';

// Comprehensive banned words list (English and French profanity)
const BANNED_WORDS = [
  // English profanity
  'ass', 'asshole', 'bitch', 'bitches', 'crap', 'damn', 'dammit', 'damnit',
  'dick', 'dickhead', 'dildo', 'fuck', 'fucked', 'fucker', 'fucking', 'fuckup',
  'fuckwit', 'hell', 'hellish', 'horny', 'jackass', 'jerk', 'jerkoff', 'nigger',
  'nigga', 'piss', 'pissed', 'pussy', 'shit', 'shitty', 'slut', 'whore',
  'wtf', 'wth', 'arsehole', 'arse', 'bollocks', 'bugger', 'cock', 'cockhead',
  'cunt', 'twat', 'bastard', 'bellend', 'blighter', 'bloody', 'damnable',
  'freaking', 'frickin', 'goddamn', 'goddam', 'goddamned', "hell's",
  'hells', 'motherfucker', 'motherfucking', 'prick', 'screw', 'screwed',
  'shag', 'sodding', 'sod', 'tosser', 'wanker', 'wank', 'douchebag',
  
  // French profanity
  'connard', 'connasse', 'salaud', 'salopard', 'saloperie', 'salope',
  'con', 'cons', 'conne', 'connes', 'enculé', 'enculée', 'enculés', 'enculées',
  'fils de pute', 'filsdepute', 'filsdeputa', 'foutre', 'foutaise', 'foutu',
  'nique', 'niquer', 'putain', 'putasserie', 'pute', 'putefrancaise', 'putan',
  'débile', 'débiles', 'débilité', 'débilités',
  'imbécile', 'imbéciles', 'imbécillité',
  'merde', 'merder', 'merdeur', 'merdeuse', 'merdreux',
  'sacrebleu', 'sacredieu', 'sacredie', 'sacredios', 'sacredis',
  'zut', 'zutement', 'zuterie',
  'couilles', 'couillon', 'couillons', 'couillonnade',
  'cul', 'culasse', 'culs', 'culerie',
  'fesse', 'fesses', 'fessefleur',
  'queue', 'queues',
  'trou du cul', 'trouducul', 'trous',
  'bite', 'bites', 'biter', 'bitée',
  'bidet', 'bidets',
  'boche', 'boches',
  'bordel', 'bordels', 'bordelaise', 'bordelaises',
  'bougre', 'bougres', 'bougrement',
  'branleur', 'branleuse', 'branleurs', 'branleuses',
  'chiasse', 'chiasserie', 'chiasseries',
  'chieur', 'chieuse', 'chieurs', 'chieuses',
  'couenne', 'couennes',
  'crasseux', 'crasseuse', 'crasserie', 'crasseries',
  'crotte', 'crottes', 'crottard', 'crottards',
  'dégobille', 'dégobilles', 'dégobiller',
  'dégueulis', 'dégueule', 'dégueulasses',
  'donzelle', 'donzelles',
  'dragée', 'dragées',
  'fange', 'fanges',
  'faquir', 'faquirs',
  'fêlé', 'fêlée', 'fêlés', 'fêlées',
  'fouille', 'fouilles', 'fouille-merde',
  'fripouille', 'fripouilles',
  'frocard', 'frocards',
  'frusque', 'frusques',
  'gâterie', 'gâteries',
  'gland', 'glands',
  'glette', 'glettes',
  'gomorrhéen', 'gomorrhéenne', 'gomorrhéens', 'gomorrhéennes',
  'gourde', 'gourdes', 'gourdin', 'gourdins',
  'goyim', 'goyims',
  'grabuge', 'grabuges',
  'graillon', 'graillons', 'graillonner',
  'grance', 'grances',
  'grapaud', 'grapauds',
  'greluche', 'greluches',
  'gribiche', 'gribiches',
];

// Create a Set for O(1) lookup performance
const BANNED_WORDS_SET = new Set(BANNED_WORDS.map(word => word.toLowerCase()));

/**
 * Check if username contains any banned words
 * @param username The username to check
 * @returns true if username is clean, false if it contains banned words
 */
function isUsernameBanned(username: string): boolean {
  const lowerUsername = username.toLowerCase();
  
  // Check for exact matches and partial matches of banned words
  for (const bannedWord of BANNED_WORDS_SET) {
    if (lowerUsername.includes(bannedWord)) {
      return true;
    }
  }
  
  return false;
}

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (username) => !isUsernameBanned(username),
    'Username contains inappropriate language'
  );

export type Username = z.infer<typeof UsernameSchema>;

/**
 * Validates and checks username uniqueness for a quiz session
 * @param username The username to validate
 * @throws Error if validation fails
 */
export async function validateUsernameUnique(username: string): Promise<void> {
  UsernameSchema.parse(username);

  // Check uniqueness in active/recent quiz sessions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.quizSession.findFirst({
    where: {
      username,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  if (existing) {
    throw new Error(`Username "${username}" was recently used. Please choose a different one.`);
  }
}
