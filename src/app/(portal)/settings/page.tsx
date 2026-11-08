import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { PasswordForm, DeleteAccountForm, AlertsForm } from "@/components/AccountForms";

export default async function Settings() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="page-title">Settings</h1>
      <div className="card p-5"><h2 className="mb-3 font-semibold text-uc-dark">Change password</h2><PasswordForm /></div>
      <div className="card p-5"><h2 className="mb-2 font-semibold text-uc-dark">Notification preferences</h2>
        <p className="mb-3 text-sm text-uc-muted">In-portal notifications are always on.</p><AlertsForm enabled={user.emailAlerts} /></div>
      <div className="card border-l-4 border-l-red-600 p-5"><h2 className="mb-1 font-semibold text-red-700">Delete account</h2>
        <p className="mb-3 text-sm text-uc-muted">Permanently removes your profile, reports, photos, claims, saved items and notifications. This cannot be undone.</p><DeleteAccountForm /></div>
      <div className="card p-5"><h2 className="mb-2 font-semibold text-uc-dark">Session</h2><form action={logout}><button className="btn-ghost">Logout</button></form></div>
    </div>
  );
}
