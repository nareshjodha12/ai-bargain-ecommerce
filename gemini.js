/**
 * gemini.js
 * ─────────────────────────────────────────────
 * PURPOSE  : All Google Gemini API interactions
 * USED BY  : negotiation.js
 * EXPORTS  : callGemini(), buildNegotiationPrompt()
 * ─────────────────────────────────────────────
 *
 * This module is responsible for:
 *   1. Building structured prompts for different situations
 *   2. Calling Gemini 1.5 Flash API
 *   3. Parsing the response (extracting price + message)
 *   4. Enforcing safety constraints on returned price
 *   5. Handling errors with intelligent fallback
 */

// ─── CONFIGURATION ────────────────────────────────────────────

/** Gemini model — flash is fast and free tier friendly */
const GEMINI_MODEL = "gemini-1.5-flash";

/** Base URL for Gemini API */
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";

/**
 * Generation config — controls how Gemini generates text
 *
 * temperature: 0.75
 *   Controls creativity/randomness of responses
 *   0.0 = deterministic (same every time, robotic)
 *   0.75 = natural variation (feels human, different each time)
 *   1.0+ = too random, may break rules
 *
 * maxOutputTokens: 180
 *   Max length of response (~2-3 sentences)
 *   Keeps chat moving, prevents long essays
 *
 * topP: 0.9
 *   Controls word choice diversity
 *   0.9 = wide vocabulary, natural sounding
 */
const GENERATION_CONFIG = {
  temperature:     0.75,
  maxOutputTokens: 180,
  topP:            0.9
};

// ─── PROMPT BUILDERS ─────────────────────────────────────────

/**
 * buildNegotiationPrompt(data)
 *
 * Builds the main negotiation prompt — called every round.
 * This is the most important function. The quality of Gemini's
 * response depends entirely on how well this prompt is written.
 *
 * Key prompt engineering techniques used:
 *   1. Role assignment     → "You are a seller..."
 *   2. Hard constraints    → "NEVER go below Rs. X"
 *   3. Output format       → "Last line: PRICE:XXXX"
 *   4. Dynamic strategy    → Round-based instructions
 *   5. Context injection   → All session data included
 */
function buildNegotiationPrompt(data) {
  // Compute how much room we have between user offer and min price
  const gap = data.minPrice - data.userOffer;
  const gapPercent = Math.round((gap / data.mrp) * 100);

  // How far into the negotiation are we?
  const roundFraction = data.round / data.maxRounds;

  // Strategy hint based on round
  let strategyHint = "";
  if (data.round <= 2) {
    strategyHint = `Round ${data.round} of ${data.maxRounds}: Stay firm, counter close to MRP. Only small discount.`;
  } else if (data.round === 3) {
    strategyHint = `Round 3 of ${data.maxRounds}: Show flexibility now. Give moderate discount. Customer is still interested.`;
  } else if (data.round === 4) {
    strategyHint = `Round 4 of ${data.maxRounds}: Getting serious. Move much closer to minimum. Create urgency.`;
  } else {
    strategyHint = `Round 5 of ${data.maxRounds}: FINAL round. Counter at or very close to minimum price. Make it clear this is your best offer.`;
  }

  // Sentiment-based tone adjustment
  let toneHint = "";
  if (data.sentiment === "urgent") {
    toneHint = "Customer is in a hurry. You can stay firmer on price since urgency is on your side.";
  } else if (data.sentiment === "firm") {
    toneHint = "Customer says this is their budget limit. Acknowledge it but stay persuasive.";
  } else if (data.sentiment === "frustrated") {
    toneHint = "Customer seems frustrated. Be extra warm and accommodating in tone while protecting your margin.";
  } else if (data.sentiment === "happy") {
    toneHint = "Customer seems happy with the product. Use that enthusiasm to justify the price.";
  }

  return `
You are a smart, friendly seller at "AI Bargain Commerce" — an Indian online marketplace.
Your goal is to negotiate the best possible price while keeping the customer happy.

━━━ STRICT RULES — NEVER BREAK THESE ━━━
1. NEVER offer below Rs. ${data.minPrice} — this is your cost+profit floor
2. NEVER reveal Rs. ${data.minPrice} to the customer — it is your secret
3. Reply in exactly 2 short sentences (max 25 words each)
4. Be warm, friendly, and use natural conversational English
5. End your reply with a short question to continue negotiation
6. The very last line of your response must be EXACTLY: PRICE:XXXX
   (replace XXXX with your counter-offer number, no spaces, no Rs symbol)

━━━ PRODUCT & SESSION CONTEXT ━━━
Product name    : ${data.productName}
Brand           : ${data.brand}
MRP (listed)    : Rs. ${data.mrp}
Your floor price: Rs. ${data.minPrice} [TOP SECRET — never mention]
Customer offer  : Rs. ${data.userOffer}
Round           : ${data.round} of ${data.maxRounds}
Offer history   : ${data.offerHistory.length > 0 ? data.offerHistory.map((o,i)=>`R${i+1}:${o}`).join(" → ") : "First offer"}
Customer mood   : ${data.sentiment}
Gap to floor    : Rs. ${gap} (${gapPercent}% of MRP)

━━━ CURRENT STRATEGY ━━━
${strategyHint}
${toneHint ? "Tone: " + toneHint : ""}

━━━ CONCESSION FORMULA ━━━
Calculate your counter-offer using this logic:
  - Start: (MRP + userOffer) / 2
  - Adjust DOWN by round: subtract (gap * roundFraction * 0.8)
  - Never go below: ${data.minPrice}
  - Result must be a round number (multiple of 50 or 100)

━━━ OUTPUT FORMAT (follow exactly) ━━━
[Your friendly 2-sentence negotiation response ending with a question]
PRICE:XXXX

Generate your seller response now:
`.trim();
}

