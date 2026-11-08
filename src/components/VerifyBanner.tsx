import { ResendButton } from "./RecoveryForms";
export default function VerifyBanner({ email }: { email: string }) {
  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p><b>Verify your email.</b> We sent a link to {email}. You need to verify it before you can submit reports or claims.</p>
      <div className="mt-1"><ResendButton /></div>
    </div>
  );
}
