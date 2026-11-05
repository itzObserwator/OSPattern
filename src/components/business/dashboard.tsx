"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Plus } from "lucide-react";
import { summarize, type BusinessRecord } from "@/lib/models";
import { Button } from "../ui/button";
import { useWorkspace } from "./workspace-provider";
import { WorkspaceCanvas } from "./workspace-canvas";
import { useExecutive } from "./executive-provider";
import { ExecutiveFilters, useExecutiveScope } from "./executive-controls";
import { WorkforceReport } from "./executive-panels";
import { RuleInsights } from "./executive-management";
import { FinancialOverview, ProjectDeliveryOverview } from "./overview-summaries";
import { projectPerformance, type Widget } from "@/lib/executive";
import {
  CompactMetricCard, PriorityTaskList,
} from "./dashboard-panels";

export function Dashboard() {
  const { openCreate } = useWorkspace();
  const { records, data, prefs } = useExecutiveScope();
  const { setPrefs } = useExecutive();
  const month = prefs.month;
  const [context, setContext] = useState({ greeting: "Welcome back", date: "Studio North workspace", today: "2026-11-02" });
  const summary = summarize(records, month);
  useEffect(() => {
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
    setContext({
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      date: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(now),
      today: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata" }).format(now),
    });
  }, []);
  const projects = projectPerformance(records,data,context.today,prefs).filter(p=>p.status!=="Completed").map(p=>({...p.project,status:p.status as BusinessRecord["status"]}));
  const employees = records.filter(record => record.kind === "employee" && record.status === "Active");
  const leads = records.filter(record => record.kind === "lead" && record.status === "Active");
  const reveal = { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28 } };

  return (
    <div className="bos-overview">
      <motion.header className="bos-editorial-header" {...reveal}>
        <div>
          <h1>Everything, <span>in sync.</span></h1>
          <p>{context.greeting}, Alex. Your people, projects, and possibilities. Connected.</p>
        </div>
        <div className="bos-editorial-controls">
          <span className="bos-context-date"><CalendarDays size={15} />{context.date}</span>
          <div className="bos-page-actions">
            <label className="bos-period"><CalendarDays size={16} /><select aria-label="Financial reporting month" value={month} onChange={event => setPrefs({...prefs,month:event.target.value})}>
              {!["2026-09","2026-10","2026-11"].includes(month)&&<option value={month}>{new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}</option>}
              <option value="2026-09">September 2026</option><option value="2026-10">October 2026</option><option value="2026-11">November 2026</option>
            </select></label>
            <Button variant="primary" onClick={() => openCreate()}><Plus size={17} />Create new</Button>
          </div>
          <span className="bos-reporting-note">Financial summary follows the reporting period. Operations show current records.</span>
        </div>
      </motion.header>
      <ExecutiveFilters />
      {prefs.order.filter(key=>key!=="attention"&&key!=="briefing"&&key!=="trends"&&!prefs.hidden.includes(key)).map(key=><div className="exec-widget" data-widget={key} key={key}>{renderWidget(key)}</div>)}
    </div>
  );
  function renderWidget(key: Widget) {
    switch(key) {
    case "workspace": return <WorkspaceCanvas records={records} month={month} />;
    case "metrics": return <>
      <div className="overview-summary-grid"><FinancialOverview records={records} prefs={prefs}/><ProjectDeliveryOverview records={records} projects={projects} today={context.today}/></div>
      <div className="overview-supporting-metrics"><CompactMetricCard variant="people" records={employees} count={summary.employees}/><CompactMetricCard variant="leads" records={leads} count={summary.leads}/></div>
      </>;
    case "attention": return null;
    case "trends": return null;
    case "operations": return <>
      <div className="bos-section-toolbar"><div><h2>Less noise. More progress.</h2></div><Link href="/tasks" className="bos-text-link">Open all tasks <ArrowUpRight size={16} /></Link></div>
      <div className="bos-command-grid">
        <PriorityTaskList scopedRecords={records} />
        <div className="bos-people-column"><WorkforceReport compact /></div>
      </div>
      </>;
    case "briefing": return null;
    case "assistant": return <RuleInsights />;
    }
  }
}
