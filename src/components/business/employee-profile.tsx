"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckSquare2, FolderKanban, Pencil, Users } from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { useExecutive } from "./executive-provider";
import { Avatar, StatusBadge } from "./primitives";
import { Button } from "../ui/button";
import { departmentOptions } from "@/lib/departments";
import { workforceIntelligence } from "@/lib/executive";
import { currentDay } from "./executive-panels";

export function EmployeeProfile({ id }: { id: string }) {
  const { records } = useWorkspace();
  const { data, prefs, ready } = useExecutive();
  const employee = records.find(record => record.id === id && record.kind === "employee");
  if (!ready) return <section className="exec-report" aria-busy="true"><p>Loading employee profile…</p></section>;
  if (!employee) return <section className="exec-report"><h1>Employee unavailable</h1><p>This employee is not present in this browser’s workspace.</p><Link href="/hrms">Return to People & HR</Link></section>;

  const tasks = records.filter(record => record.kind === "task" && (record.employeeId ? record.employeeId === id : record.owner === employee.title));
  const openTasks = tasks.filter(task => task.status !== "Completed");
  const projectIds = new Set([employee.projectId, ...tasks.map(task => task.projectId)].filter(Boolean));
  const projects = records.filter(record => record.kind === "project" && projectIds.has(record.id));
  const departments = departmentOptions(data.departments, employee.departmentId ? [employee.departmentId] : []);
  const department = departments.find(d => d.id === employee.departmentId)?.name || "Not linked";
  const client = data.clients.find(c => c.id === employee.clientId);
  const workload = workforceIntelligence(records, data, currentDay(), prefs).people.find(person => person.person.id === id);
  const attendance = data.attendance.filter(entry => entry.employeeId === id).sort((a,b) => b.date.localeCompare(a.date));
  const leave = data.approvals.filter(entry => entry.type === "Leave" && entry.employeeId === id).sort((a,b) => b.due.localeCompare(a.due));
  const hoursKnown = openTasks.every(task => task.estimatedHours !== undefined);
  const hours = openTasks.reduce((total,task) => total + (task.estimatedHours || 0), 0);

  return <div className="employee-profile">
    <Link className="bos-back-link" href="/hrms"><ArrowLeft size={14}/>People & HR</Link>
    <header className="employee-profile-header"><Avatar name={employee.title}/><div><span className="employee-profile-eyebrow">EMPLOYEE PROFILE</span><h1>{employee.title}</h1><p>{employee.jobTitle||"Role not set"} <span>·</span> {department} <span>·</span> {employee.owner}</p></div><div className="employee-profile-actions"><StatusBadge status={employee.status}/><Button asChild variant="primary"><Link href={`/hrms?record=${encodeURIComponent(id)}`}><Pencil size={15}/>Edit details</Link></Button></div></header>
    <div className="employee-profile-metrics">{[["Open tasks",String(openTasks.length)],["Related projects",String(projects.length)],["Weekly capacity",employee.weeklyCapacityHours===undefined?"Not available":`${employee.weeklyCapacityHours} h`],["Utilization",workload?.utilization==null?"Not available":`${workload.utilization.toFixed(0)}%`]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="employee-profile-grid"><section className="employee-profile-panel"><header><span className="employee-profile-icon"><Users size={19}/></span><div><h2>Profile details</h2><p>The information saved for this employee.</p></div></header><dl>{[["Job role",employee.jobTitle||"Not set"],["Department",department],["Responsible person / team",employee.owner],["Client",client?.name||"Not linked"],["Record date",employee.date],["Weekly capacity",employee.weeklyCapacityHours===undefined?"Not available":`${employee.weeklyCapacityHours} hours`],["Estimated open work",hoursKnown?`${hours} hours`:"Not available"]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="employee-profile-note">Employee ID: {employee.id}</p></section>
    <section className="employee-profile-panel"><header><span className="employee-profile-icon"><FolderKanban size={19}/></span><div><h2>Related projects</h2><p>Directly linked projects and projects from assigned tasks.</p></div></header>{projects.length?projects.map(project=><Link className="employee-profile-project" key={project.id} href={`/projects/${encodeURIComponent(project.id)}`}><div><strong>{project.title}</strong><span>{data.clients.find(c=>c.id===project.clientId)?.name||"Client not linked"} · Due {project.date}</span></div><ArrowUpRight size={17}/><div className="employee-profile-progress" aria-label={`${project.progress}% recorded progress`}><span style={{width:`${project.progress}%`}}/></div><small>{project.progress}% recorded progress</small></Link>):<p className="employee-profile-empty">No projects are linked yet. Use Edit details to link a project or assign a project task.</p>}</section>
    <section className="employee-profile-panel employee-profile-tasks"><header><span className="employee-profile-icon"><CheckSquare2 size={19}/></span><div><h2>Assigned work</h2><p>{openTasks.length} open · {tasks.length-openTasks.length} completed</p></div></header>{tasks.length?tasks.map(task=><Link className="employee-profile-task" key={task.id} href={`/tasks?record=${encodeURIComponent(task.id)}`}><div><strong>{task.title}</strong><span>{records.find(record=>record.id===task.projectId&&record.kind==="project")?.title||"Project not linked"} · Due {task.date}</span></div><StatusBadge status={task.status}/><ArrowUpRight size={16}/></Link>):<p className="employee-profile-empty">No tasks are currently assigned to this employee.</p>}</section>
    <section className="employee-profile-panel"><header><span className="employee-profile-icon"><CalendarDays size={19}/></span><div><h2>Attendance & leave</h2><p>Recorded attendance and linked leave requests.</p></div></header>{attendance.length>0&&<div className="employee-profile-attendance"><h3>Recent attendance</h3>{attendance.slice(0,5).map(entry=><div key={entry.id}><time>{entry.date}</time><span>{entry.status}</span></div>)}</div>}{leave.length>0&&<div className="employee-profile-attendance"><h3>Leave requests</h3>{leave.slice(0,5).map(entry=><div key={entry.id}><span>{entry.leaveStart&&entry.leaveEnd?`${entry.leaveStart} — ${entry.leaveEnd}`:entry.title}</span><span>{entry.status}</span></div>)}</div>}{!attendance.length&&!leave.length&&<p className="employee-profile-empty">No attendance or leave records have been added for this employee.</p>}</section></div>
    <p className="employee-profile-source">Browser-local workspace · profile values use saved records. Utilization uses estimated open-task hours and weekly capacity.</p>
  </div>;
}
