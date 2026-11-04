import { z } from "zod";
import type { BusinessRecord } from "./models";

const id = z.string().min(1), amount = z.number().finite().nonnegative(), date = z.iso.date();
const base = { id, departmentId: id.optional(), projectId: id.optional(), clientId: id.optional() };
export const stages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"] as const;
export const widgets = ["workspace", "metrics", "attention", "trends", "operations", "briefing", "assistant"] as const;
export type Widget = typeof widgets[number];
export const kpiNames = ["cashIn", "cashOut", "cashNet", "earned", "incurred", "profit", "margin", "outstanding", "budget", "balance", "breakEven"] as const;
export const executiveSchema = z.object({
  clients: z.array(z.object({ id, name: z.string().trim().min(2) })).default([]),
  departments: z.array(z.object({ id, name:z.string().trim().min(2) })).default([]),
  ledger: z.array(z.object({ ...base, date, kind: z.enum(["revenue", "expense"]), amount, category: z.string().min(1), campaignId: id.optional(), allocation: z.enum(["direct", "indirect"]).optional(), costType: z.enum(["fixed", "variable"]).optional() })).default([]),
  invoices: z.array(z.object({ ...base, number: z.string().min(1), issued: date, due: date, amount, owner: z.string().min(1), payments: z.array(z.object({ id, date, amount })) })).default([]),
  budgets: z.array(z.object({ ...base, start: date, end: date, amount })).default([]),
  balances: z.array(z.object({ id, name: z.string().min(1), date, amount:z.number().finite() })).default([]),
  attendance: z.array(z.object({ id, employeeId: id, date, status: z.enum(["Present", "Absent", "Leave"]) })).default([]),
  timesheets: z.array(z.object({ id, employeeId: id, projectId: id.optional(), date, hours: amount, overtime: amount })).default([]),
  campaigns: z.array(z.object({ ...base, title: z.string().min(2), start: date, end: date, status: z.enum(["Active", "Completed", "Planned"]) })).default([]),
  approvals: z.array(z.object({ ...base, type: z.enum(["Leave", "Financial", "Marketing", "Escalation"]), title: z.string().trim().min(2), owner: z.string().trim().min(2), due: date, status: z.enum(["Pending", "Approved", "Rejected"]), amount: amount.optional(), employeeId: id.optional(), leaveStart:date.optional(), leaveEnd:date.optional(), severity: z.enum(["High", "Medium", "Low"]), decidedAt: z.iso.datetime().optional() })).default([]),
  goals: z.array(z.object({ id, metric: z.enum(["cashIn", "earned", "margin", "conversion", "delivery", "utilization", "roas"]), target: z.number().finite().positive(), start: date, deadline: date })).default([]),
  events: z.array(z.object({ ...base, title: z.string().min(2), date, type: z.enum(["Meeting", "Launch", "Milestone", "Approval"]), owner: z.string().min(1), priority: z.enum(["High", "Medium", "Low"]) })).default([]),
  coverage: z.object({ accounting: z.boolean(), invoices: z.boolean(), budgets: z.boolean(), balances: z.boolean(), attendance: z.boolean(), timesheets: z.boolean(), marketing: z.boolean(), sales: z.boolean() }).default({ accounting:false, invoices:false, budgets:false, balances:false, attendance:false, timesheets:false, marketing:false, sales:false }),
});
export type ExecutiveData = z.infer<typeof executiveSchema>;
export const emptyExecutive = (): ExecutiveData => executiveSchema.parse({});
export const preferenceSchema = z.object({
  order: z.array(z.enum(widgets)).length(widgets.length).refine(a => new Set(a).size === widgets.length),
  hidden: z.array(z.enum(widgets)), kpis: z.array(z.enum(kpiNames)).min(1),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), range: z.enum(["month", "quarter", "six"]),
  department: z.string(), project: z.string(), client: z.string(), comparison: z.enum(["previous", "year"]),
  under: z.number().min(0).max(100), over: z.number().min(1).max(200), deadlineDays: z.number().int().min(1).max(30), riskProgress: z.number().min(0).max(100),
}).refine(p => p.under < p.over, { message:"Balanced range must end above its lower threshold" });
export type Preferences = z.infer<typeof preferenceSchema>;
export const defaultPreferences: Preferences = { order:["metrics","attention","trends","workspace","operations","briefing","assistant"], hidden:[], kpis:["cashIn","cashOut","cashNet","outstanding"], month:"2026-10", range:"month", department:"", project:"", client:"", comparison:"previous", under:60, over:100, deadlineDays:7, riskProgress:80 };
export type Period = { from: string; to: string };
export function periodFor(p: Pick<Preferences,"month"|"range">): Period {
  const [y,m] = p.month.split("-").map(Number); const months=p.range==="six"?6:p.range==="quarter"?3:1;
  return { from:new Date(Date.UTC(y,m-months,1)).toISOString().slice(0,10), to:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10) };
}
export function comparePeriod(p: Period, mode: Preferences["comparison"]): Period {
  if(mode==="year") { const shift=(s:string)=>{const d=new Date(s+"T12:00:00Z"); const day=d.getUTCDate(); d.setUTCDate(1); d.setUTCFullYear(d.getUTCFullYear()-1); const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(); d.setUTCDate(Math.min(day,last)); return d.toISOString().slice(0,10);}; return {from:shift(p.from),to:shift(p.to)}; }
  const days=(Date.parse(p.to)-Date.parse(p.from))/86400000+1;
  return {from:new Date(Date.parse(p.from)-days*86400000).toISOString().slice(0,10),to:new Date(Date.parse(p.from)-86400000).toISOString().slice(0,10)};
}
export const within=(d:string,p:Period)=>d>=p.from&&d<=p.to;
const sum=<T,>(xs:T[],f:(x:T)=>number)=>xs.reduce((n,x)=>n+f(x),0);
export function scopeRecords(records: BusinessRecord[], prefs: Preferences) {
  const projects = new Set(records.filter(r=>r.kind==="project"&&(!prefs.project||r.id===prefs.project)&&(!prefs.department||r.departmentId===prefs.department)&&(!prefs.client||r.clientId===prefs.client)).map(r=>r.id));
  const scopedTasks=records.filter(r=>r.kind==="task"&&!!r.projectId&&projects.has(r.projectId));
  const assignedEmployees=new Set(scopedTasks.flatMap(t=>t.employeeId?[t.employeeId]:records.filter(r=>r.kind==="employee"&&r.title===t.owner).map(r=>r.id)));
  return records.filter(r => {
    if(r.kind==="employee"&&(prefs.project||prefs.client))return assignedEmployees.has(r.id)&&(!prefs.department||r.departmentId===prefs.department);
    return (!prefs.department||r.departmentId===prefs.department||(!!r.projectId&&projects.has(r.projectId)))&&(!prefs.project||(r.kind==="project"?r.id===prefs.project:r.projectId===prefs.project))&&(!prefs.client||r.clientId===prefs.client||(!!r.projectId&&projects.has(r.projectId)));
  });
}
export function scopeData(data: ExecutiveData, prefs: Preferences, records: BusinessRecord[]): ExecutiveData {
  const projectIds=new Set(scopeRecords(records,prefs).filter(r=>r.kind==="project").map(r=>r.id));
  const match=(x:{departmentId?:string;projectId?:string;clientId?:string})=>(!prefs.department||x.departmentId===prefs.department||!!x.projectId&&projectIds.has(x.projectId))&&(!prefs.project||x.projectId===prefs.project)&&(!prefs.client||x.clientId===prefs.client||!!x.projectId&&projectIds.has(x.projectId));
  const employeeIds=new Set(scopeRecords(records,prefs).filter(r=>r.kind==="employee").map(r=>r.id));
  return {...data,ledger:data.ledger.filter(match),invoices:data.invoices.filter(match),budgets:data.budgets.filter(match),balances:prefs.department||prefs.project||prefs.client?[]:data.balances,attendance:data.attendance.filter(x=>employeeIds.has(x.employeeId)),timesheets:data.timesheets.filter(x=>prefs.project?x.projectId===prefs.project:employeeIds.has(x.employeeId)&&(!prefs.client||!!x.projectId&&projectIds.has(x.projectId))),campaigns:data.campaigns.filter(match),approvals:data.approvals.filter(match),events:data.events.filter(match)};
}
export function financialIntelligence(records: BusinessRecord[], data:ExecutiveData, period:Period, today:string) {
  const paid=records.filter(r=>r.status==="Paid"&&within(r.date,period));
  const cashIn=sum(paid.filter(r=>r.kind==="invoice"),r=>r.amount),cashOut=sum(paid.filter(r=>r.kind==="expense"),r=>r.amount);
  const ledger=data.ledger.filter(r=>within(r.date,period));
  const earned=data.coverage.accounting?sum(ledger.filter(r=>r.kind==="revenue"),r=>r.amount):null;
  const incurred=data.coverage.accounting?sum(ledger.filter(r=>r.kind==="expense"),r=>r.amount):null;
  const profit=earned!==null&&incurred!==null?earned-incurred:null;
  const margin=earned!==null&&earned>0&&profit!==null?profit/earned*100:null;
  // Balances and aging are snapshots at the selected period end, not all-time totals.
  const balances=data.invoices.filter(i=>i.issued<=period.to).map(i=>({...i,balance:Math.max(0,i.amount-sum(i.payments.filter(p=>p.date<=period.to),p=>p.amount)),days:Math.max(0,Math.floor((Date.parse(period.to)-Date.parse(i.due))/86400000))}));
  const outstanding=data.coverage.invoices?sum(balances,i=>i.balance):null;
  const approved=data.budgets.filter(b=>b.start===period.from&&b.end===period.to);
  const globalBudget=approved.filter(b=>!b.projectId&&!b.departmentId&&!b.clientId);
  const departmentBudgets=approved.filter(b=>!b.projectId&&b.departmentId);
  const selectedBudgets=globalBudget.length?globalBudget:approved.filter(b=>!b.projectId||!departmentBudgets.some(db=>db.departmentId===records.find(r=>r.id===b.projectId)?.departmentId));
  const budgetAmount=sum(selectedBudgets,b=>b.amount);
  const matchedExpenses=ledger.filter(l=>l.kind==="expense"&&selectedBudgets.some(b=>(!b.projectId||l.projectId===b.projectId)&&(!b.clientId||l.clientId===b.clientId)&&(!b.departmentId||l.departmentId===b.departmentId||records.find(r=>r.id===l.projectId)?.departmentId===b.departmentId)));
  const budgetActual=data.coverage.budgets&&data.coverage.accounting&&budgetAmount>0?sum(matchedExpenses,l=>l.amount):null;
  const budget=budgetActual!==null?budgetActual/budgetAmount*100:null;
  const fixed=sum(ledger.filter(l=>l.kind==="expense"&&l.costType==="fixed"),l=>l.amount),variable=sum(ledger.filter(l=>l.kind==="expense"&&l.costType==="variable"),l=>l.amount);
  const costClassified=ledger.filter(l=>l.kind==="expense").every(l=>!!l.costType);
  const ratio=earned&&earned>0?(earned-variable)/earned:0;
  const breakEven=data.coverage.accounting&&costClassified&&ratio>0?fixed/ratio:null;
  const latest=Object.values(data.balances.filter(b=>b.date<=period.to).reduce<Record<string,ExecutiveData["balances"][number]>>((map,b)=>{if(!map[b.name]||b.date>map[b.name].date)map[b.name]=b;return map;},{}));
  const balance=data.coverage.balances&&latest.length?sum(latest,b=>b.amount):null;
  return {cashIn,cashOut,cashNet:cashIn-cashOut,earned,incurred,profit,margin,outstanding,budget,budgetAmount,budgetActual,balance,breakEven,balances,overdue:balances.filter(i=>i.balance>0&&i.due<today),issued:data.coverage.invoices?sum(data.invoices.filter(i=>within(i.issued,period)),i=>i.amount):null};
}
export function projectPerformance(records:BusinessRecord[],data:ExecutiveData,today:string,prefs:Preferences) {
 return records.filter(r=>r.kind==="project").map(project=>{
  const tasks=records.filter(t=>t.kind==="task"&&t.projectId===project.id), open=tasks.filter(t=>t.status!=="Completed");
  const status=project.status==="Completed"?"Completed":project.status==="Delayed"||project.date<today||open.some(t=>t.status==="Delayed"||t.date<today)?"Delayed":open.some(t=>t.blocker||t.status==="At risk")||project.status==="At risk"||((Date.parse(project.date)-Date.parse(today))/86400000<=prefs.deadlineDays&&project.progress<prefs.riskProgress)?"At risk":"On track";
  const entries=data.ledger.filter(l=>l.projectId===project.id&&l.date<=today);
  const revenue=data.coverage.accounting?sum(entries.filter(l=>l.kind==="revenue"),l=>l.amount):null;
  const expenses=entries.filter(l=>l.kind==="expense"); const direct=data.coverage.accounting?sum(expenses.filter(l=>l.allocation==="direct"),l=>l.amount):null;
  const indirect=data.coverage.accounting?sum(expenses.filter(l=>l.allocation==="indirect"),l=>l.amount):null;
  const classified=expenses.every(l=>!!l.allocation);
  const profit=revenue!==null&&direct!==null&&indirect!==null&&classified?revenue-direct-indirect:null;
  const approvedBudget=data.budgets.find(b=>b.projectId===project.id&&b.start<=today&&b.end>=today);
  const budget=approvedBudget?.amount??null;
  return {project,tasks,open,status,revenue,direct,indirect,profit,margin:revenue&&profit!==null?profit/revenue*100:null,budget,overBudget:budget!==null&&!!approvedBudget&&sum(expenses.filter(l=>l.date>=approvedBudget.start&&l.date<=approvedBudget.end),l=>l.amount)>budget,members:[...new Set(tasks.map(t=>t.employeeId||t.owner))]};
 });
}
export function workforceIntelligence(records:BusinessRecord[],data:ExecutiveData,today:string,prefs:Preferences) {
 const start=new Date(Date.parse(today)-((new Date(today).getUTCDay()+6)%7)*86400000).toISOString().slice(0,10);
 const people=records.filter(r=>r.kind==="employee"&&r.status==="Active").map(person=>{
  const tasks=records.filter(t=>t.kind==="task"&&t.status!=="Completed"&&(t.employeeId?t.employeeId===person.id:t.owner===person.title));
  const known=person.weeklyCapacityHours!==undefined&&tasks.every(t=>t.estimatedHours!==undefined);
  const hours=sum(tasks,t=>t.estimatedHours??0),utilization=known?hours/person.weeklyCapacityHours!*100:null;
  return {person,tasks,hours,utilization,status:utilization===null?"Unknown":utilization<prefs.under?"Underutilized":utilization>prefs.over?"Overloaded":"Balanced"};
 });
 const attendance=data.attendance.filter(a=>a.date===today&&people.some(p=>p.person.id===a.employeeId));
 const approvedLeave=data.approvals.filter(a=>a.type==="Leave"&&a.status==="Approved"&&a.employeeId&&a.leaveStart&&a.leaveEnd&&a.leaveStart<=today&&a.leaveEnd>=today&&people.some(p=>p.person.id===a.employeeId)&&!attendance.some(r=>r.employeeId===a.employeeId));
 const leaveCount=new Set([...attendance.filter(a=>a.status==="Leave").map(a=>a.employeeId),...approvedLeave.map(a=>a.employeeId!)]).size;
 const allKnown=people.length>0&&people.every(p=>p.utilization!==null);
 return {people,total:people.length,unreported:data.coverage.attendance?people.length-attendance.length:null,unassigned:people.filter(p=>!p.tasks.length).length,available:allKnown?people.filter(p=>p.utilization!<100).length:null,utilization:allKnown?sum(people,p=>p.hours)/sum(people,p=>p.person.weeklyCapacityHours!)*100:null,overloaded:allKnown?people.filter(p=>p.status==="Overloaded").length:null,present:data.coverage.attendance?attendance.filter(a=>a.status==="Present").length:null,leave:data.coverage.attendance||approvedLeave.length?leaveCount:null,absent:data.coverage.attendance?attendance.filter(a=>a.status==="Absent").length:null,overtime:data.coverage.timesheets?sum(data.timesheets.filter(t=>t.date>=start&&t.date<=today),t=>t.overtime):null};
}
export function salesIntelligence(records:BusinessRecord[],data:ExecutiveData,period:Period) {
 const cohort=records.filter(r=>r.kind==="lead"&&within(r.date,period)).map(r=>{
  const historical=r.stageHistory?.filter(h=>h.date<=period.to).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const stage=historical?.stage??(r.closedDate&&r.closedDate<=period.to&&(r.stage==="Won"||r.stage==="Lost")?r.stage:undefined);
  return {...r,stage:stage as BusinessRecord["stage"]};
 });
 const known=cohort.every(l=>!!l.stage)&&data.coverage.sales;
 const won=cohort.filter(l=>l.stage==="Won"),lost=cohort.filter(l=>l.stage==="Lost");
 const stagesData=stages.map(stage=>({stage,count:cohort.filter(l=>l.stage===stage).length,value:sum(cohort.filter(l=>l.stage===stage),l=>l.amount)}));
 const reached=stages.slice(0,5).map(stage=>({stage,count:cohort.filter(l=>l.stage===stage||l.stageHistory?.some(h=>h.stage===stage&&h.date<=period.to)).length}));
 const historyComplete=cohort.length>0&&cohort.every(l=>l.stageHistory?.some(h=>h.stage==="New Lead"&&h.date<=period.to));
 const transitions=stages.slice(1,5).map((stage,index)=>{
  const prior=stages[index];const eligible=cohort.filter(l=>l.stageHistory?.some(h=>h.stage===prior&&h.date<=period.to));
  const advanced=eligible.filter(l=>{const started=l.stageHistory!.filter(h=>h.stage===prior&&h.date<=period.to).sort((a,b)=>a.date.localeCompare(b.date))[0].date;return l.stageHistory?.some(h=>h.stage===stage&&h.date>=started&&h.date<=period.to);}).length;
  return {from:prior,to:stage,conversion:eligible.length?advanced/eligible.length*100:null,dropOff:eligible.length?(1-advanced/eligible.length)*100:null};
 });
 return {cohort,total:records.filter(r=>r.kind==="lead").length,newLeads:cohort.length,qualified:known?cohort.filter(l=>["Qualified","Proposal Sent","Negotiation"].includes(l.stage!)).length:null,active:known?cohort.filter(l=>l.stage!=="Won"&&l.stage!=="Lost").length:null,won:known?won.length:null,lost:known?lost.length:null,pipeline:sum(cohort.filter(l=>l.stage!=="Won"&&l.stage!=="Lost"),l=>l.amount),conversion:known&&cohort.length?won.length/cohort.length*100:null,stages:stagesData,reached,transitions,historyComplete,known};
}
export type Attention = {id:string;type:string;title:string;severity:"High"|"Medium"|"Low";owner:string;due:string;href:string;action:string;approvalId?:string};
export function attentionItems(records:BusinessRecord[],data:ExecutiveData,today:string,prefs:Preferences):Attention[] {
 const items:Attention[]=[];
 for(const r of records.filter(r=>r.kind==="task"&&r.status!=="Completed"&&(r.date<today||r.blocker||r.status==="At risk"||r.status==="Delayed")))items.push({id:r.id,type:r.blocker?"Blocker":"Delivery",title:r.title,severity:r.blocker||r.status==="Delayed"?"High":"Medium",owner:r.owner,due:r.date,href:`/tasks?record=${encodeURIComponent(r.id)}`,action:"Review task and ownership"});
 for(const p of projectPerformance(records,data,today,prefs).filter(p=>p.status==="Delayed"||p.overBudget))items.push({id:p.project.id,type:p.overBudget?"Budget overrun":"Delayed project",title:p.project.title,severity:"High",owner:p.project.owner,due:p.project.date,href:`/projects/${encodeURIComponent(p.project.id)}`,action:p.overBudget?"Review costs and approved budget":"Review delivery plan"});
 const fin=financialIntelligence(records,data,{from:"0001-01-01",to:today},today);
 for(const i of fin.overdue)items.push({id:i.id,type:"Overdue invoice",title:i.number,severity:"High",owner:i.owner,due:i.due,href:`/finance?record=${encodeURIComponent(i.id)}`,action:"Review balance and contact client"});
 for(const a of data.approvals.filter(a=>a.status==="Pending"))items.push({id:a.id,type:`${a.type} approval`,title:a.title,severity:a.severity,owner:a.owner,due:a.due,href:"/settings#management-data",action:"Review request",approvalId:a.id});
 for(const l of records.filter(l=>l.kind==="lead"&&l.stage!=="Won"&&l.stage!=="Lost"&&l.followUpDate&&l.followUpDate<today))items.push({id:l.id,type:"Sales follow-up",title:l.title,severity:"Medium",owner:l.owner,due:l.followUpDate!,href:`/crm?record=${encodeURIComponent(l.id)}`,action:"Contact opportunity owner"});
 for(const p of workforceIntelligence(records,data,today,prefs).people.filter(p=>p.status==="Overloaded"))items.push({id:p.person.id,type:"Resource shortage",title:p.person.title,severity:"Medium",owner:p.person.title,due:today,href:"/hrms",action:"Rebalance assigned hours"});
 return items.sort((a,b)=>({High:0,Medium:1,Low:2}[a.severity]-{High:0,Medium:1,Low:2}[b.severity]||a.due.localeCompare(b.due)));
}
export type ActivityEvent={id:string;title:string;action:string;at:string;department:string;user:string;recordId:string;href:string;category:string};
export function validateExecutive(input:unknown,records:BusinessRecord[]):ExecutiveData {
 const d=executiveSchema.parse(input); const ids=new Set<string>(records.map(r=>r.id));
 for(const collection of [d.clients,d.departments,d.ledger,d.invoices,d.budgets,d.balances,d.attendance,d.timesheets,d.campaigns,d.approvals,d.goals,d.events])for(const x of collection){if(ids.has(x.id))throw Error(`Duplicate executive ID: ${x.id}`);ids.add(x.id);}
 if(new Set(d.clients.map(c=>c.name.toLowerCase())).size!==d.clients.length)throw Error("Duplicate client names");
 const departments=new Set(d.departments.map(d=>d.id));
 const clients=new Set(d.clients.map(c=>c.id)), projects=new Set(records.filter(r=>r.kind==="project").map(r=>r.id)),employees=new Set(records.filter(r=>r.kind==="employee").map(r=>r.id)),campaigns=new Set(d.campaigns.map(c=>c.id));
 for(const x of [...records,...d.ledger,...d.invoices,...d.budgets,...d.campaigns,...d.approvals,...d.events,...d.timesheets]){
  if("departmentId" in x&&x.departmentId&&!departments.has(x.departmentId))throw Error(`Unknown department: ${x.departmentId}`);
  if("projectId" in x&&x.projectId&&!projects.has(x.projectId))throw Error(`Unknown project: ${x.projectId}`);
  if("clientId" in x&&x.clientId&&!clients.has(x.clientId))throw Error(`Unknown client: ${x.clientId}`);
  if("campaignId" in x&&x.campaignId&&!campaigns.has(x.campaignId))throw Error(`Unknown campaign: ${x.campaignId}`);
 }
 for(const x of [...d.attendance,...d.timesheets,...d.approvals,...records])if("employeeId" in x&&x.employeeId&&!employees.has(x.employeeId))throw Error(`Unknown employee: ${x.employeeId}`);
 for(const i of d.invoices){if(i.due<i.issued||sum(i.payments,p=>p.amount)>i.amount||i.payments.some(p=>p.date<i.issued))throw Error(`Invalid invoice dates or payment balance: ${i.number}`);}
 for(const b of [...d.budgets,...d.campaigns])if(b.end<b.start)throw Error("End date precedes start date");
 for(const g of d.goals)if(g.deadline<g.start)throw Error("Goal deadline precedes start");
 const paymentIds=d.invoices.flatMap(i=>i.payments.map(p=>p.id));if(new Set(paymentIds).size!==paymentIds.length)throw Error("Payment allocation IDs must be unique across invoices");
 for(const i of d.invoices){if(new Set(i.payments.map(p=>p.id)).size!==i.payments.length)throw Error("Duplicate invoice payment IDs");}
 if(new Set(d.invoices.map(i=>i.number.toLowerCase())).size!==d.invoices.length)throw Error("Duplicate invoice numbers");
 if(new Set(d.budgets.map(b=>`${b.projectId||""}:${b.departmentId||""}:${b.start}:${b.end}`)).size!==d.budgets.length)throw Error("Duplicate budget scope and period");
 for(const a of d.approvals){if(a.leaveStart||a.leaveEnd){if(a.type!=="Leave"||!a.employeeId||!a.leaveStart||!a.leaveEnd||a.leaveEnd<a.leaveStart)throw Error("Leave dates require a linked employee and valid start/end dates");}}
 for(const r of records){if(r.stageHistory?.some(h=>h.date<r.date))throw Error("Sales stage date precedes lead creation");if(r.kind==="lead"&&r.closedDate&&r.closedDate<r.date)throw Error("Deal closure precedes lead creation");}
 if(new Set(d.attendance.map(a=>`${a.employeeId}:${a.date}`)).size!==d.attendance.length)throw Error("Duplicate attendance for employee and day");
 return d;
}

