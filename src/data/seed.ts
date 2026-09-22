/* ------------------------------------------------------------------ */
/*  Locora — seed dataset                                             */
/*  A believable slice of a Pune hyperlocal marketplace. All story    */
/*  lines are consistent (chat negotiations match listing prices,     */
/*  request matches match provider ratings, etc).                     */
/* ------------------------------------------------------------------ */

import type {
  AppNotification,
  AppState,
  BuyRequest,
  Conversation,
  Product,
  Report,
  Review,
  Service,
  User,
} from "@/lib/types";

const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const monthsAgo = (m: number) => hoursAgo(m * 24 * 30);

export const SEED_VERSION = 3;

/* ----------------------------- users ----------------------------- */

export const SEED_USERS: User[] = [
  { id: "u1", name: "Aarav Kulkarni", role: "buyer", area: "viman", email: "aarav@demo.locora", phone: "+91 98220 11223", joinedAt: monthsAgo(30), avatarFrom: "#0390E0", avatarTo: "#014093", verified: true, rating: 4.8, reviewsCount: 12, responseMins: 12, bio: "Product designer in Viman Nagar. Occasionally selling gadgets when I upgrade." },
  { id: "u2", name: "Sneha Patil", role: "seller", area: "kothrud", email: "sneha@demo.locora", phone: "+91 98230 45501", joinedAt: monthsAgo(34), avatarFrom: "#6366F1", avatarTo: "#4338CA", verified: true, rating: 4.9, reviewsCount: 31, responseMins: 8, bio: "Selling pre-loved gadgets and furniture. Everything tested before listing." },
  { id: "u3", name: "Rohan Sharma", role: "provider", area: "kp", email: "rohan@demo.locora", phone: "+91 98221 78345", joinedAt: monthsAgo(52), avatarFrom: "#F59E0B", avatarTo: "#D97706", verified: true, rating: 4.9, reviewsCount: 86, responseMins: 6, bio: "Licensed plumber, 12 years in the trade. Koregaon Park & nearby." },
  { id: "u4", name: "Imran Shaikh", role: "provider", area: "kothrud", email: "imran@demo.locora", phone: "+91 90210 33218", joinedAt: monthsAgo(47), avatarFrom: "#06B6D4", avatarTo: "#0E7490", verified: true, rating: 4.8, reviewsCount: 54, responseMins: 11, bio: "Electrician — wiring, switchboards, inverters. 6-month workmanship warranty." },
  { id: "u5", name: "Priya Desai", role: "provider", area: "baner", email: "priya@demo.locora", phone: "+91 97650 22190", joinedAt: monthsAgo(40), avatarFrom: "#EC4899", avatarTo: "#BE185D", rating: 5.0, reviewsCount: 23, responseMins: 14, bio: "Maths & Science tutor (Class 6–10, CBSE/ICSE). M.Sc. Mathematics, Pune University." },
  { id: "u6", name: "Kabir Mehta", role: "provider", area: "erandwane", email: "kabir@demo.locora", phone: "+91 98220 90117", joinedAt: monthsAgo(63), avatarFrom: "#8B5CF6", avatarTo: "#6D28D9", verified: true, rating: 4.9, reviewsCount: 41, responseMins: 18, bio: "Candid wedding & event photographer. 400+ events covered across Pune." },
  { id: "u7", name: "Vikram Joshi", role: "seller", area: "hinjewadi", email: "vikram@demo.locora", phone: "+91 90110 23376", joinedAt: monthsAgo(24), avatarFrom: "#EF4444", avatarTo: "#B91C1C", rating: 4.6, reviewsCount: 9, responseMins: 26 },
  { id: "u8", name: "Meera Nair", role: "provider", area: "hadapsar", email: "meera@demo.locora", phone: "+91 91580 67112", joinedAt: monthsAgo(44), avatarFrom: "#14B8A6", avatarTo: "#0F766E", rating: 4.7, reviewsCount: 63, responseMins: 26, bio: "Home deep-cleaning specialist. 4-member trained team, own supplies." },
  { id: "u9", name: "Suresh Pawar", role: "provider", area: "hinjewadi", email: "suresh@demo.locora", phone: "+91 98600 34512", joinedAt: monthsAgo(78), avatarFrom: "#F97316", avatarTo: "#C2410C", verified: true, rating: 4.8, reviewsCount: 77, responseMins: 21, bio: "Mechanic — bikes & cars. Honest diagnosis, no unnecessary part replacement." },
  { id: "u10", name: "Ananya Iyer", role: "provider", area: "aundh", email: "ananya@demo.locora", phone: "+91 98225 10093", joinedAt: monthsAgo(56), avatarFrom: "#0EA5E9", avatarTo: "#0369A1", rating: 4.9, reviewsCount: 18, responseMins: 42, bio: "Interior designer specialising in 1&2BHK makeovers on real budgets." },
  { id: "u11", name: "Deepak Yadav", role: "provider", area: "wakad", email: "deepak@demo.locora", phone: "+91 90280 45678", joinedAt: monthsAgo(62), avatarFrom: "#0390E0", avatarTo: "#014093", verified: true, rating: 4.7, reviewsCount: 39, responseMins: 13, bio: "AC & appliance technician. Jet service, gas refill, install/uninstall." },
  { id: "u12", name: "Farhan Khan", role: "provider", area: "swargate", email: "farhan@demo.locora", phone: "+91 91110 29934", joinedAt: monthsAgo(41), avatarFrom: "#6366F1", avatarTo: "#4338CA", rating: 4.6, reviewsCount: 28, responseMins: 19 },
  { id: "u13", name: "Sunita Kale", role: "provider", area: "magarpatta", email: "sunita@demo.locora", phone: "+91 98229 07531", joinedAt: monthsAgo(58), avatarFrom: "#F59E0B", avatarTo: "#D97706", rating: 5.0, reviewsCount: 34, responseMins: 35, bio: "Home-style Maharashtrian & North Indian tiffins. Fresh, everyday." },
  { id: "u14", name: "Ravi Jadhav", role: "provider", area: "baner", email: "ravi@demo.locora", phone: "+91 91450 88223", joinedAt: monthsAgo(38), avatarFrom: "#EC4899", avatarTo: "#BE185D", rating: 4.8, reviewsCount: 22, responseMins: 24 },
  { id: "u15", name: "Neha Kulkarni", role: "provider", area: "fcroad", email: "neha@demo.locora", phone: "+91 97640 55218", joinedAt: monthsAgo(33), avatarFrom: "#8B5CF6", avatarTo: "#6D28D9", rating: 4.9, reviewsCount: 19, responseMins: 30, bio: "Certified yoga trainer (RYT-500). Home sessions & small group batches." },
  { id: "u16", name: "Ganesh Salunkhe", role: "provider", area: "swargate", email: "ganesh@demo.locora", phone: "+91 90280 11209", joinedAt: monthsAgo(50), avatarFrom: "#06B6D4", avatarTo: "#0E7490", verified: true, rating: 4.7, reviewsCount: 45, responseMins: 15 },
  { id: "u17", name: "Sandeep Pawaskar", role: "provider", area: "sadashiv", email: "sandeep@demo.locora", phone: "+91 98900 45671", joinedAt: monthsAgo(45), avatarFrom: "#EF4444", avatarTo: "#B91C1C", rating: 4.8, reviewsCount: 37, responseMins: 16 },
  { id: "u18", name: "Arjun Walia", role: "provider", area: "kalyani", email: "arjun@demo.locora", phone: "+91 98220 66045", joinedAt: monthsAgo(28), avatarFrom: "#F97316", avatarTo: "#C2410C", rating: 4.8, reviewsCount: 29, responseMins: 22, bio: "Cinematic wedding films & drone coverage. Two-person crew." },
  { id: "u19", name: "Prof. Atul Sabnis", role: "provider", area: "shivanagar", email: "atul@demo.locora", phone: "+91 98220 41007", joinedAt: monthsAgo(70), avatarFrom: "#0EA5E9", avatarTo: "#0369A1", rating: 4.7, reviewsCount: 52, responseMins: 28, bio: "15 years teaching Maths-Science. Small batches, big results." },
  { id: "u20", name: "Locora Admin", role: "admin", area: "shivanagar", email: "admin@demo.locora", phone: "+91 90000 00020", joinedAt: monthsAgo(80), avatarFrom: "#1B3054", avatarTo: "#0B1F3C" },
  { id: "u21", name: "Rahul Chordia", role: "seller", area: "wakad", email: "rahul@demo.locora", phone: "+91 91590 33218", joinedAt: monthsAgo(22), avatarFrom: "#14B8A6", avatarTo: "#0F766E", rating: 4.7, reviewsCount: 14, responseMins: 20 },
  { id: "u22", name: "Ishita Rao", role: "buyer", area: "kalyani", email: "ishita@demo.locora", phone: "+91 98228 77341", joinedAt: monthsAgo(9), avatarFrom: "#EC4899", avatarTo: "#BE185D" },
  { id: "u23", name: "Omkar Bhosale", role: "seller", area: "baner", email: "omkar@demo.locora", phone: "+91 90280 71165", joinedAt: monthsAgo(15), avatarFrom: "#6366F1", avatarTo: "#4338CA", verified: true, rating: 4.8, reviewsCount: 11, responseMins: 15 },
  { id: "u24", name: "Fatima Sayyed", role: "seller", area: "kharadi", email: "fatima@demo.locora", phone: "+91 97660 20098", joinedAt: monthsAgo(7), avatarFrom: "#F59E0B", avatarTo: "#D97706", rating: 4.9, reviewsCount: 7, responseMins: 9 },
  { id: "u25", name: "Nikhil Rane", role: "seller", area: "kp", email: "nikhil@demo.locora", phone: "+91 98221 30041", joinedAt: monthsAgo(26), avatarFrom: "#0390E0", avatarTo: "#014093", rating: 4.7, reviewsCount: 16, responseMins: 18 },
  { id: "u26", name: "Aditi Garware", role: "seller", area: "aundh", email: "aditi@demo.locora", phone: "+91 90280 91874", joinedAt: monthsAgo(11), avatarFrom: "#8B5CF6", avatarTo: "#6D28D9", rating: 4.9, reviewsCount: 8, responseMins: 12 },
  { id: "u27", name: "Rakesh More", role: "seller", area: "swargate", email: "rakesh@demo.locora", phone: "+91 90000 12321", joinedAt: daysAgo(2), avatarFrom: "#EF4444", avatarTo: "#B91C1C" },
  { id: "u28", name: "Manasi Joshi", role: "buyer", area: "magarpatta", email: "manasi@demo.locora", phone: "+91 98226 41009", joinedAt: monthsAgo(13), avatarFrom: "#06B6D4", avatarTo: "#0E7490" },
  { id: "u29", name: "Siddharth Rane", role: "buyer", area: "wakad", email: "siddharth@demo.locora", phone: "+91 90280 55412", joinedAt: monthsAgo(4), avatarFrom: "#0EA5E9", avatarTo: "#0369A1" },
  { id: "u30", name: "Kavita Bhat", role: "buyer", area: "baner", email: "kavita@demo.locora", phone: "+91 91450 22019", joinedAt: monthsAgo(6), avatarFrom: "#F97316", avatarTo: "#C2410C" },
];

