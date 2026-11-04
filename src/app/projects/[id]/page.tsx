import { ProjectDetail } from "@/components/business/record-inspector";
export const metadata={title:"Project performance"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProjectDetail id={id}/>;}