export function marketingIntelligence(records:BusinessRecord[],data:ExecutiveData,period:Period) {
 const cohort=salesIntelligence(records,data,period).cohort;
 const campaignRows=data.campaigns.filter(c=>c.start<=period.to&&c.end>=period.from).map(c=>{
  const paid=records.filter(r=>r.kind==="expense"&&r.status==="Paid"&&r.campaignId===c.id&&within(r.date,period));
  const spend=sum(paid,r=>r.amount),ads=sum(paid.filter(r=>r.category==="Advertising"),r=>r.amount),leads=cohort.filter(r=>r.campaignId===c.id);
  const earned=sum(data.ledger.filter(l=>l.kind==="revenue"&&l.campaignId===c.id&&within(l.date,period)),l=>l.amount);
  const stageKnown=data.coverage.sales&&leads.every(l=>!!l.stage);
  return {campaign:c,spend:data.coverage.marketing?spend:null,leads:data.coverage.marketing?leads.length:null,cpl:data.coverage.marketing&&leads.length?spend/leads.length:null,qualified:data.coverage.marketing&&stageKnown?leads.filter(l=>["Qualified","Proposal Sent","Negotiation","Won"].includes(l.stage!)).length:null,conversion:data.coverage.marketing&&stageKnown&&leads.length?leads.filter(l=>l.stage==="Won").length/leads.length*100:null,earned:data.coverage.marketing&&data.coverage.accounting?earned:null,roas:data.coverage.marketing&&data.coverage.accounting&&ads>0?earned/ads:null,ads};
 });
 const available=data.coverage.marketing;const spend=sum(campaignRows,r=>r.spend??0),leads=sum(campaignRows,r=>r.leads??0),ads=sum(campaignRows,r=>r.ads),earned=sum(campaignRows,r=>r.earned??0);
 return {campaigns:campaignRows,active:available?campaignRows.filter(r=>r.campaign.status==="Active").length:null,spend:available?spend:null,leads:available?leads:null,cpl:available&&leads>0?spend/leads:null,qualified:available&&campaignRows.every(r=>r.qualified!==null)?sum(campaignRows,r=>r.qualified??0):null,earned:available&&data.coverage.accounting?earned:null,roas:available&&data.coverage.accounting&&ads>0?earned/ads:null,pending:data.approvals.filter(a=>a.type==="Marketing"&&a.status==="Pending").length};
}

export function goalValue(goal:ExecutiveData["goals"][number],records:BusinessRecord[],data:ExecutiveData,prefs:Preferences,today:string,period:Period={from:goal.start,to:goal.deadline}):number|null {
 const finance=financialIntelligence(records,data,period,today),sales=salesIntelligence(records,data,period),workforce=workforceIntelligence(records,data,today,prefs),marketing=marketingIntelligence(records,data,period);
 const due=records.filter(r=>r.kind==="project"&&within(r.date,period));
 return {cashIn:finance.cashIn,earned:finance.earned,margin:finance.margin,conversion:sales.conversion,delivery:due.length?due.filter(r=>r.status==="Completed").length/due.length*100:null,utilization:workforce.utilization,roas:marketing.roas}[goal.metric];
}