/* --------------------------- products ---------------------------- */

const img = (name: string) => `/images/listings/${name}.jpg`;

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p1", sellerId: "u2", title: "iPhone 13 · 128GB · Midnight",
    description: "iPhone 13, 128GB in Midnight. Purchased from Croma in Aug 2023 — bill and box available. Always used a case and tempered glass, so the screen and body are in excellent condition with no scratches or dents. Battery health 89%. Selling as I've upgraded to the 16. Price slightly negotiable for a serious buyer.",
    price: 37500, negotiable: true, category: "mobiles", condition: "like-new", ageYears: 2,
    images: [img("iphone13-a"), img("iphone13-b")], area: "kothrud", createdAt: hoursAgo(5),
    views: 412, favorites: 38, status: "active",
    aiTags: ["Apple", "5G", "Face ID", "Bill available"],
    priceCheck: { label: "great", deltaPct: -8, comparables: 14 },
    attributes: { Storage: "128 GB", Colour: "Midnight", "Battery health": "89%", "Bill / box": "Yes" },
  },
  {
    id: "p2", sellerId: "u7", title: "Samsung Galaxy S22 5G · 8/128GB",
    description: "Samsung Galaxy S22 5G, 8GB/128GB, Phantom Black. Single owner, bought in Feb 2023. Comes with the original box, cable and two cases. Minor scuff on the frame (shown in photo 2), display flawless. No repairs, no water damage — happy for you to check everything on the spot before paying.",
    price: 31000, negotiable: true, category: "mobiles", condition: "good", ageYears: 2,
    images: [img("galaxy-a"), img("galaxy-b")], area: "hinjewadi", createdAt: hoursAgo(19),
    views: 268, favorites: 21, status: "active",
    aiTags: ["Samsung", "5G", "One owner"],
    priceCheck: { label: "fair", deltaPct: 3, comparables: 11 },
    attributes: { Storage: "128 GB", RAM: "8 GB", Colour: "Phantom Black", "Bill / box": "Box only" },
  },
  {
    id: "p3", sellerId: "u1", title: "MacBook Air M1 · 8GB/256GB",
    description: "MacBook Air M1, 8GB/256GB, Space Grey. Bought for WFH in 2022 and lightly used since — mostly browsing, docs and the occasional Figma file. Battery cycle count is just 210 and it still easily lasts 12+ hours. Includes the original 30W charger and a sleeve. Upgrading to a Pro for video editing, so this one has to go.",
    price: 52000, negotiable: false, category: "electronics", condition: "like-new", ageYears: 3,
    images: [img("macbook-a"), img("macbook-b")], area: "viman", createdAt: daysAgo(2),
    views: 523, favorites: 47, status: "active",
    aiTags: ["Apple", "M1 chip", "12+ hr battery"],
    priceCheck: { label: "fair", deltaPct: 4, comparables: 9 },
    attributes: { Chip: "Apple M1", RAM: "8 GB", Storage: "256 GB SSD", "Cycle count": "210" },
  },
  {
    id: "p4", sellerId: "u2", title: "Dell Inspiron 15 · i5 10th Gen · 8/512",
    description: "Dell Inspiron 15 5000 series — i5 10th gen, 8GB RAM (upgradable to 32), 512GB SSD + 1TB HDD. Fresh Windows 11 install, everything works perfectly. Ideal for students or office work. The keyboard has slight shine from use and the screen is clean with zero dead pixels. Selling because my office now provides a laptop.",
    price: 28500, negotiable: true, category: "electronics", condition: "good", ageYears: 4,
    images: [img("dell-a")], area: "kothrud", createdAt: daysAgo(4),
    views: 187, favorites: 12, status: "active",
    aiTags: ["Student-friendly", "Dual storage"],
    priceCheck: { label: "great", deltaPct: -11, comparables: 8 },
    attributes: { Processor: "i5-1035G1", RAM: "8 GB", Storage: "512GB SSD + 1TB HDD", OS: "Windows 11" },
  },
  {
    id: "p5", sellerId: "u2", title: "iPad 9th Gen · 64GB Wi-Fi",
    description: "iPad 9th generation, 64GB Wi-Fi, Silver. Used mostly for notes and Netflix, always kept in a folio case. Battery health is excellent. Box and charger included, plus a free ESR paper-feel screen protector — great for note-taking with a stylus.",
    price: 18999, negotiable: true, category: "electronics", condition: "like-new", ageYears: 2,
    images: [img("ipad-a")], area: "kothrud", createdAt: daysAgo(6),
    views: 233, favorites: 19, status: "active",
    aiTags: ["Note-taking", "With box"],
    priceCheck: { label: "fair", deltaPct: 2, comparables: 7 },
    attributes: { Storage: "64 GB", Connectivity: "Wi-Fi", "Bill / box": "Yes" },
  },
  {
    id: "p6", sellerId: "u25", title: "Canon EOS 200D II + 18-55mm Kit",
    description: "Canon EOS 200D II (EOS 250D) with the 18-55mm IS STM kit lens. Shutter count is around 11k — practically new for this body. Includes a 64GB SanDisk card, original strap, a padded bag and one extra original battery. Moving to mirrorless, hence selling.",
    price: 33500, negotiable: true, category: "electronics", condition: "good", ageYears: 3,
    images: [img("dslr-a"), img("dslr-b")], area: "kp", createdAt: daysAgo(3),
    views: 301, favorites: 26, status: "active",
    aiTags: ["DSLR", "Vlogging-friendly", "Extra battery"],
    priceCheck: { label: "great", deltaPct: -9, comparables: 6 },
    attributes: { "Shutter count": "~11,000", Lens: "18-55mm IS STM", Accessories: "Bag, 64GB card, 2 batteries" },
  },
  {
    id: "p7", sellerId: "u1", title: "Sony WH-1000XM4 · Silver",
    description: "Sony WH-1000XM4 in Silver — the ANC is genuinely a life-saver on Pune roads. Includes the original hard case, cable and documentation. I recently replaced both ear pads with brand new ones (₹1,200), so they feel fresh. A few minor marks on the headband, everything works perfectly.",
    price: 11500, negotiable: true, category: "electronics", condition: "like-new", ageYears: 2,
    images: [img("headphones-a"), img("headphones-b")], area: "viman", createdAt: daysAgo(1),
    views: 158, favorites: 22, status: "active",
    aiTags: ["ANC", "New ear pads", "30-hr battery"],
    priceCheck: { label: "great", deltaPct: -12, comparables: 10 },
    attributes: { Colour: "Silver", "Ear pads": "Brand new", ANC: "Yes, industry-class" },
  },
  {
    id: "p8", sellerId: "u7", title: "Royal Enfield Classic 350 · 2019",
    description: "Classic 350, 2019 model in Halcyon Black. 21,400 km on the odometer, every service done on schedule at the RE service centre — records available. New MRF tyres fitted last month and insurance is valid till March. Rides beautifully, completely stock, no modifications. Test ride welcome on weekends.",
    price: 135000, negotiable: true, category: "vehicles", condition: "good", ageYears: 6,
    images: [img("enfield-a"), img("enfield-b"), img("enfield-c")], area: "hinjewadi", createdAt: daysAgo(8),
    views: 1204, favorites: 96, status: "active",
    aiTags: ["Service records", "New tyres", "Insurance valid"],
    priceCheck: { label: "fair", deltaPct: 5, comparables: 13 },
    attributes: { "Model year": "2019", Odometer: "21,400 km", "Insurance": "Valid till Mar", Owner: "2nd owner" },
  },
  {
    id: "p9", sellerId: "u9", title: "Honda Activa 5G · 2018",
    description: "Activa 5G, 2018, 32,000 km on the clock. Regularly serviced at my own garage — engine is silky smooth, new battery and new tyres fitted recently. Averages around 50 km/l. Papers are clear and insurance was renewed last month. Perfect second two-wheeler for the family. One helmet included.",
    price: 46000, negotiable: true, category: "vehicles", condition: "fair", ageYears: 6,
    images: [img("activa-a"), img("activa-b")], area: "hinjewadi", createdAt: daysAgo(5),
    views: 842, favorites: 41, status: "active",
    aiTags: ["Mechanic-owned", "50 km/l", "Papers clear"],
    priceCheck: { label: "great", deltaPct: -10, comparables: 15 },
    attributes: { "Model year": "2018", Odometer: "32,000 km", Mileage: "~50 km/l" },
  },
  {
    id: "p10", sellerId: "u26", title: "Btwin Rockrider ST 100 · 27.5\"",
    description: "Btwin Rockrider ST 100, 27.5-inch wheels, used for about eight months of weekend rides on Pashan lake road. Just tuned — brakes and gears adjusted, tyres in good shape. Selling because I've joined a road-cycling group. A cycle lock and headlight are included in the price.",
    price: 7500, negotiable: true, category: "sports", condition: "like-new", ageYears: 1,
    images: [img("bicycle-a"), img("bicycle-b")], area: "aundh", createdAt: daysAgo(2),
    views: 129, favorites: 14, status: "active",
    aiTags: ["Just serviced", "Lock included"],
    priceCheck: { label: "fair", deltaPct: 1, comparables: 5 },
    attributes: { "Wheel size": "27.5\"", Gears: "1x7", "Age": "8 months" },
  },
  {
    id: "p11", sellerId: "u23", title: "L-Shaped 6-Seater Fabric Sofa",
    description: "Six-seater L-shaped fabric sofa in charcoal grey, bought from HomeCentre in 2022. Cushions are still firm and the fabric was dry-cleaned just last month. One small mark on the corner unit (see photo 3), otherwise excellent condition. Buyer to arrange pickup from Baner — lift available, easy to move.",
    price: 23500, negotiable: true, category: "furniture", condition: "good", ageYears: 3,
    images: [img("sofa-a"), img("sofa-b"), img("sofa-c")], area: "baner", createdAt: daysAgo(7),
    views: 376, favorites: 33, status: "active",
    aiTags: ["Dry-cleaned", "HomeCentre", "6-seater"],
    priceCheck: { label: "great", deltaPct: -13, comparables: 9 },
    attributes: { Seats: "6 + chaise", Material: "Fabric", Brand: "HomeCentre" },
  },
  {
    id: "p12", sellerId: "u26", title: "Queen Bed with Hydraulic Storage",
    description: "Queen bed (78\" × 60\") with hydraulic storage in a sheesham wood finish, bought in 2021. The hydraulic lifts work smoothly and the storage underneath is massive — easily fits two quilts, pillows and off-season clothes. Mattress not included. I can arrange a carpenter to dismantle it for a small extra charge.",
    price: 16000, negotiable: true, category: "furniture", condition: "good", ageYears: 4,
    images: [img("bed-a")], area: "aundh", createdAt: daysAgo(9),
    views: 214, favorites: 18, status: "active",
    aiTags: ["Hydraulic storage", "Sheesham finish"],
    priceCheck: { label: "fair", deltaPct: 4, comparables: 7 },
    attributes: { Size: "Queen (78×60)", Storage: "Hydraulic", "Mattress": "Not included" },
  },
  {
    id: "p13", sellerId: "u23", title: "4-Seater Sheesham Dining Table",
    description: "Four-seater sheesham dining table with upholstered chairs, about five years old but solid as a rock. Recently polished, so the wood looks fresh. Two chairs have minor fabric wear on the seats. Perfect first dining set for a young family.",
    price: 11000, negotiable: false, category: "furniture", condition: "good", ageYears: 5,
    images: [img("dining-a"), img("dining-b")], area: "baner", createdAt: daysAgo(11),
    views: 168, favorites: 9, status: "active",
    aiTags: ["Solid wood", "Freshly polished"],
    priceCheck: { label: "great", deltaPct: -14, comparables: 6 },
    attributes: { Seats: "4", Wood: "Sheesham", Polish: "New" },
  },
  {
    id: "p14", sellerId: "u23", title: "Study Table + Bookshelf + Ergo Chair",
    description: "Compact 3-ft study table with a bookshelf hutch, paired with a height-adjustable ergonomic chair on smooth wheels. Less than a year old — we're moving abroad and it doesn't fit our shipping budget. Ideal for a WFH corner or a kid's room. Chair alone cost ₹4,200 new.",
    price: 4800, negotiable: true, category: "furniture", condition: "like-new", ageYears: 1,
    images: [img("desk-a")], area: "baner", createdAt: hoursAgo(30),
    views: 287, favorites: 25, status: "active",
    aiTags: ["WFH-ready", "Under ₹5k", "Barely used"],
    priceCheck: { label: "great", deltaPct: -18, comparables: 8 },
    attributes: { "Table size": "3 ft", Chair: "Height-adjustable", Age: "11 months" },
  },
  {
    id: "p15", sellerId: "u21", title: "LG 1.5T 5-Star Inverter Split AC",
    description: "LG 1.5-ton 5-star dual inverter split AC, 2022 model. Cooling is excellent and it has been serviced by LG Care every season — the last full jet service was two months back. Remote and stabilizer included. Our technician will handle the uninstall free of cost so the gas stays sealed.",
    price: 19500, negotiable: true, category: "appliances", condition: "good", ageYears: 3,
    images: [img("ac-a"), img("ac-b")], area: "wakad", createdAt: daysAgo(3),
    views: 322, favorites: 27, status: "active",
    aiTags: ["5-star", "Free uninstall", "Stabilizer incl."],
    priceCheck: { label: "fair", deltaPct: 6, comparables: 10 },
    attributes: { Capacity: "1.5 Ton", "Star rating": "5 ★ (2022)", Stabilizer: "Included" },
  },
  {
    id: "p16", sellerId: "u21", title: "Whirlpool 260L Double-Door Fridge",
    description: "Whirlpool 260L double-door refrigerator with base freezer, 2021 model. Works flawlessly — gasket and cooling checked by a technician last week. There's a small dent on one side which isn't visible once the fridge is placed against a wall. We're relocating to Bengaluru next month, hence the sale.",
    price: 12000, negotiable: true, category: "appliances", condition: "good", ageYears: 4,
    images: [img("fridge-a"), img("fridge-b")], area: "wakad", createdAt: daysAgo(4),
    views: 259, favorites: 16, status: "active",
    aiTags: ["Tech-verified", "Relocation sale"],
    priceCheck: { label: "great", deltaPct: -15, comparables: 9 },
    attributes: { Capacity: "260 L", "Freezer type": "Base", "Model year": "2021" },
  },
  {
    id: "p17", sellerId: "u24", title: "Nike Pegasus 40 · UK 8 / EU 42",
    description: "Nike Pegasus 40 in white, UK 8 / EU 42. Barely used — I ran in them maybe eight times before switching to trail shoes for the hills. No odour, always aired after runs, and the original box is included. Retail is ₹9,500, so this is a steal for a nearly-new daily trainer.",
    price: 2900, negotiable: true, category: "fashion", condition: "like-new", ageYears: 0.5,
    images: [img("sneakers-a"), img("sneakers-b")], area: "kharadi", createdAt: hoursAgo(9),
    views: 176, favorites: 31, status: "active",
    aiTags: ["Nearly new", "With box", "Daily trainer"],
    priceCheck: { label: "great", deltaPct: -22, comparables: 6 },
    attributes: { Size: "UK 8 / EU 42", Colour: "White", "Retail price": "₹9,500" },
  },
  {
    id: "p18", sellerId: "u24", title: "Titan Neo Analog · Leather Strap",
    description: "Titan Neo analog watch with a brown genuine-leather strap and champagne dial. Received as a gift and worn only a handful of times — the strap still looks new and it keeps perfect time. Box and warranty card included. A classy everyday watch at a friendly price.",
    price: 3200, negotiable: true, category: "fashion", condition: "like-new", ageYears: 1,
    images: [img("watch-a"), img("watch-b")], area: "kharadi", createdAt: daysAgo(2),
    views: 143, favorites: 20, status: "active",
    aiTags: ["Gift piece", "With box"],
    priceCheck: { label: "fair", deltaPct: 3, comparables: 5 },
    attributes: { Brand: "Titan", Strap: "Genuine leather", "Warranty card": "Yes" },
  },
  {
    id: "p19", sellerId: "u25", title: "Fender CD-60S Acoustic Guitar",
    description: "Fender CD-60S acoustic in mahogany finish — rich, warm tone that punches well above its price. The action was recently lowered at Furtados, so it plays beautifully with no buzz. Comes with a padded gig bag, capo, picks and a fresh set of spare strings. Upgrading to a dreadnought with a pickup.",
    price: 8500, negotiable: true, category: "music", condition: "like-new", ageYears: 2,
    images: [img("guitar-a"), img("guitar-b")], area: "kp", createdAt: daysAgo(5),
    views: 198, favorites: 24, status: "active",
    aiTags: ["Low action", "Gig bag included"],
    priceCheck: { label: "fair", deltaPct: 2, comparables: 4 },
    attributes: { Model: "CD-60S", Finish: "Mahogany", Accessories: "Bag, capo, picks, strings" },
  },
  {
    id: "p20", sellerId: "u27", title: "IPHONE 13 PRO MAX 256GB BRAND NEW SEALED",
    description: "BRAND NEW IPHONE 13 PRO MAX 256GB SEALED BOX. URGENT SALE, MOVING ABROAD. CALL 98XX XX321 DIRECTLY. ADVANCE PAYTM ONLY, NO TIME WASTERS. PRICE FINAL.",
    price: 18999, negotiable: false, category: "mobiles", condition: "new", ageYears: 0,
    images: [img("iphone13-a")], area: "swargate", createdAt: hoursAgo(2),
    views: 97, favorites: 6, status: "active",
    aiTags: [],
    priceCheck: { label: "great", deltaPct: -68, comparables: 14 },
    flagged: {
      score: 92,
      reasons: [
        "Price is 68% below the local market rate for this model",
        "Asks for advance payment before meeting",
        "Pushes the conversation off Locora (phone number in description)",
        "All-caps, urgency language — common scam pattern",
      ],
    },
  },
];

