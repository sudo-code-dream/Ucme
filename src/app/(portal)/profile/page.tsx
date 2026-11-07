import { requireUser, maskUcId } from "@/lib/auth";
import { ProfileForm } from "@/components/AccountForms";

export default async function Profile() {
  const u = await requireUser();
  const info: [string, string][] = [["Name", [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" ")], ["UC ID", maskUcId(u.ucId)], ["Campus", u.campus]];
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="page-title">My Profile</h1>
      <div className="card grid gap-3 p-5 text-sm sm:grid-cols-3">{info.map(([k, v]) => <div key={k}><p className="text-xs text-uc-muted">{k}</p><p className="font-medium">{v}</p></div>)}</div>
      <div className="card p-5"><h2 className="mb-3 font-semibold text-uc-dark">Edit details</h2>
        <p className="mb-3 text-xs text-uc-muted">Name and UC ID can&apos;t be changed here. Your contact details are never shown on public reports.</p>
        <ProfileForm v={{ email: u.email, contact: u.contact, college: u.college, program: u.program, yearLevel: u.yearLevel, section: u.section ?? "" }} /></div>
    </div>
  );
}
