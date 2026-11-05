import {LeadDetail} from "@/components/business/lead-detail";
export const metadata={title:"Lead details"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <LeadDetail id={id}/>;}