/* --------------------------- services ---------------------------- */

const svc = (name: string) => `/images/services/${name}.jpg`;

export const SEED_SERVICES: Service[] = [
  {
    id: "s1", providerId: "u3", title: "Rohan Sharma Plumbing", category: "plumber",
    tagline: "Leaky taps? Fixed right the first time.",
    description: "I'm Rohan, a licensed plumber serving Koregaon Park and nearby areas for 12+ years. From leaky taps and blocked drains to full bathroom fittings and water-tank installations — honest work at fair prices, with a 30-day service guarantee on every repair. I carry my own tools and give a clear estimate before starting any job.",
    startingPrice: 199, priceUnit: "visit", area: "kp", radiusKm: 8,
    images: [svc("plumber-a"), svc("plumber-b"), svc("plumber-c")],
    rating: 4.9, reviewsCount: 86, jobsDone: 1240, responseMins: 6, experienceYears: 12,
    availability: ["Mon – Sat", "8:00 AM – 8:00 PM"],
    skills: ["Leaks & taps", "Drain unblocking", "Bathroom fittings", "Water tank cleaning", "Motor repair"],
    verified: true, createdAt: monthsAgo(52),
  },
  {
    id: "s2", providerId: "u4", title: "Shaikh Electrical Works", category: "electrician",
    tagline: "Switchboards, wiring & inverters — done safe.",
    description: "Licensed electrician with 10 years of experience across Kothrud and west Pune. I handle complete house wiring, switchboard upgrades, inverter and UPS installation, fans, lights and those mysterious tripping MCBs. Every job comes with a 6-month workmanship warranty and a written estimate.",
    startingPrice: 149, priceUnit: "visit", area: "kothrud", radiusKm: 9,
    images: [svc("electrician-a"), svc("electrician-b"), svc("electrician-c")],
    rating: 4.8, reviewsCount: 54, jobsDone: 890, responseMins: 11, experienceYears: 10,
    availability: ["Mon – Sat", "9:00 AM – 7:30 PM"],
    skills: ["House wiring", "Switchboard repair", "Inverter & UPS", "Fan / light fitting", "MCB tripping fixes"],
    verified: true, createdAt: monthsAgo(47),
  },
  {
    id: "s3", providerId: "u5", title: "Priya Desai — Maths & Science Tutor", category: "tutor",
    tagline: "Class 6–10 maths & science, made simple.",
    description: "M.Sc. Mathematics from Pune University, teaching Class 6–10 (CBSE & ICSE) for 6 years. Small batches of max 6 students at my Baner home, or online one-on-one. I focus on concept clarity over rote learning, with weekly tests and a monthly progress report shared with parents.",
    startingPrice: 400, priceUnit: "session", area: "baner", radiusKm: 6,
    images: [svc("tutor-a"), svc("tutor-b"), svc("tutor-c")],
    rating: 5.0, reviewsCount: 23, jobsDone: 140, responseMins: 14, experienceYears: 6,
    availability: ["Mon – Fri", "5:00 PM – 8:30 PM"],
    skills: ["CBSE Maths", "ICSE Science", "Class 10 boards", "Doubt-clearing", "Weekly tests"],
    verified: false, createdAt: monthsAgo(40),
  },
  {
    id: "s4", providerId: "u6", title: "Kabir Mehta Photography", category: "photographer",
    tagline: "Candid stories, not posed photos.",
    description: "I've spent 8 years photographing 400+ weddings, birthdays and milestones across Pune. My style is candid and documentary — the laughter, the tears, the relatives stealing snacks. Every package includes a same-day preview reel, professionally edited photos in a private gallery, and all raw files on request.",
    startingPrice: 9500, priceUnit: "event", area: "erandwane", radiusKm: 25,
    images: [svc("photographer-a"), svc("photographer-b")],
    rating: 4.9, reviewsCount: 41, jobsDone: 410, responseMins: 18, experienceYears: 8,
    availability: ["Weekends", "Weekdays on request"],
    skills: ["Weddings", "Birthdays & milestones", "Pre-wedding shoots", "Product photography", "Same-day preview reel"],
    verified: true, createdAt: monthsAgo(63),
  },
  {
    id: "s5", providerId: "u9", title: "Pawar Auto Garage", category: "mechanic",
    tagline: "Your bike deserves a mechanic who cares.",
    description: "Family-run garage in Hinjewadi, 15 years in the trade. We service all two-wheelers and handle car ACs, engine diagnostics and dent-and-paint. No job starts without your approval, and old parts are always returned to you. Free pickup and drop within 3 km for major services.",
    startingPrice: 499, priceUnit: "visit", area: "hinjewadi", radiusKm: 10,
    images: [svc("mechanic-a"), svc("mechanic-b"), svc("mechanic-c")],
    rating: 4.8, reviewsCount: 77, jobsDone: 2100, responseMins: 21, experienceYears: 15,
    availability: ["Mon – Sun", "9:00 AM – 8:00 PM"],
    skills: ["Bike servicing", "Engine diagnostics", "Dent & paint", "Car AC check", "Roadside assistance"],
    verified: true, createdAt: monthsAgo(78),
  },
  {
    id: "s6", providerId: "u8", title: "Meera's SparkleClean", category: "cleaner",
    tagline: "Homes that sparkle before guests arrive.",
    description: "I lead a 4-member trained cleaning team serving Hadapsar and east Pune. Deep cleaning, sofa and carpet shampooing, kitchen degreasing, bathroom sanitisation and move-in makeovers — we bring our own machines and eco-friendly chemicals. Book 48 hours ahead for weekends.",
    startingPrice: 2499, priceUnit: "visit", area: "hadapsar", radiusKm: 9,
    images: [svc("cleaner-a"), svc("cleaner-b"), svc("cleaner-c")],
    rating: 4.7, reviewsCount: 63, jobsDone: 780, responseMins: 26, experienceYears: 5,
    availability: ["Mon – Sun", "8:00 AM – 6:00 PM"],
    skills: ["Deep cleaning", "Sofa & carpet shampoo", "Kitchen degreasing", "Bathroom sanitisation", "Move-in cleaning"],
    verified: false, createdAt: monthsAgo(44),
  },
  {
    id: "s7", providerId: "u11", title: "CoolCare AC & Appliances", category: "ac-repair",
    tagline: "Cool air, clean air, honest pricing.",
    description: "AC technician with 8 years of experience — jet servicing, gas refill, installation and uninstallation for split and window units. I also repair refrigerators and washing machines. Transparent pricing: the visit charge adjusts into the repair if you go ahead. Annual maintenance contracts available.",
    startingPrice: 349, priceUnit: "visit", area: "wakad", radiusKm: 10,
    images: [], rating: 4.7, reviewsCount: 39, jobsDone: 660, responseMins: 13, experienceYears: 8,
    availability: ["Mon – Sat", "9:00 AM – 8:00 PM"],
    skills: ["AC jet service", "Gas refill", "Install / uninstall", "Fridge repair", "AMC plans"],
    verified: true, createdAt: monthsAgo(62),
  },
  {
    id: "s8", providerId: "u10", title: "Ananya Iyer Interiors", category: "interior",
    tagline: "Small budgets, beautiful homes.",
    description: "Interior designer specialising in 1 and 2BHK makeovers that respect real budgets. Space planning, modular kitchens, wardrobe design, colour consultation and vastu-friendly layouts. First consultation at your home for ₹2,999 — fully adjusted into the project value if you sign up.",
    startingPrice: 2999, priceUnit: "visit", area: "aundh", radiusKm: 15,
    images: [], rating: 4.9, reviewsCount: 18, jobsDone: 64, responseMins: 42, experienceYears: 7,
    availability: ["Mon – Sat", "10:00 AM – 7:00 PM"],
    skills: ["1/2BHK makeovers", "Modular kitchens", "Space planning", "Colour consulting", "3D renders"],
    verified: false, createdAt: monthsAgo(56),
  },
  {
    id: "s9", providerId: "u12", title: "Shield Pest Control", category: "pest-control",
    tagline: "Cockroaches, termites — gone and staying gone.",
    description: "Government-approved chemicals, child- and pet-safe application, and a 90-day re-service guarantee. We handle cockroach gel treatment, termite control (pre and post construction), bed bugs, mosquito fogging for societies and rat proofing. Same-day slots available most days.",
    startingPrice: 1499, priceUnit: "visit", area: "swargate", radiusKm: 12,
    images: [], rating: 4.6, reviewsCount: 28, jobsDone: 350, responseMins: 19, experienceYears: 6,
    availability: ["Mon – Sun", "8:00 AM – 7:00 PM"],
    skills: ["Cockroach gel treatment", "Termite control", "Bed bugs", "Society fogging", "Rat proofing"],
    verified: false, createdAt: monthsAgo(41),
  },
  {
    id: "s10", providerId: "u13", title: "Sunita's Tiffin Service", category: "cook",
    tagline: "Ghar ka khana, delivered with love.",
    description: "Home-style Maharashtrian and North Indian tiffins from Magarpatta City — fresh, homely portions cooked the same morning. Jain and low-oil options on request. Monthly subscriptions include 2 sabzis, dal/rice, 6 rotis and a sweet on Sundays. Trial tiffin at ₹120 before you subscribe.",
    startingPrice: 6500, priceUnit: "month", area: "magarpatta", radiusKm: 5,
    images: [], rating: 5.0, reviewsCount: 34, jobsDone: 9800, responseMins: 35, experienceYears: 9,
    availability: ["Mon – Sun", "Lunch & dinner"],
    skills: ["Maharashtrian thali", "North Indian", "Jain options", "Low-oil meals", "Trial tiffin"],
    verified: true, createdAt: monthsAgo(58),
  },
  {
    id: "s11", providerId: "u14", title: "Ravi Painting Works", category: "painter",
    tagline: "Fresh walls, fresh home — before the festival.",
    description: "Interior and exterior painting with a trained 6-member crew. Putty, primer, premium emulsions, texture walls and waterproofing for terraces and bathrooms. We cover all furniture before starting, finish on the promised date, and do a touch-up walkthrough with you at the end.",
    startingPrice: 18, priceUnit: "sqft", area: "baner", radiusKm: 12,
    images: [], rating: 4.8, reviewsCount: 22, jobsDone: 190, responseMins: 24, experienceYears: 11,
    availability: ["Mon – Sat", "8:30 AM – 6:00 PM"],
    skills: ["Interior emulsion", "Texture walls", "Waterproofing", "Putty & primer", "Festival packages"],
    verified: false, createdAt: monthsAgo(38),
  },
  {
    id: "s12", providerId: "u15", title: "Neha's Yoga at Home", category: "yoga",
    tagline: "Breathe, stretch, strengthen — at home.",
    description: "RYT-500 certified yoga trainer offering home sessions in central Pune and small morning batches on FC Road. Hatha yoga, pranayama, back and neck pain relief for desk workers, and certified prenatal routines. First session is a free alignment assessment — bring only a mat.",
    startingPrice: 700, priceUnit: "session", area: "fcroad", radiusKm: 8,
    images: [], rating: 4.9, reviewsCount: 19, jobsDone: 2400, responseMins: 30, experienceYears: 8,
    availability: ["Mon – Sat", "6:00 AM – 8:00 AM", "5:30 PM – 7:30 PM"],
    skills: ["Hatha yoga", "Pranayama", "Back-pain relief", "Prenatal (certified)", "Desk-worker routines"],
    verified: false, createdAt: monthsAgo(33),
  },
  {
    id: "s13", providerId: "u16", title: "Ganesh Plumbing Works", category: "plumber",
    tagline: "All plumbing needs, one honest plumber.",
    description: "Nine years of plumbing across central and south Pune — repairs, fittings, bathroom renovation plumbing and drainage issues. I believe in minimum-charge honesty: if a job takes 10 minutes, you pay for 10 minutes. Senior-citizen priority slots every morning.",
    startingPrice: 149, priceUnit: "visit", area: "swargate", radiusKm: 10,
    images: [svc("plumber-c")], rating: 4.7, reviewsCount: 45, jobsDone: 810, responseMins: 15, experienceYears: 9,
    availability: ["Mon – Sat", "8:00 AM – 7:00 PM"],
    skills: ["Plumbing repairs", "Bathroom renovation", "Drainage issues", "Fittings & fixtures"],
    verified: true, createdAt: monthsAgo(50),
  },
  {
    id: "s14", providerId: "u17", title: "Sandeep Electricals", category: "electrician",
    tagline: "Electrical work with a 6-month warranty.",
    description: "From a faulty switch to full apartment rewiring — I've handled it all in 8 years across old Pune. Fixed-price repairs for common issues, honest quotes for bigger jobs, and a 6-month warranty on every connection I touch. Emergency calls attended till 10 PM.",
    startingPrice: 199, priceUnit: "visit", area: "sadashiv", radiusKm: 11,
    images: [svc("electrician-b")], rating: 4.8, reviewsCount: 37, jobsDone: 640, responseMins: 16, experienceYears: 8,
    availability: ["Mon – Sat", "9:00 AM – 10:00 PM"],
    skills: ["Repairs & fittings", "Apartment rewiring", "Emergency calls", "Lighting design"],
    verified: false, createdAt: monthsAgo(45),
  },
  {
    id: "s15", providerId: "u18", title: "Walia Films", category: "photographer",
    tagline: "Cinematic wedding films on a budget.",
    description: "Two-person crew shooting cinematic highlight films and traditional coverage for weddings, sangeets and receptions. 4K cinematography, drone coverage where permitted, and delivery within 3 weeks. Transparent packages — no per-photo surprises, travel outside Pune at actuals.",
    startingPrice: 12000, priceUnit: "event", area: "kalyani", radiusKm: 30,
    images: [svc("photographer-b")], rating: 4.8, reviewsCount: 29, jobsDone: 130, responseMins: 22, experienceYears: 6,
    availability: ["On request", "Booking calendar online"],
    skills: ["Wedding films", "Drone coverage", "Sangeet & reception", "Same-day edits"],
    verified: true, createdAt: monthsAgo(28),
  },
  {
    id: "s16", providerId: "u19", title: "LearnEdge Tutorials", category: "tutor",
    tagline: "Board results that make parents proud.",
    description: "Run by Prof. Atul Sabnis — 15 years of teaching maths and science to Class 8–10 (SSC, CBSE). Batches of 10 at our Shivaji Nagar centre, with doubt sessions every Saturday and three full prelims before boards. 94% of our 2025 batch scored 85%+ in maths.",
    startingPrice: 350, priceUnit: "session", area: "shivanagar", radiusKm: 8,
    images: [svc("tutor-c")], rating: 4.7, reviewsCount: 52, jobsDone: 520, responseMins: 28, experienceYears: 15,
    availability: ["Mon – Sat", "4:00 PM – 9:00 PM"],
    skills: ["SSC Maths-Science", "CBSE boards", "Saturday doubt sessions", "Prelim tests"],
    verified: false, createdAt: monthsAgo(70),
  },
];

