/**
 * products.js
 * ─────────────────────────────────────────────
 * PURPOSE  : Product data store for the application
 * SOURCE   : Inspired by Kaggle Amazon India + Flipkart datasets
 *            (amazon_products.csv, flipkart_com-ecommerce_sample.csv)
 * USED BY  : index.html, admin.html
 * ─────────────────────────────────────────────
 *
 * In a production system this data lives in Firebase.
 * For demo/local use, it is kept here as a JS constant.
 * Admin panel can add/edit/delete products — changes go to Firebase.
 * If Firebase not configured, this local data is used.
 */

const PRODUCT_CATALOG = [
  // ════════════════════════════════════════
  // ELECTRONICS — Headphones & Audio
  // ════════════════════════════════════════
  {
    id:"p001", name:"boAt Rockerz 450 Bluetooth Headphone",
    brand:"boAt", category:"Electronics", subcategory:"Headphones",
    icon:"🎧", mrp:1799, min_price:1100, stock:45,
    rating:4.2, reviews:15420,
    desc:"40mm dynamic drivers, 15hr battery, foldable design, built-in mic. Compatible with all Bluetooth 5.0 devices. Padded ear cushions for comfort."
  },
  {
    id:"p004", name:"Realme Buds Air 5 TWS Earbuds",
    brand:"Realme", category:"Electronics", subcategory:"Earbuds",
    icon:"🎵", mrp:2799, min_price:1800, stock:60,
    rating:4.3, reviews:12300,
    desc:"50dB ANC, 10mm dynamic driver, 38hr total battery, low latency gaming mode 88ms, Hi-Res audio certified, IPX5 water resistant."
  },
  {
    id:"p025", name:"boAt Airdopes 161 TWS Earbuds",
    brand:"boAt", category:"Electronics", subcategory:"Earbuds",
    icon:"🎶", mrp:999, min_price:600, stock:110,
    rating:4.0, reviews:34200,
    desc:"13mm drivers, 40hr total playtime, IPX4 water resistant, instant voice assistant access, low latency mode, lightweight design."
  },
  {
    id:"p006", name:"JBL Flip 6 Bluetooth Speaker",
    brand:"JBL", category:"Electronics", subcategory:"Speakers",
    icon:"🔊", mrp:8999, min_price:6200, stock:18,
    rating:4.6, reviews:4560,
    desc:"IP67 waterproof and dustproof, 12hr battery, PartyBoost link multiple speakers, powerful bass radiators, USB-C charging, bold color options."
  },
  // ════════════════════════════════════════
  // ELECTRONICS — Wearables
  // ════════════════════════════════════════
  {
    id:"p003", name:"Noise ColorFit Ultra Smart Watch",
    brand:"Noise", category:"Electronics", subcategory:"Wearables",
    icon:"⌚", mrp:3999, min_price:2600, stock:22,
    rating:4.1, reviews:6721,
    desc:"1.96-inch AMOLED display, 100+ sports modes, SpO2 and heart rate monitor, 7-day battery, IP68 water resistant, sleep tracking, stress monitor."
  },
  {
    id:"p028", name:"Casio G-Shock Digital Watch",
    brand:"Casio", category:"Electronics", subcategory:"Wearables",
    icon:"🕰️", mrp:4995, min_price:3500, stock:25,
    rating:4.6, reviews:8900,
    desc:"200m water resistant, shock resistant construction, world time 48 cities, stopwatch precision, countdown timer, auto LED backlight, 10yr battery."
  },
  // ════════════════════════════════════════
  // ELECTRONICS — Phones & Laptops
  // ════════════════════════════════════════
  {
    id:"p002", name:"Redmi Note 13 5G Smartphone",
    brand:"Xiaomi", category:"Electronics", subcategory:"Mobiles",
    icon:"📱", mrp:17999, min_price:13500, stock:30,
    rating:4.4, reviews:8930,
    desc:"6.67-inch AMOLED 120Hz display, Snapdragon 685, 108MP triple camera, 5000mAh battery, 33W fast charging, Gorilla Glass 3 protection."
  },
  {
    id:"p007", name:"HP 15s Intel Core i5 Laptop",
    brand:"HP", category:"Electronics", subcategory:"Laptops",
    icon:"💻", mrp:52999, min_price:42000, stock:8,
    rating:4.3, reviews:3210,
    desc:"Intel Core i5-1235U 12th Gen, 8GB RAM DDR4, 512GB NVMe SSD, 15.6-inch FHD IPS anti-glare, Windows 11 Home, backlit keyboard, 9hr battery."
  },
  // ════════════════════════════════════════
  // ELECTRONICS — Cameras & Chargers
  // ════════════════════════════════════════
  {
    id:"p008", name:"Canon EOS 200D II DSLR Camera",
    brand:"Canon", category:"Electronics", subcategory:"Cameras",
    icon:"📷", mrp:44990, min_price:36000, stock:5,
    rating:4.7, reviews:2100,
    desc:"24.1MP APS-C CMOS sensor, DIGIC 8 image processor, 4K video, Dual Pixel CMOS AF, vari-angle touchscreen, Wi-Fi + Bluetooth, Includes 18-55mm kit lens."
  },
  {
    id:"p005", name:"Anker 65W GaN USB-C Charger",
    brand:"Anker", category:"Electronics", subcategory:"Chargers",
    icon:"🔌", mrp:1299, min_price:850, stock:80,
    rating:4.5, reviews:9812,
    desc:"GaN technology, 65W fast charge, foldable flat plug, charges laptop and phone simultaneously, wide device compatibility, ActiveShield safety."
  },
  // ════════════════════════════════════════
  // FASHION
  // ════════════════════════════════════════
  {
    id:"p009", name:"Levis 511 Slim Fit Jeans",
    brand:"Levis", category:"Fashion", subcategory:"Jeans",
    icon:"👖", mrp:2999, min_price:1900, stock:120,
    rating:4.4, reviews:23400,
    desc:"Slim fit through seat, thigh and leg. 4-way stretch denim for comfort and mobility. Classic 5-pocket styling. Available in multiple washes. Machine washable."
  },
  {
    id:"p010", name:"Nike Air Max 270 Sneakers",
    brand:"Nike", category:"Fashion", subcategory:"Footwear",
    icon:"👟", mrp:12995, min_price:9000, stock:35,
    rating:4.5, reviews:7800,
    desc:"Largest heel Air unit for ultimate cushioning, engineered mesh upper for breathability, foam midsole, durable rubber outsole, iconic silhouette."
  },
  {
    id:"p027", name:"Woodland Camel Leather Boots",
    brand:"Woodland", category:"Fashion", subcategory:"Footwear",
    icon:"🥾", mrp:5995, min_price:4200, stock:30,
    rating:4.5, reviews:12400,
    desc:"Full grain genuine leather upper, heavy-duty rubber lug sole, padded ankle collar for comfort, waterproof treatment, reinforced toe cap."
  },
  {
    id:"p011", name:"Allen Solly Formal Shirt",
    brand:"Allen Solly", category:"Fashion", subcategory:"Shirts",
    icon:"👔", mrp:1299, min_price:780, stock:200,
    rating:4.2, reviews:18900,
    desc:"100% premium cotton, wrinkle-free finish, slim fit cut, full sleeves, available sizes S to XXL, machine washable, spread collar."
  },
  {
    id:"p012", name:"Lavie Tote Handbag Women",
    brand:"Lavie", category:"Fashion", subcategory:"Bags",
    icon:"👜", mrp:2199, min_price:1400, stock:65,
    rating:4.3, reviews:9320,
    desc:"Premium faux leather, spacious main compartment, 2 internal zip pockets, magnetic snap closure, detachable shoulder strap, multiple colour options."
  },
  // ════════════════════════════════════════
  // HOME & KITCHEN
  // ════════════════════════════════════════
  {
    id:"p013", name:"Philips HL7756 750W Mixer Grinder",
    brand:"Philips", category:"Home", subcategory:"Kitchen",
    icon:"🥤", mrp:3495, min_price:2400, stock:40,
    rating:4.4, reviews:11200,
    desc:"750W copper motor, 3 stainless steel jars (1.5L + 1L + 0.3L), 3-speed control with pulse, overload protection, suction cups base, 2yr warranty."
  },
  {
    id:"p014", name:"Milton Thermosteel Flip Lid Flask",
    brand:"Milton", category:"Home", subcategory:"Bottles",
    icon:"🫖", mrp:699, min_price:430, stock:150,
    rating:4.5, reviews:34500,
    desc:"Keeps hot 24hr and cold 48hr. 304 food grade stainless steel inside and outside. Leak-proof flip lid. 1000ml capacity. BPA free. Easy clean."
  },
  {
    id:"p015", name:"Prestige Svachh 5L Pressure Cooker",
    brand:"Prestige", category:"Home", subcategory:"Cookware",
    icon:"🍲", mrp:1895, min_price:1300, stock:55,
    rating:4.6, reviews:28900,
    desc:"5-litre aluminium body, metallic safety plug, weight valve for steam regulation, cool touch handles, induction base compatible, ISI certified."
  },
  {
    id:"p026", name:"Samsung 23L Solo Microwave Oven",
    brand:"Samsung", category:"Home", subcategory:"Appliances",
    icon:"📺", mrp:7490, min_price:5500, stock:20,
    rating:4.3, reviews:6700,
    desc:"23L capacity, 800W power, 69 auto cook menus, defrost by weight and time, child safety lock, one-touch buttons, ceramic enamel interior."
  },
  {
    id:"p016", name:"Bajaj Majesty 1000W Room Heater",
    brand:"Bajaj", category:"Home", subcategory:"Appliances",
    icon:"🌡️", mrp:1800, min_price:1200, stock:28,
    rating:4.1, reviews:7600,
    desc:"1000W quartz heating element, 2 heat settings, overheat auto-cutoff protection, cool touch body exterior, compact and portable, ISI marked."
  },
  // ════════════════════════════════════════
  // BOOKS & STATIONERY
  // ════════════════════════════════════════
  {
    id:"p017", name:"Atomic Habits by James Clear",
    brand:"Penguin", category:"Books", subcategory:"Self-Help",
    icon:"📚", mrp:499, min_price:320, stock:200,
    rating:4.8, reviews:45000,
    desc:"International bestseller on habit formation. Paperback, 320 pages, English. Proven 4-step framework. Over 10 million copies sold worldwide."
  },
  {
    id:"p018", name:"Parker IM Fountain Pen",
    brand:"Parker", category:"Stationery", subcategory:"Pens",
    icon:"🖊️", mrp:1395, min_price:900, stock:75,
    rating:4.6, reviews:5600,
    desc:"Stainless steel fine nib, gold-plated trims, ink converter included, standard cartridge system, premium gift box packaging, smooth writing experience."
  },
  // ════════════════════════════════════════
  // BEAUTY & PERSONAL CARE
  // ════════════════════════════════════════
  {
    id:"p019", name:"Mamaearth Onion Hair Oil 250ml",
    brand:"Mamaearth", category:"Beauty", subcategory:"Hair Care",
    icon:"🧴", mrp:349, min_price:220, stock:300,
    rating:4.3, reviews:67000,
    desc:"Reduces hair fall up to 96%, with pure onion oil and redensyl, toxin-free formula, dermatologist tested, suitable for all hair types, no mineral oil."
  },
  {
    id:"p020", name:"Gillette Mach3 Razor Combo",
    brand:"Gillette", category:"Beauty", subcategory:"Grooming",
    icon:"🪒", mrp:599, min_price:380, stock:180,
    rating:4.5, reviews:22300,
    desc:"3-blade razor system with 2 cartridges, lubrastrip with aloe for smooth glide, ergonomic anti-slip handle, suitable for sensitive skin."
  },
  // ════════════════════════════════════════
  // SPORTS & FITNESS
  // ════════════════════════════════════════
  {
    id:"p021", name:"Boldfit Resistance Bands Set of 5",
    brand:"Boldfit", category:"Sports", subcategory:"Fitness",
    icon:"🏋️", mrp:699, min_price:420, stock:95,
    rating:4.4, reviews:13400,
    desc:"5 resistance levels (2-45 lbs), latex free material, anti-snap tested, includes door anchor, ankle straps, handles and carry bag. Full body workout."
  },
  {
    id:"p022", name:"Decathlon Kiprun Running Shoes",
    brand:"Decathlon", category:"Sports", subcategory:"Footwear",
    icon:"🏃", mrp:2499, min_price:1700, stock:42,
    rating:4.3, reviews:8900,
    desc:"Cushioned EVA midsole for long distance comfort, breathable mesh upper, reinforced heel counter, flex grooves for natural foot movement, sizes 6-12."
  },
  // ════════════════════════════════════════
  // TOYS & GAMING
  // ════════════════════════════════════════
  {
    id:"p023", name:"LEGO Classic Creative Bricks 484pcs",
    brand:"LEGO", category:"Toys", subcategory:"Building",
    icon:"🧱", mrp:1499, min_price:1000, stock:60,
    rating:4.7, reviews:9800,
    desc:"484 pieces in 33 classic colours, suitable for age 4+, builds unlimited models, develops creativity, problem-solving and fine motor skills."
  },
  {
    id:"p024", name:"Sony DualSense PS5 Controller",
    brand:"Sony", category:"Gaming", subcategory:"Controllers",
    icon:"🎮", mrp:6990, min_price:5200, stock:15,
    rating:4.8, reviews:4320,
    desc:"Haptic feedback technology, adaptive triggers, built-in mic and speaker, USB-C charging, 12hr battery, motion sensor, compatible with PS5 and PC."
  }
];

