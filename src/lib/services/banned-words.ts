import { prisma } from '@/lib/db/prisma';

// Hardcoded banned words (profanity, etc.)
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
];

const BANNED_WORDS_SET = new Set(BANNED_WORDS.map(word => word.toLowerCase()));

// Cache for database banned words (refresh every 5 minutes)
let cachedDbBannedWords: Set<string> = new Set();
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getDbBannedWords(): Promise<Set<string>> {
  const now = Date.now();
  
  // Return cached if still valid
  if (now < cacheExpiry) {
    return cachedDbBannedWords;
  }

  try {
    // Fetch from database
    const bannedWords = await prisma.bannedWord.findMany({
      select: { word: true },
    });
    
    cachedDbBannedWords = new Set(bannedWords.map(bw => bw.word.toLowerCase()));
    cacheExpiry = now + CACHE_TTL;
    
    return cachedDbBannedWords;
  } catch (error) {
    console.error('[BannedWords] Error fetching from database:', error);
    // Return empty set on error, fallback to hardcoded words only
    return new Set();
  }
}

/**
 * Check if username contains banned words
 * Checks both hardcoded profanity list AND database-banned usernames
 */
export async function containsBannedWord(username: string): Promise<boolean> {
  const lowerUsername = username.toLowerCase();
  
  // Check hardcoded banned words
  for (const bannedWord of BANNED_WORDS_SET) {
    if (lowerUsername.includes(bannedWord)) {
      return true;
    }
  }
  
  // Check database banned words
  const dbBannedWords = await getDbBannedWords();
  for (const bannedWord of dbBannedWords) {
    if (lowerUsername.includes(bannedWord)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Force refresh the banned words cache
 */
export function refreshBannedWordsCache(): void {
  cacheExpiry = 0;
}
