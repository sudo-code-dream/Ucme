import ReportForm from "@/components/ReportForm";
export default function Page() {
  return (
    <div className="max-w-3xl space-y-4">
      <div><h1 className="page-title">Report Found Item</h1>
        <p className="text-sm text-uc-muted">Public details are limited. Contact info and distinctive features are never shown publicly.</p></div>
      <ReportForm type="FOUND" />
    </div>
  );
}
