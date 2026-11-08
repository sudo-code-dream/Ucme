/** Sends through Resend's REST API. In development without a key, the email is printed to the terminal instead. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Email is not configured");
    console.log(
      `\n[dev email] to=${to}\nsubject=${subject}\n${text ?? html}\n`,
    );
    return; // plain-text version is easier to read in a terminal
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "UCme <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) throw new Error("Email failed to send");
}
