/**
 * Permission helpers for role-based access control.
 *
 * Role Hierarchy:
 * - OWNER: Full access (organization management, all admin features)
 * - ADMIN: Administrative access (members, imports, constants, reviews)
 * - MANAGER: Team lead access (dashboard, reviews, full profile viewing - no member management)
 * - MEMBER: Standard access (own profile only)
 *
 * Profile Access Rules:
 * - OWNER/ADMIN/MANAGER can view full profiles of anyone in their organization
 * - MEMBER can view their own full profile
 * - MEMBER can only view basic info for other members
 */

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";

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
  // Owners, admins, and managers can view any profile in full
  if (viewerRole === "OWNER" || viewerRole === "ADMIN" || viewerRole === "MANAGER") {
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
 * Note: MANAGER does NOT have admin access - they can't manage members or import data.
 */
export function isAdminOrOwner(role?: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Checks if a user has manager-level access or higher (OWNER, ADMIN, or MANAGER role).
 * Managers can view the manager dashboard and performance reviews.
 */
export function isManagerOrAbove(role?: Role): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
}
