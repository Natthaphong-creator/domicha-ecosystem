export const ownerUserIds = ["1148e8d2-679c-4241-ba67-b522a2b50d8b"];

const roleAliases: Record<string, string> = {
  Sales: "Manager",
  Accountant: "Executive"
};

const rolePower: Record<string, string[]> = {
  Admin: ["Admin", "Executive", "Manager", "AssistantManager", "Sales", "Accountant"],
  Executive: ["Executive", "Accountant"],
  Manager: ["Manager", "AssistantManager", "Sales"],
  AssistantManager: ["AssistantManager"],
  Franchisee: ["Franchisee"]
};

export function isOwnerUserId(userId?: string | null) {
  return Boolean(userId && ownerUserIds.includes(userId));
}

export function normalizeRole(role?: string | null) {
  if (!role) return "";
  return roleAliases[role] || role;
}

export function canAccessRole(userId: string | undefined, currentRole: string | undefined, allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (isOwnerUserId(userId) && normalizedAllowed.includes("Admin")) {
    return true;
  }

  const normalizedRole = normalizeRole(currentRole);
  const grants = rolePower[normalizedRole] || [];

  return grants.some((role) => normalizedAllowed.includes(normalizeRole(role)));
}