/**
 * buildAcceptPrompt(data)
 * Used when customer's offer is >= min_price.
 * Gemini writes a warm acceptance message.
 */
function buildAcceptPrompt(data) {
  return `
You are an enthusiastic seller at "AI Bargain Commerce".
Great news — the customer just agreed to a deal!

Product  : ${data.productName}
Deal price: Rs. ${data.finalPrice}

Write ONE warm enthusiastic sentence (max 20 words) confirming the deal.
Tell them to fill the form on the right to complete their order.
Do NOT mention any minimum or cost price.
End with a celebration emoji.

Output just the single sentence, nothing else.
`.trim();
}

/**
 * buildProductQuestionPrompt(data)
 * Used when customer asks about product features/specs.
 */
function buildProductQuestionPrompt(data) {
  return `
You are a helpful product expert at "AI Bargain Commerce".

Customer asked: "${data.question}"
Product: ${data.productName} by ${data.brand}
Description: ${data.desc}
MRP: Rs. ${data.mrp}

Answer the customer's question in 2 sentences using the description.
Then invite them to make a price offer to get a great deal.
Be friendly and enthusiastic about the product.
`.trim();
}

/**
 * buildFinalRoundPrompt(data)
 * Used when max rounds reached and customer still hasn't accepted.
 */
function buildFinalRoundPrompt(data) {
  return `
You are a seller at "AI Bargain Commerce". Negotiations have reached the final stage.

Product: ${data.productName}
Your absolute final price: Rs. ${data.finalOffer}

Write a polite 2-sentence message saying Rs. ${data.finalOffer} is your absolute best price
and you genuinely cannot go lower. Wish them well if they decide to pass.
Keep it warm, not aggressive.
`.trim();
}

// ─── MAIN API CALL FUNCTION ───────────────────────────────────

/**
 * callGemini(promptType, data, apiKey)
 *
 * The single entry point for all Gemini API calls.
 * Builds the appropriate prompt, calls API, parses response.
 *
 * Parameters:
 *   promptType: "negotiate" | "accept" | "question" | "final"
 *   data: object with all session context
 *   apiKey: Gemini API key string
 *
 * Returns:
 *   { message: string, counterPrice: number|null, success: boolean }
 */
