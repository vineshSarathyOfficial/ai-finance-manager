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
      "swiggy", "zomato", "mcdonald", "kfc", "domino", "burger king", "starbucks",
      "cafe coffee day", "ccd", "pizza hut", "subway", "eatclub", "behrouz", "faasos",
      "haldiram", "biryani", "chaayos", "chai point", "dunkin", "barbeque nation",
      "baskin robbins", "restro", "restaurant", "dhaba", "food court"
    ],
    patterns: [/swiggy/i, /zomato/i, /eats?/i, /rest(?:aurant)?/i, /food/i],
    categoryName: "Food",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Groceries ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "blinkit", "zepto", "instamart", "bigbasket", "bb daily", "dmart",
      "nature basket", "reliance fresh", "reliance retail", "more retail", "spencer",
      "spar", "supermarket", "hypermarket", "kirana", "provision", "veggies", "fruits"
    ],
    patterns: [/blinkit/i, /zepto/i, /instamart/i, /bigbasket/i, /grocer/i, /supermarket/i],
    categoryName: "Groceries",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    keywords: [
      "amazon", "amzn", "flipkart", "myntra", "ajio", "nykaa", "tata cliq",
      "meesho", "zara", "h&m", "hnm", "uniqlo", "decathlon", "lifestyle",
      "shoppers stop", "westside", "pantaloons", "max fashion", "lenskart", "croma", "reliance digital"
    ],
    patterns: [/amzn/i, /amazon/i, /flipkart/i, /myntra/i, /ajio/i, /retail/i, /store/i],
    categoryName: "Shopping",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Transport & Fuel ───────────────────────────────────────────────────────
  {
    keywords: [
      "uber", "ola", "rapido", "blusmart", "irctc", "redbus", "makemytrip",
      "indigo", "air india", "vistara", "spicejet", "metro", "fastag", "toll",
      "hpcl", "bpcl", "iocl", "indian oil", "bharat petroleum", "hindustan petroleum", "shell petrol", "fuel"
    ],
    patterns: [/uber/i, /ola/i, /rapido/i, /petrol/i, /fuel/i, /fastag/i, /toll/i, /rail/i, /flight/i],
    categoryName: "Transport",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Bills & Utilities ──────────────────────────────────────────────────────
  {
    keywords: [
      "bescom", "tneb", "mseb", "electricity", "airtel", "jio", "vodafone", "vi ",
      "tatasky", "tata play", "broadband", "act fibernet", "hathway", "water supply",
      "cylinder", "indane", "hp gas", "bharat gas", "billdesk", "bbps", "cred bill"
    ],
    patterns: [/billdesk/i, /bbps/i, /electricity/i, /broadband/i, /recharge/i, /utility/i],
    categoryName: "Bills",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Entertainment ──────────────────────────────────────────────────────────
  {
    keywords: [
      "netflix", "spotify", "hotstar", "disney", "prime video", "apple.com/bill",
      "google play", "playstore", "bookmyshow", "pvr", "inox", "cinepolis", "youtube premium",
      "playstation", "sony liv", "zee5", "steam"
    ],
    patterns: [/netflix/i, /spotify/i, /hotstar/i, /cinema/i, /theatre/i, /bms/i],
    categoryName: "Entertainment",
    type: "EXPENSE",
    confidence: 0.98,
  },

  // ── Healthcare ─────────────────────────────────────────────────────────────
  {
    keywords: [
      "apollo", "pharmeasy", "1mg", "tata 1mg", "practo", "netmeds", "medplus",
      "hospital", "clinic", "diagnostic", "dr.", "doctor", "pathology", "pharmacy",
      "chemist", "dental", "medicos"
    ],
    patterns: [/pharma/i, /hospital/i, /clinic/i, /medic/i, /health/i],
    categoryName: "Healthcare",
    type: "EXPENSE",
    confidence: 0.95,
  },

  // ── Rent & EMI ─────────────────────────────────────────────────────────────
  {
    keywords: ["rent", "nobroker", "housing", "nestaway", "landlord", "flat rent", "society maintenance"],
    patterns: [/rent/i, /maintenance/i],
    categoryName: "Rent",
    type: "EXPENSE",
    confidence: 0.92,
  },
  {
    keywords: ["emi", "loan repayment", "hdbc loan", "sbi loan", "bajaj finserv", "credit card payment"],
    patterns: [/emi/i, /loan/i, /repay/i],
    categoryName: "EMI",
    type: "EXPENSE",
    confidence: 0.92,
  },

  // ── Income ─────────────────────────────────────────────────────────────────
  {
    keywords: ["salary", "payroll", "stipend", "wages", "remuneration", "employer"],
    patterns: [/salary/i, /payroll/i, /stipend/i],
    categoryName: "Salary",
    type: "INCOME",
    confidence: 0.99,
  },
  {
    keywords: ["dividend", "interest credited", "fd interest", "mutual fund", "zerodha", "groww", "upstox", "kuvera"],
    patterns: [/dividend/i, /interest credit/i, /int\.pd/i, /mf return/i],
    categoryName: "Investment",
    type: "INCOME",
    confidence: 0.95,
  },
  {
    keywords: ["freelance", "upwork", "fiverr", "toptal", "client payment", "consulting fee", "retainer"],
    patterns: [/freelance/i, /consulting/i, /inward/i],
    categoryName: "Freelance",
    type: "INCOME",
    confidence: 0.92,
  },
  {
    keywords: ["invoice", "payout", "razorpay payout", "stripe payout", "sales revenue"],
    patterns: [/payout/i, /merchant settlement/i],
    categoryName: "Business",
    type: "INCOME",
    confidence: 0.90,
  },
];
