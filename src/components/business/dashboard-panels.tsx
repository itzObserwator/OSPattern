"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChartNoAxesColumn, ChartPie, Check, CheckCircle2, CircleDashed, Clock3, FolderKanban, Plus, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { financialSeries, money, type BusinessRecord } from "@/lib/models";
import { Button } from "../ui/button";
import { Avatar, StatusBadge } from "./primitives";
import { useWorkspace } from "./workspace-provider";

const FinanceChart = dynamic(() => import("./finance-chart"), {
  ssr: false,
  loading: () => <div className="bos-chart bos-skeleton" aria-label="Loading financial chart" />,
});

const DeliveryPulseChart = dynamic(() => import("./delivery-pulse-chart"), {
  ssr: false,
  loading: () => <div className="bos-pulse-loading bos-skeleton" aria-label="Loading delivery breakdown" />,
});

function AnimatedValue({ value, currency = false }: { value: number; currency?: boolean }) {
  const element = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduced = useReducedMotion();
  const format = (number: number) => currency ? money(number) : Math.round(number).toLocaleString("en-US");
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduced || from === value) {
      if (element.current) element.current.textContent = currency ? money(value) : String(value);
      return;
    }
    const animation = animate(from, value, {
      duration: 0.32, ease: "easeOut",
      onUpdate: current => { if (element.current) element.current.textContent = currency ? money(current) : Math.round(current).toLocaleString("en-US"); },
      onComplete: () => { if (element.current) element.current.textContent = currency ? money(value) : String(value); },
    });
    return () => animation.stop();
  }, [value, currency, reduced]);
  return <><span aria-hidden="true" ref={element}>{format(value)}</span><span className="sr-only">{format(value)}</span></>;
}

function BrandGeometry({ className = "" }: { className?: string }) {
  return <svg className={`bos-brand-geometry ${className}`} viewBox="0 0 240 240" fill="none" aria-hidden="true">
    {[0, 1, 2, 3, 4].map(index => <path key={index} d={`M${24 + index * 18} 216V${24 + index * 18}H216V${216 - index * 18}H${24 + index * 18}`} stroke="currentColor" strokeWidth="1" />)}
    <path d="M24 216 216 24M120 24v192M24 120h192" stroke="currentColor" strokeWidth="1" />
    <circle cx="120" cy="120" r="54" stroke="currentColor" /><circle cx="120" cy="120" r="8" fill="currentColor" />
  </svg>;
}

type Summary = { projects: number; employees: number; revenue: number; expenses: number; tasks: number; leads: number };

export function PrimaryFeatureCard({ records, month, summary, previous }: { records: BusinessRecord[]; month: string; summary: Summary; previous: Summary }) {
  const series = financialSeries(records, month);
  const [activeIndex, setActiveIndex] = useState(5);
  const active = series[activeIndex];
  const maximum = Math.max(1, ...series.map(row => row.revenue));
  const change = previous.revenue ? (summary.revenue - previous.revenue) / previous.revenue * 100 : null;
  const monthName = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return <section className="bos-primary-feature bos-kpi bos-range-card bos-performance-columns" aria-label="Monthly financial performance">
    <header className="bos-range-heading"><h2>Financial performance</h2><Link href="/finance" className="bos-feature-arrow" aria-label="View financial records"><ArrowUpRight size={22} /></Link></header>
    <div className="exec-cash-headline"><strong>{money(summary.revenue)}</strong><span>received · {money(summary.revenue-summary.expenses)} net cash</span></div>
    <div className="bos-performance-chart" role="group" aria-label="Monthly cash received. Select a column for its amount.">
      <div className="bos-performance-chart-label">Cash received <span>{series[0].month} — {series[5].month}</span></div>
      <div className="bos-performance-bars">{series.map((row, index) => <button
        key={row.month} type="button" className={`bos-performance-column ${activeIndex === index ? "active" : ""}`}
        aria-label={`${row.month}: cash received ${money(row.revenue)}, cash paid ${money(row.expenses)}`}
        aria-pressed={activeIndex === index} onPointerEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)}
      >
        <span className="bos-performance-bar" style={{ height: `${row.revenue / maximum * 100}%` }}>
          {activeIndex === index && <span className="bos-performance-callout">{money(row.revenue)}</span>}
          <span className="bos-performance-cap" />
        </span>
        <span className="bos-performance-month">{row.month}</span>
      </button>)}</div>
    </div>
    <div className="sr-only" aria-live="polite">{active.month}: cash received {money(active.revenue)}, cash paid {money(active.expenses)}, net cash {money(active.revenue-active.expenses)}. Reporting month {monthName}.</div>
    <span className="sr-only">{change === null ? "No prior-period payments" : `${Math.abs(change).toFixed(1)}% ${change >= 0 ? "up" : "down"} from previous month`}. Columns show six months of paid cash receipts.</span>
  </section>;
}