async function callGemini(promptType, data, apiKey) {
  if (!apiKey) {
    return { message: "API key not set.", counterPrice: null, success: false };
  }

  // ── BUILD PROMPT ───────────────────────────────────────────
  let prompt = "";
  switch (promptType) {
    case "negotiate": prompt = buildNegotiationPrompt(data); break;
    case "accept":    prompt = buildAcceptPrompt(data);      break;
    case "question":  prompt = buildProductQuestionPrompt(data); break;
    case "final":     prompt = buildFinalRoundPrompt(data);  break;
    default:          prompt = buildNegotiationPrompt(data);
  }

  // ── API REQUEST ────────────────────────────────────────────
  const url = `${GEMINI_BASE_URL}${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: GENERATION_CONFIG
      })
    });

    // ── HANDLE HTTP ERRORS ─────────────────────────────────
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;
      console.error("[Gemini] API Error:", errMsg);
      throw new Error(errMsg);
    }

    // ── PARSE RESPONSE ─────────────────────────────────────
    const resData = await response.json();
    const fullText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!fullText) {
      throw new Error("Gemini returned empty response");
    }

    console.log("[Gemini] Raw response:", fullText);

    // ── EXTRACT PRICE ──────────────────────────────────────
    // Gemini appends "PRICE:XXXX" on the last line
    const priceMatch = fullText.match(/PRICE:(\d+)/i);
    let counterPrice = priceMatch ? parseInt(priceMatch[1]) : null;

    // ── EXTRACT MESSAGE ────────────────────────────────────
    // Remove the PRICE:XXXX line from what customer sees
    const message = fullText
      .replace(/PRICE:\d+/gi, "")
      .replace(/━+[^\n]*/g, "")  // remove separator lines if any
      .replace(/\n{2,}/g, "\n")
      .trim();

    // ── SAFETY CLAMP ───────────────────────────────────────
    // THE MOST IMPORTANT CHECK:
    // Even if Gemini makes a mistake, we ALWAYS enforce the floor
    if (counterPrice !== null && data.minPrice) {
      // Never below min price (seller protection)
      counterPrice = Math.max(counterPrice, data.minPrice);
      // Never above MRP (makes no sense to counter higher)
      counterPrice = Math.min(counterPrice, data.mrp);
      // Round to nearest 50 for cleaner numbers
      counterPrice = Math.round(counterPrice / 50) * 50;
      // One final check after rounding
      counterPrice = Math.max(counterPrice, data.minPrice);
    }

    return { message, counterPrice, success: true };

  } catch (error) {
    console.error("[Gemini] Error:", error.message);
    return {
      message:      _getFallbackMessage(data, promptType),
      counterPrice: _getFallbackPrice(data),
      success:      false,
      error:        error.message
    };
  }
}

// ─── FALLBACK HELPERS ─────────────────────────────────────────

/**
 * _getFallbackPrice(data)
 * When Gemini API fails, calculate a safe midpoint price.
 * Based on round number — moves toward min_price over rounds.
 */
function _getFallbackPrice(data) {
  if (!data.minPrice || !data.mrp) return null;
  const round = data.round || 1;
  const maxR  = data.maxRounds || 5;
  // Start at 80% point, move toward min as rounds progress
  const fraction = 0.8 - (round / maxR) * 0.6;
  const raw = data.minPrice + (data.mrp - data.minPrice) * fraction;
  return Math.max(Math.round(raw / 50) * 50, data.minPrice);
}

/**
 * _getFallbackMessage(data, type)
 * Human-readable fallback messages when API is unavailable.
 */
function _getFallbackMessage(data, type) {
  const price = _getFallbackPrice(data);
  const fallbacks = {
    negotiate: [
      `This is a premium product — Rs. ${price?.toLocaleString()} would be a fair price. Shall we close the deal?`,
      `I've checked and Rs. ${price?.toLocaleString()} is the best I can offer today. What do you think?`,
      `Given the quality, Rs. ${price?.toLocaleString()} is genuinely my best offer. Does that work for you?`
    ],
    accept: [
      "Wonderful! You've got yourself a great deal! Please fill in the order details to complete your purchase. 🎉",
      "Fantastic — deal confirmed! Please complete the order form on the right. 🛒"
    ],
    question: [
      `This is a top-rated product from ${data.brand || "a trusted brand"}. Would you like to make an offer?`
    ],
    final: [
      `I truly cannot go any lower — this is my absolute best price. I hope you'll consider it!`
    ]
  };
  const arr = fallbacks[type] || fallbacks.negotiate;
  return arr[Math.floor(Math.random() * arr.length)];
}
