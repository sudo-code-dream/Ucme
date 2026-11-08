import LegalPage, { Sec } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Privacy Notice — UCme" };

export default function Privacy() {
  const operator = LEGAL.operator || "[operator to be confirmed]";
  const contact = LEGAL.contactEmail || "[contact email to be confirmed]";
  return (
    <LegalPage title="Privacy Notice">
      <Sec title="1. About UCme">
        <p>UCme is a lost-and-found portal for the University of Cebu community. It is operated by {operator}. UCme is currently a prototype and is not an official University of Cebu system unless the university states otherwise. This notice explains what personal information we handle and why, in line with the Data Privacy Act of 2012 (Republic Act No. 10173).</p>
      </Sec>
      <Sec title="2. What we collect">
        <ul>
          <li><b>Account:</b> UC ID number (checked for format only, not verified against university records), name, email, contact number, campus, college or department, program, year level, section, and your password (stored only as a one-way hash, never in readable form).</li>
          <li><b>Reports:</b> item name, category, location, date and time, description, distinctive features (kept private), an optional photo, and a reference number.</li>
          <li><b>Claims:</b> the ownership details you submit when claiming an item. Only office staff can see them.</li>
          <li><b>Activity:</b> notifications, saved items, reports you flag, and failed login attempts (UC ID and time) used to block password guessing.</li>
          <li><b>Device and sign-in:</b> one essential session cookie that keeps you signed in, and, only if you turn on push notifications, a device address used to deliver them.</li>
          <li><b>Staff actions:</b> an audit log of actions taken by office staff, such as hiding a report or approving a claim.</li>
        </ul>
      </Sec>
      <Sec title="3. Why we use it">
        <ul>
          <li>To run the portal: list lost and found items, suggest possible matches, and return items to their owners.</li>
          <li>To verify ownership: office staff compare your claim with the finder&apos;s record and check your UC ID in person.</li>
          <li>To contact you about your reports by in-app notification, email, and push notification.</li>
          <li>To keep the service safe: prevent abuse, review flagged posts, and suspend accounts that break the rules.</li>
        </ul>
      </Sec>
      <Sec title="4. Who can see what">
        <p><b>Everyone signed in</b> can see a public report&apos;s item name, category, location, date, description, photo, and reference number. Please do not include faces, ID numbers, or other personal details in photos or descriptions.</p>
        <p><b>Never shown publicly:</b> your full UC ID, email, contact number, a report&apos;s distinctive features, and claim answers.</p>
        <p><b>Office staff</b> can see more to do their work: finder and claimant names with a partly hidden UC ID, a report&apos;s distinctive features, and claim answers.</p>
      </Sec>
      <Sec title="5. Service providers">
        <p>We use outside services to run UCme: Vercel (hosting), Neon (database), Cloudinary (photo storage), Resend (email delivery), and your device or browser maker&apos;s push service (push notifications). Some of these may process data outside the Philippines. [Details of any cross-border transfer arrangements to be confirmed by the university.]</p>
        <p>We do not sell your information and we do not use advertising or analytics cookies.</p>
      </Sec>
      <Sec title="6. How long we keep it">
        <p>We keep your account information while your account exists. Reports stay until you or staff delete them. Items that were handed to the Prefect of Discipline Office may be kept in the office&apos;s records after they are resolved. [A fixed retention schedule has not yet been set and is to be confirmed by the university.]</p>
      </Sec>
      <Sec title="7. Your rights">
        <p>Under the Data Privacy Act you have the right to be informed, to access your data, to object to its processing, to correct it, to ask for it to be erased or blocked, to data portability, and to claim damages if you are harmed by misuse. You may also complain to the National Privacy Commission (privacy.gov.ph).</p>
        <p>You can edit your contact and university details on your Profile page and delete your account, with your reports and photos, from Settings. For any other request, contact {contact}.</p>
      </Sec>
      <Sec title="8. Security">
        <p>We use hashed passwords, encrypted connections, access checks on every action, and limits on who can see private fields. No system is perfectly secure. If a breach affects your data, we will notify you and the authorities as the law requires.</p>
      </Sec>
      <Sec title="9. Changes and contact">
        <p>We may update this notice and will change the date above when we do. Questions or requests: {contact}.</p>
      </Sec>
    </LegalPage>
  );
}
