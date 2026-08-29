export interface MerchantRule {
  keywords: string[];
  patterns?: RegExp[];
  categoryName: string;
  type: "EXPENSE" | "INCOME";
  confidence: number;
}

export const MERCHANT_RULES: MerchantRule[] = [
  // ── Food & Dining ──────────────────────────────────────────────────────────
  {
    keywords: [
      "swiggy", "zomato", "mcdonald", "mcdonalds", "kfc", "domino", "dominos",
      "burger king", "starbucks", "cafe coffee day", "ccd", "pizza hut", "subway",
      "eatclub", "behrouz", "faasos", "haldiram", "biryani", "chaayos", "chai point",
      "dunkin", "barbeque nation", "baskin robbins", "dhaba", "food court",
      "eatsure", "box8", "ovenstory", "licious", "rebel foods", "dunzo food",
    ],
    patterns: [/swiggy/i, /zomato/i, /restaurant/i, /food\s*court/i],
    categoryName: "Food",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Groceries ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "blinkit", "zepto", "instamart", "bigbasket", "bb daily", "dmart",
      "nature basket", "reliance fresh", "reliance retail", "more retail", "spencer",
      "spar", "supermarket", "hypermarket", "kirana", "provision", "jiomart",
      "milkbasket", "country delight", "grofers",
    ],
    patterns: [/blinkit/i, /zepto/i, /instamart/i, /bigbasket/i, /grocer/i, /supermarket/i, /jiomart/i],
    categoryName: "Groceries",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    keywords: [
      "amazon", "amzn", "flipkart", "myntra", "ajio", "nykaa", "tata cliq",
      "meesho", "zara", "h&m", "hnm", "uniqlo", "decathlon", "lifestyle",
      "shoppers stop", "westside", "pantaloons", "max fashion", "lenskart",
      "croma", "reliance digital", "snapdeal", "firstcry", "pepperfry", "ikea",
    ],
    patterns: [/amzn/i, /amazon/i, /flipkart/i, /myntra/i, /ajio/i, /nykaa/i],
    categoryName: "Shopping",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Transport & Fuel ───────────────────────────────────────────────────────
  {
    keywords: [
      "uber", "ola", "rapido", "blusmart", "irctc", "redbus", "makemytrip",
      "goibibo", "indigo", "air india", "vistara", "spicejet", "akasa",
      "metro", "fastag", "toll", "rapido", "meru", "yulu", "bounce",
    ],
    patterns: [/uber/i, /ola\s/i, /rapido/i, /fastag/i, /irctc/i, /makemytrip/i],
    categoryName: "Transport",
    type: "EXPENSE",
    confidence: 0.95,
  },
  {
    keywords: [
      "hpcl", "bpcl", "iocl", "indian oil", "bharat petroleum",
      "hindustan petroleum", "shell petrol", "fuel station", "petrol pump",
    ],
    patterns: [/petrol/i, /diesel/i, /fuel\s/i],
    categoryName: "Fuel",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Bills & Utilities ──────────────────────────────────────────────────────
  {
    keywords: [
      "bescom", "tneb", "mseb", "mseb", "electricity", "airtel", "jio", "vodafone",
      "tatasky", "tata play", "broadband", "act fibernet", "hathway", "water supply",
      "cylinder", "indane", "hp gas", "bharat gas", "billdesk", "bbps", "cred bill",
      "paytm bill", "phonepe bill", "dish tv", "sun direct", "reliance jio",
    ],
    patterns: [/billdesk/i, /bbps/i, /electricity/i, /broadband/i, /recharge/i, /utility/i, /dth/i],
    categoryName: "Bills",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Entertainment ──────────────────────────────────────────────────────────
  {
    keywords: [
      "netflix", "spotify", "hotstar", "disney", "prime video", "apple.com/bill",
      "google play", "playstore", "bookmyshow", "pvr", "inox", "cinepolis",
      "youtube premium", "playstation", "sony liv", "zee5", "steam", "jiohotstar",
      "crunchyroll", "audible",
    ],
    patterns: [/netflix/i, /spotify/i, /hotstar/i, /bookmyshow/i, /cinepolis/i, /pvr\s/i],
    categoryName: "Entertainment",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Healthcare ─────────────────────────────────────────────────────────────
  {
    keywords: [
      "apollo", "pharmeasy", "1mg", "tata 1mg", "practo", "netmeds", "medplus",
      "hospital", "clinic", "diagnostic", "pathology", "pharmacy",
      "chemist", "dental", "medicos", "fortis", "max healthcare", "manipal",
    ],
    patterns: [/pharma/i, /hospital/i, /clinic/i, /medic/i, /diagnostic/i],
    categoryName: "Healthcare",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Education ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "byju", "unacademy", "coursera", "udemy", "upgrad", "simplilearn",
      "school", "college", "university", "tuition", "coaching",
    ],
    patterns: [/byju/i, /unacademy/i, /coursera/i, /udemy/i],
    categoryName: "Education",
    type: "EXPENSE",
    confidence: 0.92,
  },

  // ── Rent & EMI ─────────────────────────────────────────────────────────────
  {
    keywords: [
      "rent", "nobroker", "housing", "nestaway", "landlord", "flat rent",
      "society maintenance", "maintenance charges",
    ],
    patterns: [/\brent\b/i, /maintenance\s*charg/i],
    categoryName: "Rent",
    type: "EXPENSE",
    confidence: 0.92,
  },
  {
    keywords: [
      "emi", "loan repayment", "hdfc loan", "sbi loan", "bajaj finserv",
      "credit card payment", "card payment", "hdb financial", "tata capital",
    ],
    patterns: [/\bemi\b/i, /loan\s*repay/i, /credit\s*card\s*pay/i],
    categoryName: "EMI",
    type: "EXPENSE",
    confidence: 0.92,
  },

  // ── Income ─────────────────────────────────────────────────────────────────
  {
    keywords: [
      "salary", "payroll", "stipend", "wages", "remuneration", "employer",
      "sal cr", "salary cr", "salary credit",
    ],
    patterns: [/\bsalary\b/i, /\bpayroll\b/i, /\bstipend\b/i, /salary\s*credit/i],
    categoryName: "Salary",
    type: "INCOME",
    confidence: 0.99,
  },
  {
    keywords: [
      "dividend", "interest credited", "fd interest", "mutual fund",
      "zerodha", "groww", "upstox", "kuvera", "smallcase", "indmoney",
    ],
    patterns: [/dividend/i, /interest\s*credit/i, /int\.?\s*pd/i, /fd\s*int/i],
    categoryName: "Investment",
    type: "INCOME",
    confidence: 0.95,
  },
  {
    keywords: [
      "freelance", "upwork", "fiverr", "toptal", "client payment",
      "consulting fee", "retainer",
    ],
    patterns: [/freelance/i, /consulting\s*fee/i, /upwork/i],
    categoryName: "Freelance",
    type: "INCOME",
    confidence: 0.92,
  },
  {
    keywords: [
      "invoice", "payout", "razorpay payout", "stripe payout", "sales revenue",
      "merchant settlement",
    ],
    patterns: [/payout/i, /merchant\s*settlement/i, /invoice\s*payment/i],
    categoryName: "Business",
    type: "INCOME",
    confidence: 0.90,
  },
];
