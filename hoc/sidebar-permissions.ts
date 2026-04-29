// lib/sidebar-permissions.ts
import { User } from "./user";

export function hasPermission(
  user: User,
  key: keyof User["user_roles"]
) {
  return user?.user_roles?.[key] === "yes";
}

export function canAccess(
  user: User,
  item: {
    permission?: keyof User["user_roles"];
    creatorOnly?: boolean;
  }
) {
  if (!user) return false;

  if (item.creatorOnly && user.creator !== "Host") return false;

  if (item.permission && !hasPermission(user, item.permission)) return false;

  return true;
}