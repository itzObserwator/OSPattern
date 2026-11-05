"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, RotateCcw, ChartPie, TrendingUp } from "lucide-react";
import DeliveryPulseChart from "./delivery-pulse-chart";
import { money, type BusinessRecord } from "@/lib/models";
import { type Preferences } from "@/lib/executive";

type Cash = {received:number;paid:number;net:number};
type Metric = keyof Cash;
const metrics: {key:Metric;label:string;color:string}[]=[{key:"received",label:"Cash received",color:"#0022FF"},{key:"paid",label:"Cash paid",color:"#94A3B8"},{key:"net",label:"Net cash",color:"#0B1024"}];
function cash(records:BusinessRecord[],from:string,to:string):Cash {
 const paid=records.filter(record=>record.status==="Paid"&&record.date>=from&&record.date<=to);
 const received=paid.filter(record=>record.kind==="invoice").reduce((sum,record)=>sum+record.amount,0);
 const out=paid.filter(record=>record.kind==="expense").reduce((sum,record)=>sum+record.amount,0);
 return {received,paid:out,net:received-out};
}
function change(value:number,previous:number){return previous===0?"N/A":`${value-previous>=0?"+":""}${((value-previous)/Math.abs(previous)*100).toFixed(1)}%`;}
export function FinancialOverview({records,prefs}:{records:BusinessRecord[];prefs:Preferences}) {
 const id=useId().replace(/:/g,"");const reduced=useReducedMotion();
 const [metric,setMetric]=useState<Metric|"all">("all"),[view,setView]=useState<"bar"|"line">("bar"),[selected,setSelected]=useState(5);
 const [chartEnd,setChartEnd]=useState<string|null>(null);
 const chartMonth=chartEnd??prefs.month;
 function shiftWindow(direction:number){
  const date=new Date(Date.UTC(Number(chartMonth.slice(0,4)),Number(chartMonth.slice(5))-1+direction*6,1));
  if(date.getUTCFullYear()<100||date.getUTCFullYear()>9999)return;
  setChartEnd(date.toISOString().slice(0,7));setSelected(5);
 }
 const data=Array.from({length:6},(_,index)=>{
  const date=new Date(Date.UTC(Number(chartMonth.slice(0,4)),Number(chartMonth.slice(5))-6+index,1));
  const key=date.toISOString().slice(0,7),end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).toISOString().slice(0,10);
  const previousDate=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()-1,1));
  return {key,label:date.toLocaleDateString("en-IN",{month:"short",timeZone:"UTC"}),year:date.getUTCFullYear(),...cash(records,`${key}-01`,end),previous:cash(records,previousDate.toISOString().slice(0,10),new Date(date.getTime()-86400000).toISOString().slice(0,10))};
 });
 const shown=metrics.filter(item=>metric==="all"||item.key===metric),active=data[selected];
 const values=shown.flatMap(item=>data.map(row=>row[item.key]));
 const max=Math.max(1,...values),min=Math.min(0,...values),span=max-min||1;
 const y=(value:number)=>18+(max-value)/span*134,zero=y(0);
 function path(key:Metric){const points=data.map((row,index)=>({x:50+index*100,y:y(row[key])}));return `M0,${points[0].y} L${points[0].x},${points[0].y}`+points.slice(1).map((point,index)=>` C${(points[index].x+point.x)/2},${points[index].y} ${(points[index].x+point.x)/2},${point.y} ${point.x},${point.y}`).join("")+` H600`;}
 return <section className="overview-unified overview-financial" aria-label="Financial Overview">
  <header className="overview-card-heading"><span className="overview-card-icon"><TrendingUp size={21}/></span><div><h2>Financial Overview</h2><p>Cash flow and monthly financial trends.</p></div><Link href="/finance" aria-label="View Finance"><ArrowUpRight size={20}/></Link></header>
  <div className="overview-chart-controls"><div className="overview-toggle" role="group" aria-label="Financial metric">{[{key:"all",label:"All"},...metrics].map(item=><button key={item.key} aria-pressed={metric===item.key} onClick={()=>setMetric(item.key as Metric|"all")}>{item.label}</button>)}</div><div className="overview-toggle" role="group" aria-label="Chart view">{(["bar","line"] as const).map(type=><button key={type} aria-pressed={view===type} onClick={()=>setView(type)}>{type==="bar"?"Bar":"Line"}</button>)}</div></div>
  <div className="overview-chart-legend">{shown.map(item=><span key={item.key}><i style={{background:item.color}} data-dashed={item.key==="net"&&(view==="line"||metric==="all")}/>{item.label}{item.key==="net"&&(view==="line"||metric==="all")?" · dashed":""}</span>)}</div>
  <div className="overview-history-filter"><span>{data[0].label} {data[0].year} — {data[5].label} {data[5].year}</span><div><button type="button" aria-label="Show previous six months" title="Previous six months" onClick={()=>shiftWindow(-1)}><ChevronLeft size={15}/></button><label>Chart ending<input type="month" aria-label="Financial chart ending month" min="0100-01" max="9999-12" value={chartMonth} onChange={event=>{const value=event.target.value;if(/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&Number(value.slice(0,4))>=100){setChartEnd(value);setSelected(5);}}}/></label><button type="button" aria-label="Show next six months" title="Next six months" onClick={()=>shiftWindow(1)}><ChevronRight size={15}/></button>{chartEnd!==null&&<button type="button" aria-label="Reset chart to reporting month" title="Follow reporting month" onClick={()=>{setChartEnd(null);setSelected(5);}}><RotateCcw size={14}/></button>}</div></div>
  <motion.div className="overview-cash-chart" key={`${view}-${metric}`} initial={false} animate={{opacity:1}} transition={{duration:reduced?0:.18}}>
   <svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true"><defs>{metrics.map(item=><linearGradient key={item.key} id={`${id}-${item.key}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity={.24}/><stop offset="100%" stopColor={item.color} stopOpacity={.025}/></linearGradient>)}
     <linearGradient id={`${id}-selected`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#526BFF"/><stop offset="100%" stopColor="#0022FF" stopOpacity=".75"/></linearGradient>
     <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="2" height="7" fill="#FFFFFF" fillOpacity=".24"/></pattern>
    </defs>
    <rect x={selected*100+8} y="0" width="84" height="168" rx="14" fill="#F3F5FD"/>
    {[.5,1].map(ratio=><line key={ratio} x1="0" y1={18+134*ratio} x2="600" y2={18+134*ratio} stroke="#E9EDF5" strokeDasharray="2 6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>)}
    <line x1="0" y1={zero} x2="600" y2={zero} stroke="#E2E6EF" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
    {view==="bar"? <>
     {data.map((row,index)=><g key={row.key}>{shown.filter(item=>metric!=="all"||item.key!=="net").map((item,barIndex)=>{
       const grouped=metric==="all",width=grouped?25:42,x=index*100+(grouped?22+barIndex*31:29),top=Math.min(zero,y(row[item.key])),height=Math.abs(zero-y(row[item.key]));
       return <g key={item.key}><rect x={x} y={top} width={width} height={Math.max(1,height)} rx={6} fill={selected===index&&item.key==="received"?`url(#${id}-selected)`:`url(#${id}-${item.key})`} stroke={item.color} strokeOpacity={selected===index?.45:.12} strokeWidth=".8" vectorEffect="non-scaling-stroke"/>{selected===index&&<rect x={x} y={top} width={width} height={Math.max(1,height)} rx={6} fill={`url(#${id}-hatch)`}/>}<line x1={x+6} x2={x+width-6} y1={y(row[item.key])+2} y2={y(row[item.key])+2} stroke={item.color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></g>;
     })}</g>)}
     {metric==="all"&&<path d={path("net")} fill="none" stroke="#0B1024" strokeOpacity=".65" strokeWidth="1.4" strokeDasharray="4 5" vectorEffect="non-scaling-stroke"/>}
    </>:shown.map(item=><g key={item.key}><path d={`${path(item.key)} L600,${zero} L0,${zero} Z`} fill={`url(#${id}-${item.key})`}/><path d={path(item.key)} fill="none" stroke={item.color} strokeWidth="2" strokeDasharray={item.key==="net"?"5 4":undefined} vectorEffect="non-scaling-stroke"/></g>)}
   </svg>
   <div className="overview-month-targets">{data.map((row,index)=><button key={row.key} aria-label={`${row.label} ${row.year}: cash received ${money(row.received)}, cash paid ${money(row.paid)}, net cash ${money(row.net)}`} aria-pressed={selected===index} onPointerEnter={()=>setSelected(index)} onFocus={()=>setSelected(index)} onClick={()=>setSelected(index)}><span className="overview-month-dot" style={{top:`${y(row[metric==="all"?"received":metric])/180*100}%`}}/>{selected===index&&<span className="overview-chart-value" style={{top:`${y(row[metric==="all"?"received":metric])/180*100}%`}}>{money(row[metric==="all"?"received":metric])}</span>}</button>)}</div>
  </motion.div>
  {!records.some(record=>(record.kind==="invoice"||record.kind==="expense")&&record.status==="Paid"&&record.date>=`${data[0].key}-01`&&record.date.slice(0,7)<=chartMonth)&&<p className="overview-history-empty">No recorded cash movements in this chart window.</p>}
  <div className="overview-month-labels" aria-hidden="true">{data.map((row,index)=><span key={row.key} data-selected={selected===index}>{row.label}</span>)}</div>
  <div className="overview-month-detail" aria-live="polite"><strong>{active.label} {active.year}</strong>{metrics.map(item=><span key={item.key}>{item.label}<b>{money(active[item.key])}</b><small>{change(active[item.key],active.previous[item.key])} MoM</small></span>)}</div>
  <Link className="overview-card-footer" href="/finance">View detailed Finance report <ArrowUpRight size={16}/></Link>
 </section>;
}

export function ProjectDeliveryOverview({records,projects,today}:{records:BusinessRecord[];projects:BusinessRecord[];today:string}) {
 const tasks=records.filter(record=>record.kind==="task"),completed=tasks.filter(task=>task.status==="Completed"),pending=tasks.filter(task=>task.status!=="Completed"),overdue=pending.filter(task=>task.date<today);
 const completion=tasks.length?Math.round(completed.length/tasks.length*100):0;
 const critical=[...pending.filter(task=>task.blocker||task.date<today).map(task=>({record:task,priority:task.blocker?0:1,status:task.blocker?"Blocked":"Overdue",href:`/tasks?record=${encodeURIComponent(task.id)}`})),...projects.filter(project=>project.status==="Delayed"||(project.status==="At risk"&&project.date<=new Date(Date.parse(today)+7*86400000).toISOString().slice(0,10))).map(project=>({record:project,priority:project.status==="Delayed"?2:3,status:project.status,href:`/projects/${encodeURIComponent(project.id)}`}))].sort((a,b)=>a.priority-b.priority||a.record.date.localeCompare(b.record.date)).slice(0,3);
 return <section className="overview-unified overview-delivery" aria-label="Project Delivery Overview">
  <header className="overview-card-heading"><span className="overview-card-icon"><ChartPie size={21}/></span><div><h2>Project Delivery Overview</h2><p>Project health, task progress, and delivery risks.</p></div><Link href="/projects" aria-label="View Projects"><ArrowUpRight size={20}/></Link></header>
  <div className="overview-delivery-body"><DeliveryPulseChart projects={projects} integrated/>
   <div className="overview-task-progress"><h3>Task progress</h3><div><strong>{completion}%</strong><span>{completed.length} of {tasks.length} tasks complete</span></div><div className="overview-task-track" role="progressbar" aria-label="Task completion" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${completion}%`}}/></div><dl>{[["Pending",pending.length],["Overdue",overdue.length]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Link href="/tasks">View tasks <ArrowUpRight size={14}/></Link></div>
  </div>
  <div className="overview-delivery-risks"><h3>Delivery priorities <span>{critical.length?`Top ${critical.length}`:"All clear"}</span></h3>{critical.map(item=><Link key={item.record.id} href={item.href}><div><strong>{item.record.title}</strong><small>{item.record.owner} · Due {item.record.date}</small></div><span>{item.status}</span><ArrowUpRight size={14}/></Link>)}{!critical.length&&<p>No blocked or overdue tasks, delayed projects, or approaching at-risk deadlines.</p>}</div>
 </section>;
}
