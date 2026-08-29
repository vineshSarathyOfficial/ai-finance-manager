import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  RotateCcw,
  UploadCloud,
  Tag,
  Settings,
  Lightbulb,
  Wallet,
  CreditCard,
  Target,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  mobileTab?: boolean;
  moreMenu?: boolean;
}

export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard, mobileTab: true },
  { href: "/transactions", label: "Transactions", mobileLabel: "Txns", icon: ArrowLeftRight, mobileTab: true },
  { href: "/insights", label: "Insights", mobileLabel: "Insights", icon: Lightbulb, mobileTab: true },
  { href: "/subscriptions", label: "Recurring", mobileLabel: "Recurring", icon: RotateCcw, mobileTab: true },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: BarChart3, moreMenu: true },
  { href: "/accounts", label: "Accounts", icon: Wallet, moreMenu: true },
  { href: "/credit-cards", label: "Credit Cards", icon: CreditCard, moreMenu: true },
  { href: "/budgets", label: "Budgets", icon: Target, moreMenu: true },
  { href: "/goals", label: "Savings Goals", icon: PiggyBank, moreMenu: true },
  { href: "/import", label: "Import Statement", icon: UploadCloud, moreMenu: true },
  { href: "/categories", label: "Categories", icon: Tag, moreMenu: true },
  { href: "/settings", label: "Settings", icon: Settings, moreMenu: true },
];

export const allNavItems = [...primaryNavItems, ...secondaryNavItems];

export const mobileTabItems = primaryNavItems.filter((item) => item.mobileTab);

export const moreMenuItems = secondaryNavItems.filter((item) => item.moreMenu);

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/subscriptions": "Recurring",
  "/insights": "Insights",
  "/accounts": "Accounts",
  "/credit-cards": "Credit Cards",
  "/budgets": "Budgets",
  "/goals": "Savings Goals",
  "/import": "Import",
  "/categories": "Categories",
  "/settings": "Settings",
};

export function getPageTitle(pathname: string): string {
  return (
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    allNavItems.find((item) => pathname.startsWith(item.href))?.label ??
    "FinPulse"
  );
}
