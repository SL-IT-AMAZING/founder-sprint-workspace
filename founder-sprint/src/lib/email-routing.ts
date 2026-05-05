type RecipientLike = {
  email: string;
  notificationEmail?: string | null;
};

export function getRecipientEmail(user: RecipientLike): string {
  return user.notificationEmail?.trim() || user.email;
}
