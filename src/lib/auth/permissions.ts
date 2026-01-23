/**
 * Permission helpers for role-based access control.
 *
 * Access Rules:
 * - OWNER/ADMIN can view full profiles of anyone in their organization
 * - MEMBER can view their own full profile
 * - MEMBER can only view basic info for other members
 */

export type Role = "OWNER" | "ADMIN" | "MEMBER";

interface ProfileAccessParams {
  viewerRole?: Role;
  viewerMemberId?: string;
  targetMemberId: string;
}

/**
 * Determines if the viewer can access the full profile of the target member.
 *
 * @returns true if the viewer has full profile access, false for basic view only
 */
export function canViewFullProfile({
  viewerRole,
  viewerMemberId,
  targetMemberId,
}: ProfileAccessParams): boolean {
  // Admins and owners can view any profile in full
  if (viewerRole === "OWNER" || viewerRole === "ADMIN") {
    return true;
  }

  // Members can view their own profile in full
  if (viewerMemberId === targetMemberId) {
    return true;
  }

  // Members viewing others get basic view only
  return false;
}

/**
 * Checks if a user has admin-level access (OWNER or ADMIN role).
 */
export function isAdminOrOwner(role?: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}
