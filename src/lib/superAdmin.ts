const SUPER_ADMIN_EMAILS = ["bonoitec04@gmail.com"];

export function isSuperAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