export function CompactMetricCard({ variant, count, records }: { variant: "delivery" | "people" | "leads"; count: number; records: BusinessRecord[] }) {
  if (variant === "delivery") {
    const all = records.filter(record => record.kind === "task");
    const completed = all.filter(record => record.status === "Completed").length;
    const delayed = all.filter(record => record.status === "Delayed").length;
    const onTrack = all.filter(record => record.status !== "Completed" && record.status !== "Delayed").length;
    const completion = all.length ? Math.round(completed / all.length * 100) : 0;
    const max = Math.max(1, count, completed, delayed, onTrack);
    const bar = (value: number, label: string, muted = false) => <div className={`bos-delivery-bar ${muted ? "muted" : ""} ${value === 0 ? "empty" : ""}`} style={{ height: `max(48px, ${value / max * 100}%)` }}><strong>{value}</strong><span>{label}</span></div>;
    return <Link href="/tasks" className="bos-delivery-feature bos-kpi bos-delivery-summary" aria-label={`Delivery desk: ${count} pending tasks, ${completed} completed, ${delayed} delayed. View tasks.`}>
      <header className="bos-delivery-summary-header"><span className="bos-delivery-emblem"><ChartNoAxesColumn size={18} /></span><div><h2>Delivery desk</h2><p>{completion}% of tasks completed</p></div><span className="bos-delivery-summary-arrow"><ArrowUpRight size={17} /></span></header>
      <div className="bos-delivery-summary-totals"><div><strong className="bos-delivery-value bos-kpi-value"><AnimatedValue value={count} /></strong><span>Pending tasks</span></div><div><strong><AnimatedValue value={completed} /></strong><span>Completed</span></div></div>
      <div className="bos-delivery-columns" aria-hidden="true"><div className="bos-delivery-column">{bar(onTrack, "On track")}{bar(delayed, "Delayed", true)}</div><div className="bos-delivery-column">{bar(completed, "Done")}{bar(count, "Open", true)}</div></div>
      <span className="sr-only">{onTrack} pending tasks without a delay. {completed} of {all.length} completed. Bar heights share the same task-count scale; short bars retain space for labels.</span>
    </Link>;
  }
  const people = variant === "people";
  const Icon = people ? Users : TrendingUp;
  return <Link href={people ? "/hrms" : "/crm"} className={`bos-compact-metric bos-kpi ${people ? "people" : "leads"}`}><div className="bos-compact-top"><span><Icon size={16} />{people ? "Total employees" : "Active sales leads"}</span><ArrowUpRight size={16} /></div><div className="bos-compact-bottom"><strong><AnimatedValue value={count} /></strong>{people ? <div className="bos-avatar-stack" aria-label="Sample team members">{records.slice(0, 3).map(record => <Avatar key={record.id} name={record.title} small />)}</div> : <span>{money(records.reduce((total, record) => total + record.amount, 0))}<small>recorded pipeline value</small></span>}</div></Link>;
}

