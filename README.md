# ai-bargain-ecommerce
# Description
Think about how shopping works online today. You go to Amazon or Flipkart, see a product, and the price is fixed. You either buy it or you don't. There is no bargaining.
But in real life — at a local market or a small shop — you can say "bhaiya 1500 mein dedo" and the shopkeeper says "nahi 1800 lo" and you both reach a middle ground. This project brings that bargaining experience to online shopping using Artificial Intelligence.
The system uses an AI-powered chatbot that automatically negotiates prices with customers — just like a smart human shopkeeper would.

# The Five Modules — What Each One Does
Module 1 — Chatbot Interface
This is what the customer sees and interacts with. It is built using HTML, CSS, and JavaScript. It has a chat input box, a message display area, and a side panel showing the current negotiation status — MRP, customer's last offer, seller's counter, and the deal status.
Module 2 — NLP Processing Unit
This module reads the customer's raw typed message and converts it into structured data. It identifies the intent (is the customer offering a price, asking a question, or accepting a deal?) and extracts entities (what product, what price, what quantity). Without NLP, the system cannot understand what the customer is saying.
Module 3 — Negotiation Engine
This is the brain of the backend. It receives structured data from NLP, fetches product data from Firebase, checks whether a deal is possible, decides how many rounds have passed, and either calls Gemini for a counter-offer or confirms the deal. All business rules live here.
Module 4 — Gemini AI / Offer Generator
This is where intelligence enters the system. The negotiation engine sends Gemini a detailed prompt with all the context. Gemini returns a natural language message and a counter-offer price. The tone, strategy, and language vary naturally across rounds making the conversation feel human.
Module 5 — Firebase Realtime Database
This stores everything — user profiles, product data, negotiation sessions, offers history, confirmed orders, and system logs. Its real-time capability means the moment Gemini's response is saved, the customer's chatbot screen updates instantly without any page reload.
