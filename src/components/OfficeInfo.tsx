import { CalendarClock, Clock, MapPin } from "lucide-react";
import { DROPOFF_DAYS, OFFICE_HOURS, OFFICE_LOCATION, OFFICE_NAME } from "@/lib/office";

export default function OfficeInfo({ deadline, className = "" }: { deadline?: Date; className?: string }) {
  return (
    <div className={`rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 ${className}`}>
      <p><b>Drop-off required.</b> Bring the item to the {OFFICE_NAME} within {DROPOFF_DAYS} days. Your report is listed publicly once staff confirm receipt.</p>
      <ul className="mt-2 space-y-1">
        {OFFICE_LOCATION && <li className="flex items-center gap-2"><MapPin size={14} />{OFFICE_LOCATION}</li>}
        {OFFICE_HOURS && <li className="flex items-center gap-2"><Clock size={14} />{OFFICE_HOURS}</li>}
        {deadline && <li className="flex items-center gap-2 font-semibold"><CalendarClock size={14} />Drop off by {deadline.toLocaleDateString("en-PH", { dateStyle: "long" })}</li>}
      </ul>
    </div>
  );
}