/* ---------------------------- reviews ----------------------------- */

export const SEED_REVIEWS: Review[] = [
  { id: "r1", targetId: "u3", author: "Aarav K.", authorArea: "viman", rating: 5, text: "Fixed a stubborn kitchen leak in 30 minutes flat. Charged exactly what he quoted — no 'extra parts' surprise at the end.", dealType: "service", createdAt: daysAgo(12) },
  { id: "r2", targetId: "u3", author: "Manasi J.", authorArea: "magarpatta", rating: 5, text: "Came within an hour on a Sunday. Rare to find this level of commitment these days.", dealType: "service", createdAt: monthsAgo(1) },
  { id: "r3", targetId: "u3", author: "Prakash D.", authorArea: "swargate", rating: 5, text: "Honest guy — told me the tap only needed a ₹30 washer instead of a full replacement. Could have easily fooled me.", dealType: "service", createdAt: monthsAgo(2) },
  { id: "r4", targetId: "u5", author: "Reema S.", authorArea: "baner", rating: 5, text: "My son's maths score jumped from 58% to 85% in one term. Priya ma'am's concept-first approach really works.", dealType: "service", createdAt: monthsAgo(2) },
  { id: "r5", targetId: "u5", author: "Suresh P.", authorArea: "aundh", rating: 5, text: "Very patient with doubts and sends weekly progress updates on the parent group. Highly recommended.", dealType: "service", createdAt: monthsAgo(4) },
  { id: "r6", targetId: "u2", author: "Ishita R.", authorArea: "kalyani", rating: 5, text: "iPhone was exactly as described — spotless. Smooth deal, met at a cafe, done in 15 minutes.", dealType: "product", createdAt: monthsAgo(2) },
  { id: "r7", targetId: "u2", author: "Rahul C.", authorArea: "wakad", rating: 4, text: "Quick replies, fair price, no haggling drama. Would buy again.", dealType: "product", createdAt: monthsAgo(5) },
  { id: "r8", targetId: "u6", author: "Devika M.", authorArea: "kp", rating: 5, text: "Delivered 200+ beautifully edited photos in 3 days. The same-day preview reel was the highlight of our family group 😄", dealType: "service", createdAt: monthsAgo(1) },
  { id: "r9", targetId: "u6", author: "Nikhil R.", authorArea: "kp", rating: 5, text: "Captured our daughter's first birthday perfectly — candid, warm, zero awkward posing.", dealType: "service", createdAt: monthsAgo(3) },
  { id: "r10", targetId: "u9", author: "Farhan K.", authorArea: "swargate", rating: 5, text: "My Activa feels brand new after his service. Shows you the old parts without being asked.", dealType: "service", createdAt: monthsAgo(1) },
  { id: "r11", targetId: "u9", author: "Omkar B.", authorArea: "baner", rating: 4, text: "Fair rates and no unnecessary part replacements. Garage is a bit hard to find though.", dealType: "service", createdAt: monthsAgo(3) },
  { id: "r12", targetId: "u8", author: "Ananya I.", authorArea: "aundh", rating: 5, text: "Deep clean before Diwali — the house was genuinely spotless, even inside the chimney.", dealType: "service", createdAt: monthsAgo(7) },
  { id: "r13", targetId: "u8", author: "Priya D.", authorArea: "baner", rating: 5, text: "Punctual team, brought their own machines and supplies. Booked them again for my parents' place.", dealType: "service", createdAt: monthsAgo(4) },
  { id: "r14", targetId: "u7", author: "Aditya T.", authorArea: "hinjewadi", rating: 5, text: "The Enfield was exactly as listed. Test ride given happily, papers all in order.", dealType: "product", createdAt: monthsAgo(1) },
  { id: "r15", targetId: "u23", author: "Kavita B.", authorArea: "baner", rating: 5, text: "Sofa in great condition and Omkar even helped us arrange a tempo for pickup.", dealType: "product", createdAt: monthsAgo(2) },
  { id: "r16", targetId: "u4", author: "Sunita K.", authorArea: "magarpatta", rating: 5, text: "Rewired our old flat neatly and left zero mess behind. Explained everything patiently.", dealType: "service", createdAt: monthsAgo(2) },
  { id: "r17", targetId: "u1", author: "Vishal N.", authorArea: "kharadi", rating: 5, text: "MacBook was packed carefully and he shared battery health reports without me even asking. Trustworthy seller.", dealType: "product", createdAt: monthsAgo(6) },
  { id: "r18", targetId: "u16", author: "Dattatray P.", authorArea: "swargate", rating: 3, text: "Good work overall but arrived two hours late on the first visit without informing.", dealType: "service", createdAt: monthsAgo(2) },
];

