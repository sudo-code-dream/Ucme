import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";

export default async function VerifyEmail({ searchParams }: { searchParams: { token?: string } }) {
  const userId = await consumeToken(searchParams.token ?? "", "VERIFY_EMAIL");
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  return (
    <AuthCard title={userId ? "Email verified" : "Link not valid"}>
      <p className="mb-4 text-sm">{userId ? "Thank you. Your email is verified and you can now submit reports and claims." : "This link is invalid or has expired. Sign in and use the banner to request a new one."}</p>
      <Link href={userId ? "/dashboard" : "/login"} className="btn">{userId ? "Go to dashboard" : "Sign in"}</Link>
    </AuthCard>
  );
}
