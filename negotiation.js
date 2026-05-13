/**
 * negotiation.js
 * ─────────────────────────────────────────────
 * PURPOSE  : Core negotiation engine — orchestrates everything
 * USED BY  : index.html (main customer chat)
 * DEPENDS  : firebase-config.js, nlp.js, gemini.js
 * ─────────────────────────────────────────────
 *
 * This is the BRAIN of the backend. It does not do any one
 * thing — it coordinates all modules in the right order:
 *
 *   Customer message
 *       ↓
 *   NLP (intent + price + sentiment)
 *       ↓
 *   Firebase (fetch product + session history)
 *       ↓
 *   Business Rules (deal? max rounds? valid price?)
 *       ↓
 *   Gemini AI (generate counter-offer)
 *       ↓
 *   Firebase (save offer + update session)
 *       ↓
 *   Return result to UI
 */

const MAX_ROUNDS = 5; // Number of negotiation rounds before ending

// ─── SESSION MANAGEMENT ───────────────────────────────────────

/**
 * getSession(userId, productId)
 * Retrieves the current negotiation session from Firebase.
 * If no session exists, returns a fresh default session.
 */
async function getSession(userId, productId) {
  const key  = `${userId}_${productId}`;
  const data = await dbGet(`negotiations/${key}`);
  return data || {
    userId,
    productId,
    round:           0,
    offerHistory:    [],
    lastUserOffer:   null,
    lastSystemOffer: null,
    initialOffer:    null,
    status:          "negotiating",
    startedAt:       Date.now()
  };
}

/**
 * saveSession(session)
 * Saves updated session back to Firebase.
 */
async function saveSession(session) {
  const key = `${session.userId}_${session.productId}`;
  await dbSet(`negotiations/${key}`, {
    ...session,
    updatedAt: Date.now()
  });
}

/**
 * saveOffer(offerId, offerData)
 * Saves individual offer record to offers collection.
 * Each round creates a new record — for analytics.
 */
async function saveOffer(offerData) {
  return await dbPush("offers/", {
    ...offerData,
    timestamp: Date.now()
  });
}

/**
 * saveOrder(orderData)
 * Called when deal is confirmed.
 * Creates permanent order record.
 */
async function saveOrder(orderData) {
  return await dbPush("orders/", {
    ...orderData,
    placedAt: Date.now(),
    paymentStatus: "pending"
  });
}

/**
 * saveLog(event, details)
 * Logs system events for admin dashboard analytics.
 */
async function saveLog(event, details) {
  return await dbPush("logs/", {
    event,
    details,
    timestamp: Date.now()
  });
}

// ─── MAIN HANDLER ─────────────────────────────────────────────

/**
 * processMessage(userId, productId, message, apiKey)
 *
 * THE MAIN FUNCTION — called every time customer sends a message.
 *
 * Returns a result object:
 * {
 *   message:      string  — text to display in chatbot
 *   counterPrice: number  — AI counter-offer price (if applicable)
 *   status:       string  — "negotiating" | "accepted" | "rejected" | "ended"
 *   finalPrice:   number  — confirmed deal price (if accepted)
 *   round:        number  — current round number
 *   intent:       string  — what NLP detected
 * }
 */
