import { db } from "./db";
import { sendEmail } from "./email";
import { renderEmail } from "./email-template";
import { appUrl } from "./tokens";

type Item = { userId: string; message: string; email?: boolean };

/**
 * Always creates the in-app notification. When `email` is true it also sends one email per user
 * (grouping their messages), but only to verified, active users who haven't turned alerts off.
 * Email problems are logged and never block the action that triggered them.
 * Messages must contain no private details (reference numbers only).
 */
export async function notify(items: Item[]) {
  if (!items.length) return;
  await db.notification.createMany({ data: items.map(({ userId, message }) => ({ userId, message })) });

  const grouped = new Map<string, string[]>();
  items.filter((i) => i.email).forEach((i) => grouped.set(i.userId, [...(grouped.get(i.userId) ?? []), i.message]));
  if (!grouped.size) return;

  const users = await db.user.findMany({
    where: { id: { in: [...grouped.keys()] }, emailAlerts: true, emailVerified: { not: null }, suspendedAt: null },
    select: { id: true, email: true, firstName: true },
  });
  const results = await Promise.allSettled(users.map((u) => {
    const messages = grouped.get(u.id)!;
    const { html, text } = renderEmail({
      preheader: messages[0], title: messages.length > 1 ? "New updates on your reports" : "Update on your report",
      paragraphs: [`Hi ${u.firstName},`, ...messages],
      button: { label: "Open UCme", url: `${appUrl()}/notifications` },
      note: "You can turn off these email alerts any time in Settings.",
    });
    return sendEmail(u.email, "UCme: update on your report", html, text);
  }));
  results.forEach((r) => r.status === "rejected" && console.error("alert email failed:", r.reason));
}
