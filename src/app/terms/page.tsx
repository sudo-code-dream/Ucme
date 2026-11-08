import LegalPage, { Sec } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { DROPOFF_DAYS } from "@/lib/office";

export const metadata = { title: "Terms of Use — UCme" };

export default function Terms() {
  const contact = LEGAL.contactEmail || "[contact email to be confirmed]";
  return (
    <LegalPage title="Terms of Use">
      <Sec title="1. Using UCme">
        <p>UCme is for University of Cebu students, faculty, and staff. By creating an account you agree to these terms and to the Privacy Notice. Give accurate information, keep your password private, and use one account only. You are responsible for what happens under your account.</p>
      </Sec>
      <Sec title="2. Reporting items">
        <ul>
          <li>Report only real items, in good faith, with truthful details.</li>
          <li>Do not put personal information in photos or descriptions, such as faces, ID numbers, or addresses.</li>
          <li><b>Found items must be handed to the Prefect of Discipline Office</b> within {DROPOFF_DAYS} days of your report. Your report is listed only after staff confirm they received the item, and it expires if the item is not brought in. Never keep, sell, or hand over a found item yourself.</li>
        </ul>
      </Sec>
      <Sec title="3. Claiming items">
        <p>Describe the item truthfully. Office staff check your claim and your UC ID in person before releasing anything. Making a false claim is a serious breach of these terms.</p>
      </Sec>
      <Sec title="4. Not allowed">
        <ul>
          <li>False, misleading, or spam reports and claims.</li>
          <li>Harassing others or posting offensive or inappropriate content.</li>
          <li>Trying to see other people&apos;s private information or to get around the portal&apos;s security.</li>
        </ul>
      </Sec>
      <Sec title="5. Moderation">
        <p>Office staff may hide or remove reports, reject claims, and suspend accounts that break these terms. Staff actions are recorded in an audit log. Other users can flag posts for review. A suspended person cannot sign in until staff lift the suspension.</p>
      </Sec>
      <Sec title="6. What UCme does and does not promise">
        <p>UCme helps people connect over lost property. It cannot guarantee that an item will be found or returned, and it does not hold items itself. The Prefect of Discipline Office handles found items. To the extent allowed by law, UCme and its operators are not liable for items that are lost, damaged, or wrongly claimed. The service may change or be unavailable at times.</p>
      </Sec>
      <Sec title="7. Leaving and changes">
        <p>You can delete your account at any time in Settings. We may update these terms and will change the date above when we do. Continuing to use UCme means you accept the updated terms. These terms are governed by the laws of the Republic of the Philippines. [To be confirmed by the university&apos;s legal office.]</p>
      </Sec>
      <Sec title="8. Contact">
        <p>Questions about these terms: {contact}.</p>
      </Sec>
    </LegalPage>
  );
}
