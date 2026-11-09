import QRCode from "qrcode";
import Brand from "@/components/Brand";
import PrintButton from "@/components/PrintButton";

export const metadata = { title: "Get UCme on your phone" };

export default async function InstallPoster() {
  const url = process.env.APP_URL ?? "http://localhost:3000";
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 300, errorCorrectionLevel: "M", color: { dark: "#21437D", light: "#FFFFFF" } });
  const step = "mb-1 rounded-md bg-uc-bg p-3 text-sm";
  return (
    <main className="min-h-screen px-4 py-8 print:p-0">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <h1 className="text-3xl font-bold text-uc-dark">Lost something on campus?</h1>
        <p className="mt-1 text-lg text-uc-muted">Get UCme on your phone.</p>
        <div className="mx-auto my-6 w-fit rounded-md border-4 border-uc-gold bg-white p-3" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="font-semibold">Scan with your phone camera</p>
        <p className="mb-6 text-sm text-uc-muted">{url.replace(/^https?:\/\//, "")}</p>
        <div className="grid gap-4 text-left sm:grid-cols-2">
          <div><h2 className="mb-2 font-bold text-uc-dark">iPhone</h2>
            <p className={step}>1. Open the link in <b>Safari</b>.</p><p className={step}>2. Tap <b>Share</b>, then <b>Add to Home Screen</b>.</p><p className={step}>3. Open UCme from your home screen.</p></div>
          <div><h2 className="mb-2 font-bold text-uc-dark">Android</h2>
            <p className={step}>1. Open the link in <b>Chrome</b>.</p><p className={step}>2. Tap the <b>⋮</b> menu, then <b>Install app</b>.</p><p className={step}>3. Open UCme from your home screen.</p></div>
        </div>
        <p className="mt-6 text-xs text-uc-muted">Found an item? Bring it to the Prefect of Discipline Office and report it on UCme.</p>
        <div className="mt-6"><PrintButton /></div>
      </div>
    </main>
  );
}
