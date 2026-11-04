import { notFound } from "next/navigation";
import { modules } from "@/lib/navigation";
import { ModulePage } from "@/components/business/module-page";

export function generateStaticParams() { return modules.filter(m=>m.slug).map(m=>({module:m.slug})); }
export async function generateMetadata({params}: {params: Promise<{module:string}>}) {
  const {module}=await params;
  return {title:modules.find(m=>m.slug===module)?.label ?? "Not found"};
}
export default async function Page({params}: {params: Promise<{module:string}>}) {
  const {module}=await params;
  if(!modules.some(m=>m.slug===module)) notFound();
  return <ModulePage slug={module}/>;
}
