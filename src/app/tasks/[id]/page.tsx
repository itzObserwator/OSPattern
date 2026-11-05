import { WorkDetail } from "@/components/business/work-detail";
export const metadata={title:"Work details"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <WorkDetail id={id}/>;}
