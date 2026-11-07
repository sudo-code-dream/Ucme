import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { maskUcId, requireUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
  return (
    <Shell isAdmin={user.role === "ADMIN"} name={`${user.firstName} ${user.lastName}`} initials={initials} maskedId={maskUcId(user.ucId)} unread={unread}>
      {children}
    </Shell>
  );
}
