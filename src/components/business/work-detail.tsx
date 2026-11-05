"use client";
import Link from "next/link";
import {ArrowLeft,ArrowUpRight,CalendarDays,CheckSquare2,Eye,FolderKanban,Users,CircleAlert,Clock3} from "lucide-react";
import {useWorkspace} from "./workspace-provider";
import {useExecutive} from "./executive-provider";
import {currentDay} from "./executive-panels";
import {Avatar,StatusBadge} from "./primitives";

export function WorkDetail({id}:{id:string}){
 const {records}=useWorkspace();const {data,ready}=useExecutive();
 const task=records.find(record=>record.id===id&&record.kind==="task");
 if(!ready)return <div className="studio-detail-panel" role="status">Loading work details…</div>;
 if(!task)return <section className="studio-detail-panel"><h1>Task unavailable</h1><p>This task is not in the current workspace records.</p><Link href="/tasks">Return to Work overview</Link></section>;
 const today=currentDay(),completed=task.status==="Completed",overdue=!completed&&task.date<today;
 const employee=records.find(record=>record.kind==="employee"&&(task.employeeId?record.id===task.employeeId:record.title===task.owner));
 const project=records.find(record=>record.kind==="project"&&record.id===task.projectId);
 const department=data.departments.find(department=>department.id===task.departmentId)?.name||task.departmentId;
 const client=data.clients.find(client=>client.id===(task.clientId||project?.clientId));
 const related=records.filter(record=>record.kind==="task"&&record.id!==task.id&&(project?record.projectId===project.id:employee?record.employeeId===employee.id||record.owner===employee.title:record.owner===task.owner)).sort((a,b)=>Number(a.status==="Completed")-Number(b.status==="Completed")||a.date.localeCompare(b.date)).slice(0,4);
 return <div className="studio-project-detail studio-work-detail"><Link href="/tasks" className="bos-back-link"><ArrowLeft size={14}/>Work overview</Link>
 <header className="studio-detail-hero"><span className="studio-detail-symbol"><CheckSquare2 size={27} strokeWidth={1.4}/></span><div><span className="studio-detail-eyebrow">WORK DETAILS · BUSINESS OWNER VIEW</span><h1>{task.title}</h1><p>{project?.title||"No project linked"}</p></div><StatusBadge status={task.status}/></header>
 <div className="studio-work-detail-notice"><span><Eye size={14}/>Read-only workspace</span><small>Sample records · current delivery information</small></div>
 <div className="studio-detail-layout"><div className="studio-work-detail-main">
  <section className="studio-detail-panel"><header><div><span className="studio-detail-eyebrow">DELIVERY SNAPSHOT</span><h2>At a glance</h2></div></header><div className="studio-work-snapshot"><div><CalendarDays size={17}/><span>Due date</span><strong>{new Date(`${task.date}T12:00:00Z`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}</strong><small>{completed?"Task completed":overdue?"Past due":task.date===today?"Due today":"Upcoming deadline"}</small></div><div><CircleAlert size={17}/><span>Blocker</span><strong>{task.blocker&&!completed?"Blocked":"None recorded"}</strong><small>{task.blocker&&!completed?"Needs attention from the task owner":"Based on the recorded blocker flag"}</small></div><div><Clock3 size={17}/><span>Remaining estimate</span><strong>{task.estimatedHours===undefined?"Not recorded":`${task.estimatedHours} h`}</strong><small>Recorded estimate for this week</small></div></div></section>
  <section className="studio-detail-panel"><header><div><span className="studio-detail-eyebrow">CONNECTED WORK</span><h2>{project?"More from this project":"More from this owner"}</h2></div><span>Up to 4 tasks</span></header>{related.length?<div className="studio-detail-tasks">{related.map(item=><Link href={`/tasks/${encodeURIComponent(item.id)}`} key={item.id}><span className="studio-task-dot" data-complete={item.status==="Completed"}/><div><strong>{item.title}</strong><small>{item.owner} · Due {item.date}</small></div><StatusBadge status={item.status}/><ArrowUpRight size={15}/></Link>)}</div>:<div className="studio-detail-empty"><CheckSquare2 size={24}/><strong>No related tasks recorded</strong><p>Other tasks for this {project?"project":"owner"} will appear here.</p></div>}</section>
 </div><aside className="studio-work-detail-main"><section className="studio-detail-panel studio-detail-ownership"><header><h2>Ownership</h2><Users size={18}/></header><div className="studio-work-detail-person"><Avatar name={employee?.title||task.owner}/><div><strong>{employee?.title||task.owner}</strong><small>{employee?.jobTitle||"Task owner"}</small></div>{employee&&<Link href={`/hrms/${encodeURIComponent(employee.id)}`} aria-label={`View ${employee.title} profile`}><ArrowUpRight size={17}/></Link>}</div><dl><div><dt>Responsible person / team</dt><dd>{task.owner}</dd></div><div><dt>Department</dt><dd>{department||"Not linked"}</dd></div></dl></section>
 <section className="studio-detail-panel studio-detail-ownership"><header><h2>Project context</h2><FolderKanban size={18}/></header>{project?<Link className="studio-work-detail-project" href={`/projects/${encodeURIComponent(project.id)}`}><strong>{project.title}</strong><ArrowUpRight size={17}/><span>{project.progress}% recorded progress</span></Link>:<p className="studio-detail-finance-note">This task has no linked project.</p>}<dl><div><dt>Client</dt><dd>{client?.name||"Not linked"}</dd></div><div><dt>Task status</dt><dd><StatusBadge status={task.status}/></dd></div></dl></section></aside></div></div>;
}
