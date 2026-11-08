import AuthCard from "@/components/AuthCard";
import { logout } from "@/app/actions/auth";
export default function Suspended() {
  return (
    <AuthCard title="Account suspended">
      <p className="mb-4 text-sm">Your UCme account has been suspended. Please contact the Prefect of Discipline Office if you think this is a mistake.</p>
      <form action={logout}><button className="btn-ghost">Sign out</button></form>
    </AuthCard>
  );
}
