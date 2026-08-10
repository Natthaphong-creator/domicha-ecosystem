export const ownerUserIds = ["1148e8d2-679c-4241-ba67-b522a2b50d8b"];

export function isOwnerUserId(userId?: string | null) {
  return Boolean(userId && ownerUserIds.includes(userId));
}

export function canAccessRole(userId: string | undefined, currentRole: string | undefined, allowedRoles: string[]) {
  if (isOwnerUserId(userId) && allowedRoles.includes("Admin")) {
    return true;
  }

  return Boolean(currentRole && allowedRoles.includes(currentRole));
}