function PanelHeading({ index, title, subtitle, action }: { index?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="bos-panel-heading"><div>{index && <span className="bos-panel-index">{index}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>;
}

export function AnalyticsPanel({ records, month }: { records: BusinessRecord[]; month: string }) {
  const series = financialSeries(records, month);
  const totalRevenue = series.reduce((total, row) => total + row.revenue, 0);
  const totalExpenses = series.reduce((total, row) => total + row.expenses, 0);
  return <section className="bos-analytics-panel bos-momentum-panel">
    <header className="bos-momentum-heading"><span className="bos-momentum-emblem"><TrendingUp size={20} /></span><div><h2>Financial momentum</h2><p>Received payments & paid expenses</p></div><Link href="/finance" className="bos-panel-link" aria-label="View finance report"><ArrowUpRight size={20} /></Link></header>
    <div className="bos-analytics-totals"><div><span><i className="bos-legend-dot blue" />Cash received</span><strong>{money(totalRevenue)}</strong></div><div><span><i className="bos-legend-square" />Cash paid</span><strong>{money(totalExpenses)}</strong></div><span className="bos-chart-window">{series[0].month} — {series[5].month}<small>{month.slice(0, 4)} · 6-month total</small></span></div>
    <FinanceChart records={records} month={month} />
  </section>;
}

export function ProjectHealthPanel({ projects }: { projects: BusinessRecord[] }) {
  return <section className="bos-project-health bos-pulse-panel">
    <header className="bos-pulse-heading"><span className="bos-pulse-emblem"><ChartPie size={20} /></span><div><h2>Delivery pulse</h2><p>Active project breakdown</p></div><Link href="/projects" aria-label="View all projects"><ArrowUpRight size={19} /></Link></header>
    <DeliveryPulseChart projects={projects} />
  </section>;
}

export function PriorityTaskList({ scopedRecords }: { scopedRecords?: BusinessRecord[] }) {
  const { records: allRecords, complete, openCreate } = useWorkspace();
  const records = scopedRecords ?? allRecords;
  const [filter, setFilter] = useState("Open");
  const tasks = records.filter(record => record.kind === "task" && (filter === "All tasks" || record.status !== "Completed")).slice(0, 4);
  return <section className="bos-priority-panel"><PanelHeading title="A little focus goes a long way." subtitle="Your priority tasks" action={<select className="bos-task-filter" aria-label="Filter priority tasks" value={filter} onChange={event => setFilter(event.target.value)}><option>Open</option><option>All tasks</option></select>} />
    <div className="bos-priority-list">{tasks.map(task => <div className={`bos-priority ${task.status === "Completed" ? "completed" : ""}`} key={task.id}><button className="bos-task-check" onClick={() => complete(task.id)} aria-label={`${task.status === "Completed" ? "Reopen" : "Complete"} ${task.title}`} aria-pressed={task.status === "Completed"}>{task.status === "Completed" && <Check size={14} />}</button><div className="bos-task-copy"><strong>{task.title}</strong><span>{task.owner}<i />{new Date(`${task.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span></div><StatusBadge status={task.status} /></div>)}{!tasks.length && <div className="bos-panel-empty"><CheckCircle2 size={22} /><p>You’re all caught up.</p><Button variant="ghost" onClick={() => openCreate("task")}>Add your next task <Plus size={14} /></Button></div>}</div>
    <Link className="bos-priority-footer" href="/tasks">View all tasks <ArrowRight size={16} /></Link>
  </section>;
}

export function TeamWorkload({ tasks, employees }: { tasks: BusinessRecord[]; employees: BusinessRecord[] }) {
  const assignments = [...new Set(tasks.map(task => task.owner))].map(owner => ({ owner, count: tasks.filter(task => task.owner === owner).length })).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...assignments.map(person => person.count));
  return <section className="bos-team-panel"><PanelHeading title="The people behind the progress." subtitle={`${tasks.length} open tasks · ${employees.length} active people`} action={<Link href="/hrms" className="bos-panel-link" aria-label="View your team"><Users size={19} /></Link>} /><div className="bos-workload-list">{assignments.slice(0, 3).map(person => <div key={person.owner}><Avatar name={person.owner} small /><div><strong>{person.owner}</strong><span className="bos-workload-bar"><span style={{ width: `${person.count / max * 100}%` }} /></span></div><span>{person.count}<small>{person.count === 1 ? "task" : "tasks"}</small></span></div>)}</div>{!assignments.length && <p className="bos-panel-empty">No open task assignments.</p>}<p className="bos-workload-note">Recorded assignments, not a capacity estimate.</p></section>;
}

export function UpcomingMilestones({ projects, today }: { projects: BusinessRecord[]; today: string }) {
  const upcoming = [...projects].filter(project => project.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return <section className="bos-milestone-panel"><PanelHeading title="What’s coming into view" /><div className="bos-milestone-list">{upcoming.map(project => <Link href="/projects" className="bos-milestone" key={project.id}><span className="bos-milestone-date"><strong>{project.date.slice(-2)}</strong><span>{new Date(`${project.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span></span><div><strong>{project.title}</strong><span>Delivery · {project.owner}</span></div><ArrowUpRight size={17} /></Link>)}</div>{!upcoming.length && <p className="bos-panel-empty">No upcoming project delivery dates.</p>}</section>;
}

export type LocalActivity = { id: string; title: string; action: string; time: string };

export function ActivityTimeline({ events }: { events: LocalActivity[] }) {
  return <section className="bos-activity-panel"><PanelHeading index="THE LATEST" title="Workspace activity" action={<Clock3 size={18} />} /><div className="bos-activity-timeline" aria-live="polite">{events.length ? events.map(event => <div className="bos-activity-event" key={event.id}><span className="bos-activity-dot" /><div><strong>{event.action}</strong><p>{event.title}</p><small>{event.time}</small></div></div>) : <div className="bos-activity-empty"><CircleDashed size={24} /><strong>A fresh perspective starts here.</strong><p>Create a record or complete a task to see activity from this visit.</p></div>}</div><p className="bos-activity-note">This overview visit only · not a server audit log</p></section>;
}

export function AICommandCard({ projects, tasks }: { projects: number; tasks: number }) {
  const map = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<string[]>([]);
  useEffect(() => {
    const canvas = map.current;
    if (!canvas) return;
    const update = () => {
      const nodes = [...canvas.querySelectorAll<HTMLAnchorElement>(".bos-context-node")];
      setConnections(nodes.slice(0, -1).map((node, index) => {
        const next = nodes[index + 1];
        const x1 = node.offsetLeft + node.offsetWidth;
        const y1 = node.offsetTop + node.offsetHeight / 2;
        const x2 = next.offsetLeft;
        const y2 = next.offsetTop + next.offsetHeight / 2;
        return `M${x1} ${y1}C${x1 + 44} ${y1},${x2 - 44} ${y2},${x2} ${y2}`;
      }));
    };
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    canvas.querySelectorAll(".bos-context-node").forEach(node => observer.observe(node));
    update();
    return () => observer.disconnect();
  }, []);
  return <section className="bos-ai-command">
    <div className="bos-ai-command-copy"><span className="bos-panel-index">CONTEXT. CONNECTED.</span><h2>Your workspace,<br />from a new angle.</h2><p>{projects} projects. {tasks} open tasks. Find the next useful connection with your local record assistant.</p><span className="bos-ai-disclosure"><span /> Local lookup · no live AI provider</span><Link href="/ai-assistant" className="bos-ai-command-action"><span>Open AI Assistant</span><ArrowUpRight size={21} /></Link></div>
    <div ref={map} className="bos-context-map" aria-label="Local record lookup: workspace records connect to a search and its results">
      <svg aria-hidden="true">{connections.map((path, index) => <path key={index} d={path} />)}</svg>
      <Link href="/projects" className="bos-context-node node-records"><span className="bos-node-icon"><FolderKanban size={17} /></span><span><strong>Workspace records</strong><small>{projects} projects in context</small></span><span className="bos-node-port" /></Link>
      <Link href="/ai-assistant" className="bos-context-node node-lookup"><span className="bos-node-icon"><Sparkles size={19} /></span><span><strong>Local assistant</strong><small>Find your next move</small></span><ArrowUpRight size={14} /><span className="bos-node-port port-in" /><span className="bos-node-port" /></Link>
      <Link href="/ai-assistant" className="bos-context-node node-results"><span className="bos-node-icon"><Search size={17} /></span><span><strong>Record results</strong><small>Grounded in this browser</small></span><span className="bos-node-port port-in" /></Link>
      <span className="bos-map-annotation">A record lookup path · no workflow execution</span>
    </div>
  </section>;
}