/* -------------------------- conversations ------------------------- */

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "c1", participants: ["u1", "u2"],
    subject: { type: "product", id: "p1", title: "iPhone 13 · 128GB · Midnight", image: img("iphone13-a"), price: 37500 },
    updatedAt: hoursAgo(3), unreadFor: [],
    messages: [
      { id: "m1", senderId: "u1", text: "Hi Sneha! Is the iPhone 13 still available? Any scratches or dents I should know about?", at: daysAgo(1), kind: "text" },
      { id: "m2", senderId: "u2", text: "Hi Aarav! Yes, still available. Screen is spotless — always had a tempered glass and case on. There's a tiny mark near the charging port, barely visible.", at: daysAgo(1), kind: "text" },
      { id: "m3", senderId: "u2", text: "Battery health is 89%, and I have the Croma bill and original box.", at: daysAgo(1), kind: "text" },
      { id: "m4", senderId: "u1", text: "Great, that sounds good. Would you consider ₹36,500? I can pick it up today itself.", at: hoursAgo(26), kind: "text" },
      { id: "m5", senderId: "u1", text: "Offer sent", at: hoursAgo(26), kind: "offer", offer: { amount: 36500, note: "Can pick up today" } },
      { id: "m6", senderId: "u2", text: "Hmm, ₹36,500 is a bit low with the bill and box included. I can do ₹37,500 and I'll throw in a new Spigen case 🙌", at: hoursAgo(24), kind: "text" },
      { id: "m7", senderId: "u1", text: "Deal at ₹37,500! I've updated my offer.", at: hoursAgo(4), kind: "offer", offer: { amount: 37500, note: "Including Spigen case" } },
      { id: "m8", senderId: "u2", text: "Perfect 😄 I'm near Kothrud depot — we can meet at the Cafe Coffee Day on Paud Road tomorrow at 6 PM? I'll bring the phone fully charged so you can check everything.", at: hoursAgo(3), kind: "text" },
    ],
  },
  {
    id: "c2", participants: ["u1", "u3"],
    subject: { type: "service", id: "s1", title: "Rohan Sharma Plumbing", image: svc("plumber-a") },
    updatedAt: daysAgo(11), unreadFor: [],
    messages: [
      { id: "m1", senderId: "u1", text: "Hi Rohan, my kitchen tap has been leaking since yesterday and the drain is slow too. Could you check today?", at: daysAgo(12), kind: "text" },
      { id: "m2", senderId: "u3", text: "Yes sir, I can come between 4–6 PM today. Visit charge is ₹199, adjusted into the repair if you go ahead.", at: daysAgo(12), kind: "text" },
      { id: "m3", senderId: "u1", text: "Perfect, see you then. Building name: Silver Oak Heights, Viman Nagar.", at: daysAgo(12), kind: "text" },
      { id: "m4", senderId: "u3", text: "Done sir ✅ It was the washer + a minor block in the bend. ₹350 total including the visit charge.", at: daysAgo(11), kind: "text" },
      { id: "m5", senderId: "u1", text: "That was quick! Paid. Thanks Rohan 🙏", at: daysAgo(11), kind: "text" },
      { id: "m6", senderId: "u1", text: "Deal completed — Aarav marked this deal as done.", at: daysAgo(11), kind: "system" },
    ],
  },
  {
    id: "c3", participants: ["u1", "u6"],
    subject: { type: "service", id: "s4", title: "Kabir Mehta Photography", image: svc("photographer-a") },
    updatedAt: hoursAgo(1), unreadFor: ["u1"],
    messages: [
      { id: "m1", senderId: "u1", text: "Hi Kabir! Need a photographer for my mom's 60th birthday on the 21st — home + cake cutting, around 3 hours. Kalyani Nagar.", at: hoursAgo(20), kind: "text" },
      { id: "m2", senderId: "u6", text: "Hi Aarav! First of all, congratulations to aunty 🎉 A 60th deserves proper coverage.", at: hoursAgo(2), kind: "text" },
      { id: "m3", senderId: "u6", text: "I'd suggest my 3-hour event package — ₹9,500 with 150+ edited photos in a private gallery, a same-day preview reel for the family group, and one 8×10 framed print as a gift. Travel within Pune is included.", at: hoursAgo(1), kind: "text" },
    ],
  },
  {
    id: "c4", participants: ["u1", "u7"],
    subject: { type: "product", id: "p8", title: "Royal Enfield Classic 350 · 2019", image: img("enfield-a"), price: 135000 },
    updatedAt: daysAgo(2), unreadFor: [],
    messages: [
      { id: "m1", senderId: "u1", text: "Hi Vikram, serious about the Classic 350. Test ride possible this weekend?", at: daysAgo(3), kind: "text" },
      { id: "m2", senderId: "u7", text: "Sure! Saturday morning works best — I'm in Hinjewadi Phase 1. RC, insurance and full service records all available for you to verify.", at: daysAgo(2), kind: "text" },
    ],
  },
];

