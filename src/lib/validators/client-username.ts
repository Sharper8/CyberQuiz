// Comprehensive banned words list (English and French profanity)
const BANNED_WORDS = [
  // English profanity
  'ass', 'asshole', 'bitch', 'bitches', 'crap', 'damn', 'dammit', 'damnit',
  'dick', 'dickhead', 'dildo', 'fuck', 'fucked', 'fucker', 'fucking', 'fuckup',
  'fuckwit', 'hell', 'hellish', 'horny', 'jackass', 'jerk', 'jerkoff', 'nigger',
  'nigga', 'piss', 'pissed', 'pussy', 'shit', 'shitty', 'slut', 'whore',
  'wtf', 'wth', 'arsehole', 'arse', 'bollocks', 'bugger', 'cock', 'cockhead',
  'cunt', 'twat', 'bastard', 'bellend', 'blighter', 'bloody', 'damnable',
  'freaking', 'frickin', 'goddamn', 'goddam', 'goddamned', 'motherfucker', 'motherfucking',
  'prick', 'screw', 'screwed', 'shag', 'sodding', 'sod', 'tosser', 'wanker', 'wank', 'douchebag',
  
  // French profanity
  'connard', 'connasse', 'salaud', 'salopard', 'saloperie', 'salope',
  'con', 'cons', 'conne', 'connes', 'enculé', 'enculée', 'enculés', 'enculées',
  'fils de pute', 'filsdepute', 'filsdeputa', 'foutre', 'foutaise', 'foutu',
  'nique', 'niquer', 'putain', 'putasserie', 'pute', 'putefrancaise', 'putan',
  'con de con', 'débile', 'débiles', 'imbécile', 'imbéciles',
  'merde', 'merder', 'merdeur', 'merdeuse',
  'couilles', 'couillon', 'couillons',
  'cul', 'culasse', 'culs',
  'fesse', 'fesses',
  'queue', 'queues',
  'trou du cul', 'trouducul', 'trous',
  'bite', 'bites', 'biter',
  'bordel', 'bordels',
];

// Create a Set for O(1) lookup performance
const BANNED_WORDS_SET = new Set(BANNED_WORDS.map(word => word.toLowerCase()));

/**
 * Check if a username contains any banned words
 * @param username The username to validate
 * @returns true if username is valid, false if it contains banned words
 */
export function isUsernameValid(username: string): boolean {
  if (!username || username.trim().length === 0) {
    return false;
  }
  
  const lowerUsername = username.toLowerCase();
  
  // Check for exact matches and partial matches of banned words
  for (const bannedWord of BANNED_WORDS_SET) {
    if (lowerUsername.includes(bannedWord)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate username format and content
 * @param username The username to validate
 * @returns object with isValid and error message
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Le pseudo est obligatoire' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Le pseudo doit contenir au moins 3 caractères' };
  }
  
  if (username.length > 32) {
    return { isValid: false, error: 'Le pseudo ne doit pas dépasser 32 caractères' };
  }
  
  if (!isUsernameValid(username)) {
    return { isValid: false, error: 'Le pseudo contient des mots inappropriés' };
  }
  
  return { isValid: true };
}
