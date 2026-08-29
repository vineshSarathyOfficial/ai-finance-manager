import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  RotateCcw,
  MoreHorizontal,
  UploadCloud,
  Tag,
  Settings,
  Lightbulb,
  Wallet,
  CreditCard,
  Target,
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
  { href: "/analytics", label: "Analytics", mobileLabel: "Analyse", icon: BarChart3, mobileTab: true },
  { href: "/subscriptions", label: "Recurring", mobileLabel: "Recurring", icon: RotateCcw, mobileTab: true },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/insights", label: "Insights", icon: Lightbulb, moreMenu: true },
  { href: "/accounts", label: "Accounts", icon: Wallet, moreMenu: true },
  { href: "/credit-cards", label: "Credit Cards", icon: CreditCard, moreMenu: true },
  { href: "/budgets", label: "Budgets", icon: Target, moreMenu: true },
  { href: "/import", label: "Import Statement", icon: UploadCloud, moreMenu: true },
  { href: "/categories", label: "Categories", icon: Tag, moreMenu: true },
  { href: "/settings", label: "Settings", icon: Settings, moreMenu: true },
];

export const allNavItems = [...primaryNavItems, ...secondaryNavItems];

export const mobileTabItems = primaryNavItems.filter((item) => item.mobileTab);

export const moreMenuItems = secondaryNavItems.filter((item) => item.moreMenu);