/** All unique categories extracted from catalog */
const CATEGORIES = ["All", ...new Set(PRODUCT_CATALOG.map(p => p.category))];

/**
 * getProductById(id)
 * Returns product object or null.
 */
function getProductById(id) {
  return PRODUCT_CATALOG.find(p => p.id === id) || null;
}

/**
 * getProductsByCategory(cat)
 * Returns filtered array. "All" returns everything.
 */
function getProductsByCategory(cat) {
  if (!cat || cat === "All") return PRODUCT_CATALOG;
  return PRODUCT_CATALOG.filter(p => p.category === cat);
}

/**
 * searchProducts(query)
 * Simple text search across name, brand, category.
 */
function searchProducts(query) {
  if (!query) return PRODUCT_CATALOG;
  const q = query.toLowerCase();
  return PRODUCT_CATALOG.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.subcategory.toLowerCase().includes(q)
  );
}

/**
 * seedProductsToFirebase()
 * On first load, push all products to Firebase if not already there.
 * This only runs once — checks if products already seeded.
 */
async function seedProductsToFirebase() {
  const existing = await dbGet("products/p001");
  if (existing) {
    console.log("[Products] Already seeded in Firebase");
    return;
  }
  console.log("[Products] Seeding to Firebase...");
  for (const p of PRODUCT_CATALOG) {
    await dbSet(`products/${p.id}`, p);
  }
  console.log(`[Products] Seeded ${PRODUCT_CATALOG.length} products`);
}
