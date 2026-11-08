// Branded email layout. Table-based with inline styles because email clients ignore most modern CSS.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailContent = {
  preheader: string;                          // preview text shown next to the subject in inboxes
  title: string;
  paragraphs: string[];                       // plain text; escaped here
  button?: { label: string; url: string };
  note?: string;                              // small print under the button
};

export function renderEmail({ preheader, title, paragraphs, button, note }: EmailContent) {
  const p = paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#1F2937;">${esc(t)}</p>`).join("");
  const btn = button ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;"><tr>
      <td align="center" bgcolor="#2C5A9D" style="border-radius:6px;">
        <a href="${button.url}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(button.label)}</a>
      </td></tr></table>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#64748B;">Button not working? Copy this link into your browser:<br><a href="${button.url}" style="color:#2C5A9D;word-break:break-all;">${button.url}</a></p>` : "";
  const small = note ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #E2E8F0;font-size:13px;line-height:1.55;color:#64748B;">${esc(note)}</p>` : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F7FB;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FB;"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;font-family:${FONT};">
    <tr><td style="background:#21437D;padding:20px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="38" height="38" align="center" bgcolor="#F0B429" style="border-radius:8px;font-family:${FONT};font-size:20px;font-weight:800;color:#21437D;">U</td>
        <td style="padding-left:12px;font-family:${FONT};"><div style="font-size:20px;font-weight:700;line-height:1;color:#ffffff;">UCme</div>
          <div style="font-size:11px;color:#BFD0EA;margin-top:3px;">Lost &amp; Found Portal</div></td>
      </tr></table></td></tr>
    <tr><td style="background:#F0B429;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td style="padding:32px 28px 28px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#21437D;">${esc(title)}</h1>
      ${p}${btn}${small}
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#94A3B8;text-align:center;">
    You received this email because it was used on UCme, the University of Cebu lost-and-found portal.<br>
    UCme is a prototype and not an official University of Cebu system.
  </td></tr></table>
</td></tr></table>
</body></html>`;

  const text = [title, "", ...paragraphs, ...(button ? ["", `${button.label}: ${button.url}`] : []), ...(note ? ["", note] : []), "", "— UCme, University of Cebu Lost & Found Portal"].join("\n");
  return { html, text };
}
