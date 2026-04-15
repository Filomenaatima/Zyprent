export type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

export const ALL_ROLES: AppRole[] = [
  "ADMIN",
  "MANAGER",
  "INVESTOR",
  "RESIDENT",
  "SERVICE_PROVIDER",
];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  INVESTOR: "Investor",
  RESIDENT: "Resident",
  SERVICE_PROVIDER: "Service Provider",
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    value === "ADMIN" ||
    value === "MANAGER" ||
    value === "INVESTOR" ||
    value === "RESIDENT" ||
    value === "SERVICE_PROVIDER"
  );
}