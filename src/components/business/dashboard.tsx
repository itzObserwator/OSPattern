"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CalendarDays, CheckSquare2, FolderKanban, Plus, Receipt, TrendingUp, Users } from "lucide-react";
import { summarize, type BusinessRecord, type Month, type RecordKind } from "@/lib/models";
import { Button } from "../ui/button";
import { useWorkspace } from "./workspace-provider";
import { WorkspaceCanvas } from "./workspace-canvas";
import {
  ActivityTimeline, AICommandCard, AnalyticsPanel, CompactMetricCard,
  PrimaryFeatureCard, PriorityTaskList, ProjectHealthPanel,
  TeamWorkload, UpcomingMilestones, type LocalActivity,
} from "./dashboard-panels";

const quickActions: { label: string; kind: RecordKind; icon: typeof Plus }[] = [
  { label: "Create project", kind: "project", icon: FolderKanban },
  { label: "Add employee", kind: "employee", icon: Users },
  { label: "Add task", kind: "task", icon: CheckSquare2 },
  { label: "Capture lead", kind: "lead", icon: TrendingUp },
  { label: "Record payment", kind: "invoice", icon: Receipt },
];

function useLocalActivity(records: BusinessRecord[]) {
  const [events, setEvents] = useState<LocalActivity[]>([]);
  const previous = useRef(records);
  const ready = useRef(false);
  useEffect(() => {
    // Restore browser data before observing user changes.
    const timer = window.setTimeout(() => { ready.current = true; }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const before = new Map(previous.current.map(record => [record.id, record]));
    previous.current = records;
    if (!ready.current) return;
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const changes = records.flatMap(record => {
      const old = before.get(record.id);
      const action = !old ? "Created" : old.status !== record.status ? `Marked ${record.status.toLowerCase()}` : null;
      return action ? [{ id: `${record.id}-${Date.now()}`, title: record.title, action, time }] : [];
    });
    if (changes.length) setEvents(current => [...changes, ...current].slice(0, 4));
  }, [records]);
  return events;
}

export function Dashboard() {
  const { records, openCreate } = useWorkspace();
  const [month, setMonth] = useState<Month>("2026-10");
  const [context, setContext] = useState({ greeting: "Welcome back", date: "Studio North workspace", today: "2026-11-02" });
  const reduced = useReducedMotion();
  const events = useLocalActivity(records);
  const summary = summarize(records, month);
  const previousMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 2, 1)).toISOString().slice(0, 7);
  const previous = summarize(records, previousMonth);
  useEffect(() => {
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
    setContext({
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      date: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(now),
      today: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata" }).format(now),
    });
  }, []);
  const projects = records.filter(record => record.kind === "project" && record.status !== "Completed");
  const openTasks = records.filter(record => record.kind === "task" && record.status !== "Completed");
  const employees = records.filter(record => record.kind === "employee" && record.status === "Active");
  const leads = records.filter(record => record.kind === "lead" && record.status === "Active");
  const reveal = { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } };

  return (
    <div className="bos-overview">
      <motion.header className="bos-editorial-header" {...reveal}>
        <div>
          <div className="bos-editorial-kicker"><span className="bos-kicker-line" /> STUDIO NORTH <span className="bos-edition">/ WORKSPACE</span></div>
          <h1>Everything, <span>in sync.</span></h1>
          <p>{context.greeting}, Alex. Your people, projects, and possibilities. Connected.</p>
        </div>
        <div className="bos-editorial-controls">
          <span className="bos-context-date"><CalendarDays size={15} />{context.date}</span>
          <div className="bos-page-actions">
            <label className="bos-period"><CalendarDays size={16} /><select aria-label="Financial reporting month" value={month} onChange={event => setMonth(event.target.value as Month)}>
              <option value="2026-09">September 2026</option><option value="2026-10">October 2026</option><option value="2026-11">November 2026</option>
            </select></label>
            <Button variant="primary" onClick={() => openCreate()}><Plus size={17} />Create new</Button>
          </div>
          <span className="bos-reporting-note">Financials follow this period. Operations show current records.</span>
        </div>
      </motion.header>
      <WorkspaceCanvas records={records} month={month} />
      <div className="bos-section-index"><span>01 <i /> YOUR BUSINESS AT A GLANCE</span><span>Demo workspace <span className="bos-label-dot" /> USD</span></div>
      <motion.div className="bos-feature-grid" initial={false} animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.065 } } }}>
        <motion.div className="bos-financial-slot" variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}><PrimaryFeatureCard records={records} month={month} summary={summary} previous={previous} /></motion.div>
        <motion.div className="bos-delivery-slot" variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}><CompactMetricCard variant="delivery" records={records} count={summary.tasks} /></motion.div>
        <motion.div className="bos-supporting-slot" variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}><CompactMetricCard variant="people" records={employees} count={summary.employees} /><CompactMetricCard variant="leads" records={leads} count={summary.leads} /></motion.div>
      </motion.div>
      <div className="bos-insights-grid"><AnalyticsPanel records={records} month={month} /><ProjectHealthPanel projects={projects} /></div>
      <div className="bos-section-toolbar"><div><div className="bos-section-index"><span>02 <i /> THE OPERATIONS DESK</span></div><h2>Less noise. More progress.</h2></div><Link href="/tasks" className="bos-text-link">Open my work <ArrowUpRight size={16} /></Link></div>
      <div className="bos-command-grid">
        <PriorityTaskList />
        <div className="bos-people-column"><TeamWorkload tasks={openTasks} employees={employees} /><div className="bos-approval-note"><span className="bos-approval-glyph"><CheckSquare2 size={20} /></span><div><h3>Approval inbox</h3><p>No approval source connected.</p></div><Link href="/settings" aria-label="View approval integration information"><ArrowUpRight size={20} /></Link></div></div>
        <UpcomingMilestones projects={projects} today={context.today} /><ActivityTimeline events={events} />
      </div>
      <AICommandCard projects={projects.length} tasks={summary.tasks} />
      <section className="bos-action-strip" aria-label="Quick actions"><span>MAKE YOUR NEXT MOVE</span><div>{quickActions.map(action => <Button key={action.kind} variant="ghost" onClick={() => openCreate(action.kind)}><action.icon size={16} />{action.label}<Plus size={13} /></Button>)}</div></section>
      <div className="bos-overview-end"><span className="bos-wordmark-small">BusinessOS<span>®</span></span><span>Built around the way you work.</span><Link href="/projects">Keep things moving <ArrowRight size={14} /></Link></div>
    </div>
  );
}