/* ------------------------- I'm-looking-for ------------------------ */

export const SEED_REQUESTS: BuyRequest[] = [
  {
    id: "q1", buyerId: "u22", text: "Need a plumber today — kitchen sink is completely blocked 🚨",
    category: "plumber", area: "kalyani", budgetMax: 600, needBy: "today", status: "open",
    createdAt: hoursAgo(7), watching: false,
    matches: [
      { userId: "u3", serviceId: "s1", score: 96, distanceKm: 1.5, reason: "4.9★ (86 reviews) · replies in ~6 min · 1.5 km away" },
      { userId: "u16", serviceId: "s13", score: 88, distanceKm: 6.3, reason: "4.7★ (45 reviews) · ₹149 visit charge · 6.3 km away" },
    ],
  },
  {
    id: "q2", buyerId: "u1", text: "Looking for a study table with a bookshelf — budget under ₹5,000, near Viman Nagar",
    category: "furniture", area: "viman", budgetMax: 5000, needBy: "flexible", status: "open",
    createdAt: daysAgo(2), watching: true,
    matches: [
      { userId: "u23", productId: "p14", score: 91, distanceKm: 14.6, reason: "₹4,800 · Like new · closest match in budget — 14.6 km in Baner" },
    ],
  },
  {
    id: "q3", buyerId: "u28", text: "Wedding photographer for 24th–25th Nov, 2-day event, budget around ₹60,000",
    category: "photographer", area: "magarpatta", budgetMax: 60000, needBy: "flexible", status: "open",
    createdAt: daysAgo(1), watching: false,
    matches: [
      { userId: "u6", serviceId: "s4", score: 98, distanceKm: 9.9, reason: "4.9★ (41 reviews) · 400+ events · wedding specialist" },
      { userId: "u18", serviceId: "s15", score: 92, distanceKm: 5.4, reason: "4.8★ (29 reviews) · cinematic films · drone crew" },
    ],
  },
  {
    id: "q4", buyerId: "u29", text: "AC jet servicing for 2 units before the summer rush",
    category: "ac-repair", area: "wakad", budgetMax: 1500, needBy: "this-week", status: "open",
    createdAt: hoursAgo(30), watching: false,
    matches: [
      { userId: "u11", serviceId: "s7", score: 97, distanceKm: 0.8, reason: "4.7★ (39 reviews) · ₹349/visit · in your area" },
    ],
  },
  {
    id: "q5", buyerId: "u30", text: "Home tutor for Class 10 CBSE — maths & science, evenings, 3 days a week",
    category: "tutor", area: "baner", budgetMax: 6000, needBy: "flexible", status: "open",
    createdAt: daysAgo(3), watching: true,
    matches: [
      { userId: "u5", serviceId: "s3", score: 96, distanceKm: 0.6, reason: "5.0★ (23 reviews) · CBSE specialist · right in Baner" },
      { userId: "u19", serviceId: "s16", score: 89, distanceKm: 8.3, reason: "4.7★ (52 reviews) · 15 yrs experience · prelims included" },
    ],
  },
];

