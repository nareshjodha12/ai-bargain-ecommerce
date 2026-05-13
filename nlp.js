/**
 * nlp.js
 * ─────────────────────────────────────────────
 * PURPOSE  : Natural Language Processing for customer messages
 * USED BY  : negotiation.js
 * EXPORTS  : detectIntent(), extractPrice(), detectSentiment()
 * ─────────────────────────────────────────────
 *
 * This module converts raw customer text into structured data.
 *
 * Example:
 *   Input : "bhai 1500 mein de do, urgent hai"
 *   Output: { intent: "offer", price: 1500, sentiment: "urgent" }
 *
 * Three-stage NLP pipeline:
 *   Stage 1 → Intent Classification  (what does customer WANT?)
 *   Stage 2 → Entity Extraction      (what PRICE did they say?)
 *   Stage 3 → Sentiment Analysis     (what is their MOOD?)
 */

// ─── STAGE 1: INTENT CLASSIFICATION ──────────────────────────

/**
 * detectIntent(message)
 *
 * Classifies customer message into one of 5 intents:
 *   "accept"  → customer agrees to current offer
 *   "reject"  → customer walks away
 *   "offer"   → customer is proposing a price
 *   "question"→ customer wants product information
 *   "chat"    → general conversation, no clear intent
 *
 * Algorithm: Keyword matching with priority order.
 * Accept and Reject checked first because they are strong signals.
 * If a number is present → it is an offer.
 * Everything else → general chat.
 */
function detectIntent(message) {
  // Normalize: lowercase + trim whitespace
  const m = message.toLowerCase().trim();

  // ── ACCEPT INTENT ──────────────────────────────────────────
  // Customer is saying YES to the current counter-offer
  const ACCEPT_KEYWORDS = [
    // English
    "okay", "ok", "deal", "done", "accepted", "accept",
    "fine", "agreed", "agree", "yes", "sure", "confirm",
    "sounds good", "alright", "perfect", "great", "cool",
    "works for me", "i'll take it", "i will take",
    "let's do it", "lets do it", "go ahead", "proceed",
    // Hindi/Hinglish
    "chalega", "theek hai", "maan gaya", "le leta", "le lunga",
    "haan", "bilkul", "zaroor", "pakka", "sahi hai",
    "ho jaaye", "ho gaya deal", "done deal"
  ];
  for (const kw of ACCEPT_KEYWORDS) {
    if (m.includes(kw)) return "accept";
  }

  // ── REJECT INTENT ──────────────────────────────────────────
  // Customer is leaving or refusing
  const REJECT_KEYWORDS = [
    // English
    "no", "nope", "nah", "not interested", "too expensive",
    "forget it", "leave it", "never mind", "cancel", "quit",
    "bye", "goodbye", "exit", "close", "stop", "end",
    "not buying", "wont buy", "too much", "overpriced",
    // Hindi/Hinglish
    "nahi", "nahi chahiye", "band karo", "bahut mehnga",
    "chodo", "rehne do", "mat karo", "nahin", "na",
    "bohot zyada", "afford nahi"
  ];
  for (const kw of REJECT_KEYWORDS) {
    // Use word boundary check for short words like "no", "na"
    const regex = new RegExp(`\\b${kw}\\b`);
    if (regex.test(m)) return "reject";
  }

  // ── QUESTION INTENT ────────────────────────────────────────
  // Customer wants to know about the product
  const QUESTION_KEYWORDS = [
    "what", "how", "why", "which", "where", "when",
    "tell me", "describe", "features", "specification", "specs",
    "warranty", "color", "colour", "size", "weight", "material",
    "battery", "camera", "display", "processor", "memory",
    "delivery", "shipping", "return", "refund", "original",
    "genuine", "brand new", "review", "rating",
    // Hindi
    "kya hai", "kya he", "batao", "bata do", "kaisa hai",
    "kitne ka", "kab milega", "color kya", "warranty kitni"
  ];
  for (const kw of QUESTION_KEYWORDS) {
    if (m.includes(kw)) return "question";
  }

  // ── OFFER INTENT ───────────────────────────────────────────
  // If message contains any number → it is a price offer
  // Regex: \d matches any digit 0-9
  if (/\d/.test(m)) return "offer";

  // ── DEFAULT ────────────────────────────────────────────────
  return "chat";
}

// ─── STAGE 2: ENTITY EXTRACTION ──────────────────────────────

/**
 * extractPrice(message)
 *
 * Extracts the price number from a natural language message.
 * Handles multiple formats Indian customers commonly use:
 *   "1500"          → 1500
 *   "₹1,500"        → 1500
 *   "rs. 1500"      → 1500
 *   "1.5k"          → 1500
 *   "15 hundred"    → 1500
 *   "1 lakh 50"     → 100050
 *
 * Returns null if no price found.
 */
