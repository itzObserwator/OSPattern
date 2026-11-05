"use client";
import Link from "next/link";
import { ArrowUpRight, Plus, Users } from "lucide-react";
import { useExecutive } from "./executive-provider";
import { useWorkspace } from "./workspace-provider";
import { periodFor, scopeRecords } from "@/lib/executive";
import { salaryBreakdown } from "@/lib/salary";
import { salaryClientOption } from "@/lib/record-options";
import { money } from "@/lib/models";
import { Button } from "../ui/button";

export function SalaryReport(){
 const {records,openCreate}=useWorkspace();const {prefs,data}=useExecutive();
 const period=periodFor(prefs);
 const ids=[salaryClientOption.id,...data.clients.filter(client=>client.name.trim().toLowerCase()==="salary").map(client=>client.id)];
 const salary=salaryBreakdown(scopeRecords(records,{...prefs,client:""}),period,ids);
 const groups=[{key:"direct",label:"Direct salaries",amount:salary.direct,description:"Pay allocated to project delivery"},{key:"indirect",label:"Indirect salaries",amount:salary.indirect,description:"Pay allocated to supporting operations"},{key:"unclassified",label:"Awaiting classification",amount:salary.unclassified,description:"Salary payments with no allocation"}];
 return <section className="finance-salary-report" aria-label="Salary breakdown"><header><div><span className="studio-detail-eyebrow">SALARY · INR</span><h2>Salary overview</h2><p>{period.from} — {period.to} · recorded payments</p></div><Button onClick={()=>openCreate("expense")}><Plus size={15}/>Record salary</Button></header>
 <div className="finance-salary-cards">{groups.map(group=><div key={group.key}><span>{group.label}</span><strong>{money(group.amount)}</strong><p>{group.description}</p><div className="finance-salary-track" aria-hidden="true"><span style={{width:`${salary.total?group.amount/salary.total*100:0}%`}}/></div></div>)}</div>
 <div className="finance-salary-ledger"><header><h3>Salary records</h3><span>Total paid <strong>{money(salary.total)}</strong></span></header>{salary.rows.length?<div className="finance-salary-table"><table><thead><tr><th>Salary / owner</th><th>Allocation</th><th>Project</th><th>Date</th><th>Status</th><th>Amount</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{salary.rows.map(record=><tr key={record.id}><td><strong>{record.title}</strong><small>{record.owner}</small></td><td>{record.salaryAllocation==="direct"?"Direct":record.salaryAllocation==="indirect"?"Indirect":"Unclassified"}</td><td>{records.find(project=>project.id===record.projectId)?.title||"Not linked"}</td><td>{record.date}</td><td>{record.status}</td><td>{money(record.amount)}</td><td><Link href={`/finance?record=${encodeURIComponent(record.id)}`} aria-label={`Edit ${record.title}`}><ArrowUpRight size={16}/></Link></td></tr>)}</tbody></table></div>:<div className="finance-salary-empty"><Users size={27} strokeWidth={1.3}/><h3>No salary records in this period</h3><p>Create an expense with a direct or indirect salary allocation, or categorize an existing expense as Salary.</p><Button onClick={()=>openCreate("expense")}><Plus size={14}/>Add salary expense</Button></div>}</div>
 <p className="finance-salary-note">Totals include paid salary expenses only. Unclassified payments remain separate; employee roles do not determine salary allocation.</p></section>;
}