/* ----------------------------- reports ---------------------------- */

export const SEED_REPORTS: Report[] = [
  {
    id: "rp1", targetType: "product", targetId: "p20",
    targetLabel: "IPHONE 13 PRO MAX 256GB BRAND NEW SEALED — ₹18,999",
    reason: "AI scam detection", details: "Priced 68% below market for this model; advance-PayTM language; pushes contact off-platform; all-caps urgency pattern. Flagged 42 minutes after publishing.",
    by: "Locora AI", createdAt: hoursAgo(2), status: "open",
  },
  {
    id: "rp2", targetType: "chat", targetId: "c98", targetLabel: "Chat: Ishita R. ↔ Rakesh M.",
    reason: "Off-platform payment request", details: "Seller asked for a ₹2,000 advance via PayTM before meeting, refused to use Locora's chat for the discussion. Buyer reported within minutes.",
    by: "Ishita R.", createdAt: hoursAgo(1), status: "open",
  },
  {
    id: "rp3", targetType: "service", targetId: "s13", targetLabel: "Ganesh Plumbing Works",
    reason: "Provider no-show", details: "Provider accepted a 10 AM job and did not arrive or inform. Second such report in 30 days.",
    by: "Dattatray P.", createdAt: daysAgo(3), status: "reviewing",
  },
  {
    id: "rp4", targetType: "product", targetId: "p13", targetLabel: "4-Seater Sheesham Dining Table",
    reason: "Possible duplicate listing", details: "Same photos as listing #1042 by another account. Auto-cleared: photos verified as same household (family members selling separately).",
    by: "Locora AI", createdAt: daysAgo(6), status: "resolved",
  },
];

