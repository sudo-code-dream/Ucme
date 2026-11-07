import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
export default async function Entry() { redirect((await getUserId()) ? "/dashboard" : "/login"); }
