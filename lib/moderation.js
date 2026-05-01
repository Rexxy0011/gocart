// Pre-publish content screen. Runs against the listing's title +
// description and rejects anything that hits a banned-keyword pattern.
// Intentionally short and conservative — this is the FB-style "first pass"
// catch, not a comprehensive policy engine. Reports + admin removal
// (lib/actions/reports.js) handle anything that slips through.
//
// Notes for future-you:
// - Patterns are matched case-insensitively against [a-z0-9 ] normalised
//   text. Punctuation/diacritics are stripped before matching so "C O C A I N E"
//   gets caught the same as "cocaine".
// - Rules are grouped so we can route different offences to different
//   admin paths later (e.g. weapons → instant ban, counterfeit → review).
// - The user-facing message deliberately doesn't echo the list — telling
//   bad actors which words are blocked just helps them paraphrase.

const BLOCKED_RULES = [
    {
        rule: 'weapons',
        // Firearms + ammunition. Knives ≤ kitchen size are fine; combat
        // knives / military gear get caught by 'tactical', 'combat'.
        patterns: [
            'gun', 'guns', 'rifle', 'rifles', 'pistol', 'pistols', 'revolver',
            'firearm', 'firearms', 'shotgun', 'machine gun', 'ak47', 'ak 47',
            'ammo', 'ammunition', 'bullets', 'silencer', 'suppressor',
            'grenade', 'explosive', 'tactical knife', 'combat knife',
        ],
    },
    {
        rule: 'controlled-substances',
        patterns: [
            'cocaine', 'heroin', 'meth', 'methamphetamine', 'mdma', 'ecstasy',
            'lsd', 'crack', 'opium', 'weed for sale', 'cannabis for sale',
            'marijuana for sale', 'shrooms', 'magic mushroom', 'tramadol stock',
            'codeine syrup', 'oxycontin', 'fentanyl',
        ],
    },
    {
        rule: 'stolen-goods',
        patterns: [
            'stolen', 'no questions asked', 'no receipt no questions',
            'hot phone', 'fell off the truck', 'snatched',
        ],
    },
    {
        rule: 'counterfeit',
        patterns: [
            'replica', '1:1 copy', '1 1 copy', 'mirror copy', 'super copy',
            'aaa quality', 'first copy', 'master copy',
        ],
    },
    {
        rule: 'adult-content',
        patterns: [
            'escort service', 'escort available', 'sugar daddy', 'sugar mommy',
            'sugar mama', 'massage with extras', 'happy ending massage',
            'sex worker', 'hookup paid', 'runs girl', 'aristos',
        ],
    },
    {
        rule: 'wildlife',
        // Wildlife trafficking. Regular pets (dog, cat, parrot) are allowed.
        patterns: [
            'pangolin', 'ivory tusk', 'elephant tusk', 'rhino horn',
            'tiger skin', 'bushmeat', 'monkey for sale',
        ],
    },
    {
        rule: 'human-trafficking',
        patterns: [
            'house help available for sale', 'sale of bride', 'mail order bride',
            'kidney for sale', 'organ for sale',
        ],
    },
]

const normalise = (text) => (text || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')  // strip diacritics
    .replace(/[^a-z0-9 ]+/g, ' ')                       // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()

// Returns { ok: true } when content passes, or
// { ok: false, rule, message } when it doesn't. The message is generic on
// purpose — see file-level note above.
export function checkListingContent(title, description) {
    const haystack = normalise(`${title || ''} ${description || ''}`)
    if (!haystack) return { ok: true }

    for (const { rule, patterns } of BLOCKED_RULES) {
        for (const pattern of patterns) {
            const safe = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            // Word-boundary match so "gun" doesn't catch "begun".
            const re = new RegExp(`\\b${safe}\\b`, 'i')
            if (re.test(haystack)) {
                return {
                    ok: false,
                    rule,
                    message: 'Your listing contains content that breaks GoCart\'s posting rules. Edit it and try again.',
                }
            }
        }
    }
    return { ok: true }
}