/* --------------------------- notifications ------------------------ */

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", kind: "match", title: "AI found a match for your request", body: "Study table with bookshelf · ₹4,800 · 14.6 km away in Baner", at: hoursAgo(30), read: false, href: "/requests" },
  { id: "n2", kind: "message", title: "Kabir Mehta replied to your enquiry", body: "3-hour event package — ₹9,500 with 150+ edited photos…", at: hoursAgo(1), read: false, href: "/chat" },
  { id: "n3", kind: "price", title: "Price drop on a listing you saved", body: "iPhone 13 · 128GB is now ₹37,500 (was ₹38,500)", at: hoursAgo(5), read: false, href: "/product/p1" },
  { id: "n4", kind: "system", title: "Welcome to Locora 👋", body: "Explore verified services near Viman Nagar", at: daysAgo(30), read: true, href: "/home" },
];

/* ----------------------------- assemble --------------------------- */

export function seedState(): AppState {
  return {
    browseLocation: null,
    autoLocate: false,
    onlineUsers: [],
    version: SEED_VERSION,
    sessionUserId: null,
    browseArea: "all",
    users: SEED_USERS,
    products: SEED_PRODUCTS,
    services: SEED_SERVICES,
    reviews: SEED_REVIEWS,
    conversations: SEED_CONVERSATIONS,
    requests: SEED_REQUESTS,
    reports: SEED_REPORTS,
    notifications: SEED_NOTIFICATIONS,
    favorites: ["p1", "p8"],
  };
}
