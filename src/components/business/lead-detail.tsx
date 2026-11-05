"use client";
import Link from "next/link";
import {ArrowLeft,ArrowUpRight,TrendingUp,Eye,Users,Wallet,CalendarDays,Globe2,Mail,UserRound,FolderKanban} from "lucide-react";
import {money} from "@/lib/models";
import {useWorkspace} from "./workspace-provider";
import {useExecutive} from "./executive-provider";
import {currentDay} from "./executive-panels";
import {Avatar} from "./primitives";

const dateLabel=(date:string)=>new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
export function LeadDetail({id}:{id:string}){
 const {records}=useWorkspace();const {data,ready}=useExecutive();
 const lead=records.find(record=>record.id===id&&record.kind==="lead");
 if(!ready)return <div className="studio-detail-panel" role="status">Loading lead details…</div>;
 if(!lead)return <section className="studio-detail-panel"><h1>Lead unavailable</h1><p>This lead is not in the current workspace records.</p><Link href="/crm">Return to CRM & Sales</Link></section>;
 const owner=records.find(record=>record.kind==="employee"&&record.title===lead.owner);
 const project=records.find(record=>record.kind==="project"&&record.id===lead.projectId);
 const client=data.clients.find(client=>client.id===lead.clientId);
 const department=data.departments.find(department=>department.id===lead.departmentId)?.name||lead.departmentId;
 const closed=lead.stage==="Won"||lead.stage==="Lost";
 const history=(lead.stageHistory||[]).map((entry,index)=>({...entry,index})).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 return <div className="studio-project-detail studio-lead-detail"><Link href="/crm" className="bos-back-link"><ArrowLeft size={14}/>CRM & Sales</Link>
 <header className="studio-detail-hero"><span className="studio-detail-symbol"><TrendingUp size={27} strokeWidth={1.4}/></span><div><span className="studio-detail-eyebrow">LEAD WORKSPACE · BUSINESS OWNER VIEW</span><h1>{lead.title}</h1><p>{lead.contactName||"Contact not recorded"}</p></div><span className="studio-detail-status">{lead.stage||"Stage not mapped"}</span></header>
 <div className="studio-work-detail-notice"><span><Eye size={14}/>Read-only workspace</span><small>Sample records · current sales information</small></div>
 <div className="studio-detail-layout"><div className="studio-work-detail-main"><section className="studio-detail-panel"><header><div><span className="studio-detail-eyebrow">OPPORTUNITY</span><h2>At a glance</h2></div></header><div className="studio-work-snapshot"><div><Wallet size={17}/><span>Recorded deal value</span><strong>{money(lead.amount)}</strong><small>Opportunity value · not collected revenue</small></div><div><Globe2 size={17}/><span>Lead source</span><strong>{lead.source||"Not recorded"}</strong><small>Acquired {dateLabel(lead.date)}</small></div><div><CalendarDays size={17}/><span>{closed?"Closed date":"Next follow-up"}</span><strong>{closed?(lead.closedDate?dateLabel(lead.closedDate):"Not recorded"):(lead.followUpDate?dateLabel(lead.followUpDate):"Not scheduled")}</strong><small>{closed?`Opportunity ${lead.stage?.toLowerCase()}`:lead.followUpDate?lead.followUpDate<currentDay()?"Follow-up date has passed":lead.followUpDate===currentDay()?"Follow-up due today":"Upcoming follow-up":"No follow-up date recorded"}</small></div></div></section>
 <section className="studio-detail-panel studio-lead-history"><header><div><span className="studio-detail-eyebrow">SALES JOURNEY</span><h2>Stage history</h2></div><span>{history.length} recorded updates</span></header>{history.length?<ol>{history.map((entry,index)=><li key={`${entry.date}-${entry.index}`} data-latest={index===history.length-1}><span className="studio-lead-history-dot"/><div><strong>{entry.stage}</strong><time dateTime={entry.date}>{dateLabel(entry.date)}</time></div>{index===history.length-1&&<small>Latest recorded update</small>}</li>)}</ol>:<div className="studio-detail-empty"><TrendingUp size={24}/><strong>No stage history recorded</strong><p>Dated sales updates will appear here when they are available.</p></div>}</section></div>
 <aside className="studio-work-detail-main"><section className="studio-detail-panel studio-detail-ownership"><header><h2>Contact details</h2><UserRound size={18}/></header><dl><div><dt>Contact person</dt><dd>{lead.contactName||"Not recorded"}</dd></div><div><dt><Mail size={14}/>Email</dt><dd className="studio-lead-email">{lead.contactEmail||"Not recorded"}</dd></div></dl></section>
 <section className="studio-detail-panel studio-detail-ownership"><header><h2>Ownership</h2><Users size={18}/></header><div className="studio-work-detail-person"><Avatar name={lead.owner}/><div><strong>{lead.owner}</strong><small>{owner?.jobTitle||"Lead owner"}</small></div>{owner&&<Link href={`/hrms/${encodeURIComponent(owner.id)}`} aria-label={`View ${owner.title} profile`}><ArrowUpRight size={17}/></Link>}</div><dl><div><dt>Department</dt><dd>{department||"Not linked"}</dd></div><div><dt>Client</dt><dd>{client?.name||"Not linked"}</dd></div></dl></section>
 <section className="studio-detail-panel"><header><h2>Linked project</h2><FolderKanban size={18}/></header>{project?<Link className="studio-work-detail-project" href={`/projects/${encodeURIComponent(project.id)}`}><strong>{project.title}</strong><ArrowUpRight size={17}/><span>{project.progress}% recorded progress</span></Link>:<p className="studio-detail-finance-note">No project is linked to this lead.</p>}</section></aside></div></div>;
}