async function processMessage(userId, productId, message, apiKey) {

  // ─────────────────────────────────────────────────────────
  // STEP 1: NLP — Understand what customer said
  // ─────────────────────────────────────────────────────────
  const nlp = analyzeMessage(message);
  console.log("[NLP]", nlp);

  // ─────────────────────────────────────────────────────────
  // STEP 2: Firebase — Get product data
  // ─────────────────────────────────────────────────────────
  const product = await dbGet(`products/${productId}`);
  if (!product) {
    return {
      message: "Sorry, I couldn't find this product. Please try again.",
      status: "error",
      intent: nlp.intent
    };
  }

  // ─────────────────────────────────────────────────────────
  // STEP 3: Firebase — Get or create session
  // ─────────────────────────────────────────────────────────
  const session = await getSession(userId, productId);

  // ─────────────────────────────────────────────────────────
  // STEP 4: Handle NON-OFFER intents first (fast path)
  // ─────────────────────────────────────────────────────────

  // ── REJECT ──────────────────────────────────────────────
  if (nlp.intent === "reject") {
    session.status = "rejected";
    await saveSession(session);
    await saveLog("negotiation_rejected", `User ${userId} rejected ${productId}`);
    return {
      message: "No problem at all! 😊 Hope to see you again — the product will be here whenever you're ready.",
      status:  "rejected",
      intent:  nlp.intent,
      round:   session.round
    };
  }

  // ── QUESTION about product ──────────────────────────────
  if (nlp.intent === "question") {
    const result = await callGemini("question", {
      question:    message,
      productName: product.name,
      brand:       product.brand,
      desc:        product.desc,
      mrp:         product.mrp
    }, apiKey);
    return {
      message: result.message,
      status:  "negotiating",
      intent:  nlp.intent,
      round:   session.round
    };
  }

  // ── ACCEPT current counter-offer ────────────────────────
  if (nlp.intent === "accept" && session.lastSystemOffer) {
    return await _handleDeal(
      userId, productId, session.lastSystemOffer,
      product, session, apiKey
    );
  }

  // ── GENERAL CHAT (no price, no clear intent) ────────────
  if (nlp.intent === "chat" || (!nlp.price && nlp.intent !== "offer")) {
    return {
      message: "I'd love to help! 😊 What price do you have in mind for the " +
               product.name + "? Go ahead and make me an offer!",
      status:  "negotiating",
      intent:  nlp.intent,
      round:   session.round
    };
  }

  // ─────────────────────────────────────────────────────────
  // STEP 5: This is a PRICE OFFER — main negotiation path
  // ─────────────────────────────────────────────────────────
  const userPrice = nlp.price;

  if (!userPrice || userPrice < 1) {
    return {
      message: "Could you please mention a specific price? For example, 'I'll take it for ₹1500'.",
      status:  "negotiating",
      intent:  nlp.intent,
      round:   session.round
    };
  }

  // ─────────────────────────────────────────────────────────
  // STEP 6: Business Rule — Is offer already acceptable?
  // This is checked BEFORE calling Gemini to save API calls
  // ─────────────────────────────────────────────────────────
  if (userPrice >= product.min_price) {
    return await _handleDeal(
      userId, productId, userPrice,
      product, session, apiKey
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP 7: Business Rule — Have we reached max rounds?
  // ─────────────────────────────────────────────────────────
  if (session.round >= MAX_ROUNDS) {
    const finalOffer = product.min_price;
    session.status = "ended";
    await saveSession(session);
    await saveLog("negotiation_ended_maxrounds",
      `User ${userId}, product ${productId}, rounds: ${session.round}`);

    const result = await callGemini("final", {
      productName: product.name,
      finalOffer
    }, apiKey);

    return {
      message:      result.message,
      counterPrice: finalOffer,
      status:       "ended",
      intent:       nlp.intent,
      round:        session.round
    };
  }

  // ─────────────────────────────────────────────────────────
  // STEP 8: Call Gemini for intelligent counter-offer
  // ─────────────────────────────────────────────────────────
  const newRound = session.round + 1;

  const geminiResult = await callGemini("negotiate", {
    productName:  product.name,
    brand:        product.brand,
    mrp:          product.mrp,
    minPrice:     product.min_price,
    userOffer:    userPrice,
    round:        newRound,
    maxRounds:    MAX_ROUNDS,
    offerHistory: session.offerHistory || [],
    sentiment:    nlp.sentiment
  }, apiKey);

  // ─────────────────────────────────────────────────────────
  // STEP 9: Update session and save to Firebase
  // ─────────────────────────────────────────────────────────
  session.round           = newRound;
  session.lastUserOffer   = userPrice;
  session.lastSystemOffer = geminiResult.counterPrice;
  session.offerHistory    = [...(session.offerHistory || []), userPrice];
  if (!session.initialOffer) session.initialOffer = userPrice;
  session.status = "negotiating";

  await saveSession(session);

  // Save offer record for admin analytics
  await saveOffer({
    sessionKey:  `${userId}_${productId}`,
    userId,
    productId,
    productName: product.name,
    userOffer:   userPrice,
    systemOffer: geminiResult.counterPrice,
    round:       newRound,
    sentiment:   nlp.sentiment
  });

  await saveLog("counter_offer", {
    userId, productId,
    round: newRound,
    userOffer: userPrice,
    systemOffer: geminiResult.counterPrice
  });

  // ─────────────────────────────────────────────────────────
  // STEP 10: Return result to UI
  // ─────────────────────────────────────────────────────────
  return {
    message:      geminiResult.message,
    counterPrice: geminiResult.counterPrice,
    status:       "negotiating",
    intent:       nlp.intent,
    round:        newRound,
    geminiSuccess: geminiResult.success
  };
}

// ─── DEAL CONFIRMATION ────────────────────────────────────────

/**
 * _handleDeal(userId, productId, price, product, session, apiKey)
 * Private helper called when a deal is confirmed.
 * Updates session, creates order, calls Gemini for accept message.
 */
async function _handleDeal(userId, productId, finalPrice, product, session, apiKey) {
  session.status     = "accepted";
  session.finalPrice = finalPrice;
  await saveSession(session);

  await saveOrder({
    userId,
    productId,
    productName: product.name,
    mrp:         product.mrp,
    finalPrice,
    savings:     product.mrp - finalPrice,
    savingsPct:  Math.round(((product.mrp - finalPrice) / product.mrp) * 100)
  });

  await saveLog("deal_confirmed", {
    userId, productId,
    finalPrice,
    rounds: session.round,
    savings: product.mrp - finalPrice
  });

  const result = await callGemini("accept", {
    productName: product.name,
    finalPrice
  }, apiKey);

  return {
    message:    result.message,
    finalPrice,
    status:     "accepted",
    intent:     "accept",
    round:      session.round,
    savings:    product.mrp - finalPrice,
    savingsPct: Math.round(((product.mrp - finalPrice) / product.mrp) * 100)
  };
}

/**
 * placeOrderDB(userId, productId, orderDetails)
 * Called when customer fills the checkout form.
 * Updates the order record with final details.
 */
async function placeOrderDB(userId, productId, orderDetails) {
  const session = await getSession(userId, productId);
  const key = `${userId}_${productId}`;

  await dbUpdate(`negotiations/${key}`, {
    status: "completed",
    orderDetails,
    completedAt: Date.now()
  });

  await saveLog("order_placed", {
    userId, productId,
    finalPrice: session.finalPrice,
    ...orderDetails
  });

  return true;
}