function extractPrice(message) {
  const m = message.toLowerCase().trim();

  // ── LAKH HANDLING ──────────────────────────────────────────
  // "1 lakh" = 100000, "1.5 lakh" = 150000
  const lakhMatch = m.match(/(\d+\.?\d*)\s*lakh/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  // ── K SHORTHAND ────────────────────────────────────────────
  // "2k" = 2000, "1.5k" = 1500, "52k" = 52000
  // \b ensures "make" doesn't match as "k"
  const kMatch = m.match(/(\d+\.?\d*)\s*k\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  // ── RUPEE SYMBOL ───────────────────────────────────────────
  // "₹1500" or "₹ 1,500" or "₹1,500.00"
  const rupeeMatch = m.match(/₹\s*([\d,]+)/);
  if (rupeeMatch) return parseInt(rupeeMatch[1].replace(/,/g, ""));

  // ── RS / RS. PREFIX ────────────────────────────────────────
  // "rs 1500" or "rs. 1500" or "rs1500"
  const rsMatch = m.match(/rs\.?\s*([\d,]+)/);
  if (rsMatch) return parseInt(rsMatch[1].replace(/,/g, ""));

  // ── HUNDRED PATTERN ────────────────────────────────────────
  // "15 hundred" → 1500
  const hundredMatch = m.match(/(\d+)\s*hundred/);
  if (hundredMatch) return parseInt(hundredMatch[1]) * 100;

  // ── PLAIN NUMBER ───────────────────────────────────────────
  // Find the LARGEST number in the message (more likely to be price)
  // "give me 2 pieces for 1500" → picks 1500 not 2
  const allNums = m.match(/\d[\d,]*/g);
  if (allNums) {
    const nums = allNums.map(n => parseInt(n.replace(/,/g, "")));
    // Filter out obvious non-prices (single digits, too small)
    const prices = nums.filter(n => n >= 10);
    if (prices.length > 0) return Math.max(...prices);
    return nums[0]; // fallback: first number found
  }

  return null; // no price found
}

// ─── STAGE 3: SENTIMENT ANALYSIS ─────────────────────────────

/**
 * detectSentiment(message)
 *
 * Detects the emotional state / urgency of the customer.
 * Returns one of: "urgent", "firm", "happy", "frustrated", "neutral"
 *
 * Why this matters for Gemini:
 *   - Urgent customer → willing to pay more, close deal faster
 *   - Firm customer   → won't budge much, be more flexible
 *   - Happy customer  → positive, easy to negotiate with
 *   - Frustrated      → been through many rounds, close deal
 */
function detectSentiment(message) {
  const m = message.toLowerCase();

  // ── URGENT ─────────────────────────────────────────────────
  const URGENT_WORDS = [
    "urgent", "urgently", "today", "right now", "now",
    "immediately", "asap", "fast", "quick", "quickly",
    "need it today", "in a hurry",
    // Hindi
    "aaj", "abhi", "abhi chahiye", "jaldi", "jaldi chahiye",
    "turant", "kal tak"
  ];
  if (URGENT_WORDS.some(w => m.includes(w))) return "urgent";

  // ── FIRM / FINAL ───────────────────────────────────────────
  const FIRM_WORDS = [
    "final", "last offer", "maximum", "best i can do",
    "not going higher", "that's my limit", "budget is",
    "can't pay more", "cannot pay more",
    // Hindi
    "aakhri", "bas itna", "isse zyada nahi", "last hai",
    "final offer", "budget mein nahi"
  ];
  if (FIRM_WORDS.some(w => m.includes(w))) return "firm";

  // ── HAPPY / POSITIVE ───────────────────────────────────────
  const HAPPY_WORDS = [
    "love it", "amazing", "great product", "nice", "awesome",
    "looks good", "perfect", "beautiful",
    // Hindi
    "bahut accha", "pasand aaya", "mast hai"
  ];
  if (HAPPY_WORDS.some(w => m.includes(w))) return "happy";

  // ── FRUSTRATED ─────────────────────────────────────────────
  const FRUSTRATED_WORDS = [
    "too high", "too much", "ridiculous", "overpriced",
    "not worth", "expensive", "cheaper elsewhere",
    "amazon pe kam hai", "flipkart pe sasta",
    // Hindi
    "bahut mehnga", "itna kyun", "zyada hai"
  ];
  if (FRUSTRATED_WORDS.some(w => m.includes(w))) return "frustrated";

  return "neutral";
}

/**
 * analyzeMessage(message)
 * Convenience function that runs all 3 NLP stages at once.
 * Returns a single structured object.
 *
 * Example:
 *   Input : "bhai 1500 mein dedo, urgent hai"
 *   Output: { intent: "offer", price: 1500, sentiment: "urgent",
 *             original: "bhai 1500 mein dedo, urgent hai" }
 */
function analyzeMessage(message) {
  return {
    intent:    detectIntent(message),
    price:     extractPrice(message),
    sentiment: detectSentiment(message),
    original:  message,
    timestamp: Date.now()
  };
}
