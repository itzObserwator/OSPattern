import type { BusinessRecord } from "./models";
import type { ExecutiveData } from "./executive";

// Stable IDs preserve links from the original five lead records.
export function sampleSalesLeads(owners: string[]): BusinessRecord[] {
 const titles=["Horizon Labs","Evergreen Digital","Pulse Health","Studio Forma","Summit Ventures"];
 const stages: BusinessRecord["stage"][]=["Negotiation","Proposal Sent","Qualified","Won","Lost"];
 const sources: BusinessRecord["source"][]=["Website","Referrals","Instagram","Facebook","Direct Enquiries"];
 const contacts=["Priya Nair","Rohan Mehta","Ananya Rao","Vikram Singh","Neha Kapoor"];
 return titles.map((title,index)=>{
  const stage=stages[index]!;
  const path: NonNullable<BusinessRecord["stageHistory"]>[number]["stage"][]=["New Lead","Contacted","Qualified",...(stage==="Qualified"?[]:["Proposal Sent" as const]),...(["Negotiation","Won"].includes(stage)?["Negotiation" as const]:[]),...(["Won","Lost"].includes(stage)?[stage]:[])];
  return {id:`lead-${title.toLowerCase().replace(/[^a-z0-9]/g,"-")}-2026-11-05`,kind:"lead",title,owner:owners[index],status:stage==="Won"||stage==="Lost"?"Completed":"Active",date:"2026-10-01",amount:15000+index*5000,progress:0,departmentId:"Sales",stage,source:sources[index],contactName:contacts[index],contactEmail:`contact@${title.toLowerCase().replaceAll(" ","")}.example`,followUpDate:index<3?`2026-11-0${index+3}`:undefined,closedDate:index>=3?`2026-10-${10+path.length*2}`:undefined,stageHistory:path.map((step,position)=>({stage:step,date:position===0?"2026-10-01":`2026-10-${String(10+position*2+2).padStart(2,"0")}`}))};
 });
}
export function withSalesDemo(data:ExecutiveData,records:BusinessRecord[]):ExecutiveData {
 const leads=records.filter(record=>record.kind==="lead");
 if(data.coverage.sales||!leads.length||!leads.every(lead=>lead.id.startsWith("lead-")&&lead.id.endsWith("-2026-11-05")&&lead.stage&&lead.source&&lead.stageHistory?.length))return data;
 return {...data,coverage:{...data.coverage,sales:true}};
}
