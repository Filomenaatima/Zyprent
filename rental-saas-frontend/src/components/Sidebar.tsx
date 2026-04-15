"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type IconProps = {
  active?: boolean;
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<IconProps>;
};

function DashboardIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
      <rect x="13" y="3" width="8" height="5" rx="2" fill={active ? "#020617" : "rgba(255,255,255,0.52)"} />
      <rect x="13" y="10" width="8" height="11" rx="2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
      <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? "#020617" : "rgba(255,255,255,0.52)"} />
    </svg>
  );
}

function PortfolioIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V11" stroke={active ? "#020617" : "rgba(255,255,255,0.6)"} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 19V5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19V9" stroke={active ? "#020617" : "rgba(255,255,255,0.6)"} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 19V13" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="3" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" />
      <path d="M16 12H19" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TransactionsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 7H20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 12H20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 17H20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4" cy="7" r="1.2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
      <circle cx="4" cy="12" r="1.2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
      <circle cx="4" cy="17" r="1.2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
    </svg>
  );
}

function MaintenanceIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14.5 5.5a4 4 0 0 0-5 5l-5 5a2 2 0 1 0 3 3l5-5a4 4 0 0 0 5-5l-2.2 2.2-2.5-.5-.5-2.5L14.5 5.5Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" />
      <path d="M3 10H21" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" />
    </svg>
  );
}

function InvestmentIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 18L10 12L14 15L20 8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8H20V12" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfitIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3V21" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7.5C17 5.6 15.2 4 12.8 4H10.8C8.7 4 7 5.3 7 7C7 8.8 8.5 9.7 10.8 10.2L13.2 10.8C15.5 11.3 17 12.2 17 14C17 15.7 15.3 17 13.2 17H11.2C8.8 17 7 15.4 7 13.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NotificationsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 17H18L16.5 15V10C16.5 7.5 14.9 5.4 12.5 4.7V4C12.5 3.4 12.1 3 11.5 3C10.9 3 10.5 3.4 10.5 4V4.7C8.1 5.4 6.5 7.5 6.5 10V15L6 17Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 19C10 20 10.8 20.5 12 20.5C13.2 20.5 14 20 14.5 19" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MessagesIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 18L3 21V6.5C3 5.7 3.7 5 4.5 5H19.5C20.3 5 21 5.7 21 6.5V16.5C21 17.3 20.3 18 19.5 18H7Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H16" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 13H13" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PropertiesIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V9.5L12 4L20 9.5V20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20V14H15V20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UnitsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M4 10H20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M10 4V20" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
    </svg>
  );
}

function ResidentsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M4.5 18c1.1-2.3 2.8-3.5 4.5-3.5s3.4 1.2 4.5 3.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" stroke={active ? "#020617" : "rgba(255,255,255,0.52)"} strokeWidth="1.5" />
      <path d="M14.8 17.2c.7-1.5 1.8-2.3 3.2-2.3 1.1 0 2 .5 2.8 1.7" stroke={active ? "#020617" : "rgba(255,255,255,0.52)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ContractsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="12" height="16" rx="2" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M9 8H15" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 12H15" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 16H13" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function InvoicesIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 4H17V20L14.5 18.4L12 20L9.5 18.4L7 20V4Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 8H14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 12H14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ExpensesIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 7H18" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 12H14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 17H12" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18" cy="17" r="2.2" fill={active ? "#020617" : "rgba(255,255,255,0.72)"} />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" />
      <path d="M5 19c1.8-3 4.2-4.5 7-4.5s5.2 1.5 7 4.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function JobRequestsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M8 9H16" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 13H13" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function QuotesIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 4H17V20L14 18L12 20L10 18L7 20V4Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 9H14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 13H14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ActiveJobsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M12 8V12L15 14" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompletedJobsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M8.5 12.5L10.8 14.8L15.8 9.8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReviewsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4.8L14.1 9.1L18.8 9.8L15.4 13.1L16.2 17.8L12 15.6L7.8 17.8L8.6 13.1L5.2 9.8L9.9 9.1L12 4.8Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <circle cx="17" cy="9" r="2.5" stroke={active ? "#020617" : "rgba(255,255,255,0.52)"} strokeWidth="1.5" />
      <path d="M3.5 18c1.1-2.5 3-3.8 5.5-3.8S13.4 15.5 14.5 18" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14.5 17.4c.8-1.7 2-2.5 3.7-2.5 1.1 0 2.1.4 3 1.5" stroke={active ? "#020617" : "rgba(255,255,255,0.52)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProvidersIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14.5 5.5a4 4 0 0 0-5 5l-4.8 4.8a1.8 1.8 0 1 0 2.5 2.5l4.8-4.8a4 4 0 0 0 5-5l-2.1 2.1-2.4-.5-.5-2.4L14.5 5.5Z" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 14.5L20 17" stroke={active ? "#020617" : "rgba(255,255,255,0.52)"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function VerificationIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M8.5 9H15.5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 13L10.5 15L15.5 10" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 19V10" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 19V5" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 19V13" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 19V8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BillingIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M7 10.5H17" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 14.5H13" stroke={active ? "#020617" : "rgba(255,255,255,0.56)"} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ApprovalsIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.7" />
      <path d="M8.7 12.3L10.8 14.4L15.5 9.7" stroke={active ? "#020617" : "rgba(255,255,255,0.72)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M10 17L15 12L10 7" stroke="rgba(255,255,255,0.72)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H4" stroke="rgba(255,255,255,0.72)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 20V4" stroke="rgba(255,255,255,0.42)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const roleNavItems: Record<AppRole, NavItem[]> = {
  INVESTOR: [
    { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { name: "Wallet", href: "/wallet", icon: WalletIcon },
    { name: "Portfolio", href: "/portfolio", icon: PortfolioIcon },
    { name: "Investments", href: "/investments", icon: InvestmentIcon },
    { name: "Expenses", href: "/expenses", icon: ExpensesIcon },
    { name: "Transactions", href: "/transactions", icon: TransactionsIcon },
    { name: "Profit Center", href: "/profit-center", icon: ProfitIcon },
    { name: "Messages", href: "/messages", icon: MessagesIcon },
    { name: "Notifications", href: "/notifications", icon: NotificationsIcon },
  ],
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { name: "Users", href: "/users", icon: UsersIcon },
    { name: "Properties", href: "/properties", icon: PropertiesIcon },
    { name: "Units", href: "/units", icon: UnitsIcon },
    { name: "Contracts", href: "/contracts", icon: ContractsIcon },
    { name: "Residents", href: "/residents", icon: ResidentsIcon },
    { name: "Invoices", href: "/invoices", icon: InvoicesIcon },
    { name: "Payments", href: "/payments", icon: PaymentsIcon },
    { name: "Expenses", href: "/expenses", icon: ExpensesIcon },
    { name: "Transactions", href: "/transactions", icon: TransactionsIcon },
    { name: "Maintenance", href: "/maintenance", icon: MaintenanceIcon },
    { name: "Providers", href: "/providers", icon: ProvidersIcon },
    { name: "KYC / Verification", href: "/kyc-verification", icon: VerificationIcon },
    { name: "Reports", href: "/reports", icon: ReportsIcon },
    { name: "Subscriptions / Billing", href: "/subscriptions-billing", icon: BillingIcon },
    { name: "Messages", href: "/messages", icon: MessagesIcon },
    { name: "Notifications", href: "/notifications", icon: NotificationsIcon },
    { name: "Investments", href: "/investments", icon: InvestmentIcon },
    { name: "Approvals", href: "/approvals", icon: ApprovalsIcon },
  ],
  MANAGER: [
    { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { name: "Properties", href: "/properties", icon: PropertiesIcon },
    { name: "Units", href: "/units", icon: UnitsIcon },
    { name: "Contracts", href: "/contracts", icon: ContractsIcon },
    { name: "Residents", href: "/residents", icon: ResidentsIcon },
    { name: "Invoices", href: "/invoices", icon: InvoicesIcon },
    { name: "Maintenance", href: "/maintenance", icon: MaintenanceIcon },
    { name: "Payments", href: "/payments", icon: PaymentsIcon },
    { name: "Expenses", href: "/expenses", icon: ExpensesIcon },
    { name: "Transactions", href: "/transactions", icon: TransactionsIcon },
    { name: "Messages", href: "/messages", icon: MessagesIcon },
    { name: "Notifications", href: "/notifications", icon: NotificationsIcon },
  ],
  RESIDENT: [
    { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { name: "Wallet", href: "/wallet", icon: WalletIcon },
    { name: "Payments", href: "/payments", icon: PaymentsIcon },
    { name: "Transactions", href: "/transactions", icon: TransactionsIcon },
    { name: "Maintenance", href: "/maintenance", icon: MaintenanceIcon },
    { name: "Messages", href: "/messages", icon: MessagesIcon },
    { name: "Notifications", href: "/notifications", icon: NotificationsIcon },
  ],
  SERVICE_PROVIDER: [
    { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
    { name: "Job Requests", href: "/job-requests", icon: JobRequestsIcon },
    { name: "Quotes", href: "/quotes", icon: QuotesIcon },
    { name: "Active Jobs", href: "/active-jobs", icon: ActiveJobsIcon },
    { name: "Completed Jobs", href: "/completed-jobs", icon: CompletedJobsIcon },
    { name: "Payouts", href: "/payouts", icon: PaymentsIcon },
    { name: "Reviews", href: "/reviews", icon: ReviewsIcon },
    { name: "Messages", href: "/messages", icon: MessagesIcon },
    { name: "Notifications", href: "/notifications", icon: NotificationsIcon },
  ],
};

const bottomNavItems: NavItem[] = [{ name: "Profile", href: "/profile", icon: ProfileIcon }];

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => {
        const isActive = isPathActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            style={{
              textDecoration: "none",
              color: "#FFFFFF",
              display: "block",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                minWidth: 0,
                padding: "10px 14px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#020617" : "#FFFFFF",
                background: isActive ? "#A7C7E7" : "transparent",
                lineHeight: 1.2,
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon active={isActive} />
              </span>

              <span
                style={{
                  display: "inline-block",
                  transform: "translateY(0.5px)",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {item.name}
              </span>
            </span>
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const role = (user?.role as AppRole) || "INVESTOR";
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const topNavItems = roleNavItems[role] || roleNavItems.INVESTOR;

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100vh",
        background: "#020617",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "24px 18px",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <div style={{ marginBottom: "18px", flexShrink: 0 }}>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              marginBottom: "4px",
            }}
          >
            Welcome back
          </p>

          <h2
            style={{
              fontSize: "22px",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            {displayName}
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.08em",
            }}
          >
            {formatRole(role)}
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flexShrink: 0,
            marginTop: "24px",
          }}
        >
          <NavSection items={topNavItems} pathname={pathname} />
        </nav>

        <div style={{ flex: 1, minHeight: "24px" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flexShrink: 0,
            paddingTop: "12px",
          }}
        >
          <NavSection items={bottomNavItems} pathname={pathname} />

          <button
            onClick={() => {
              localStorage.removeItem("token");
              logout();
              router.push("/login");
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              color: "#FFFFFF",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                minWidth: 0,
                padding: "10px 14px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#FFFFFF",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LogoutIcon />
              </span>

              <span
                style={{
                  display: "inline-block",
                  transform: "translateY(0.5px)",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                Logout
              </span>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}