import AuthCard from "@/components/AuthCard";
import { ResetForm } from "@/components/RecoveryForms";
export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  return <AuthCard title="Choose a new password"><ResetForm token={searchParams.token ?? ""} /></AuthCard>;
}
