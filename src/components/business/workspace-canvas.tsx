"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckSquare2, CircleDollarSign, FolderKanban, Layers3, Plus, TrendingUp, Users } from "lucide-react";
import { money, summarize, type BusinessRecord } from "@/lib/models";
import { Avatar, StatusBadge } from "./primitives";
import { useWorkspace } from "./workspace-provider";

const spaces = [
  { id: "projects", title: "Projects", kind: "project", icon: FolderKanban, caption: "From brief to delivery", detail: "Projects in motion", metric: "projects" },
  { id: "tasks", title: "My work", kind: "task", icon: CheckSquare2, caption: "One next step at a time", detail: "Your next moves", metric: "tasks" },
  { id: "hrms", title: "People", kind: "employee", icon: Users, caption: "The people behind it all", detail: "A connected team", metric: "employees" },
  { id: "crm", title: "Sales", kind: "lead", icon: TrendingUp, caption: "Conversations to opportunities", detail: "Opportunities ahead", metric: "leads" },
  { id: "finance", title: "Finance", kind: "invoice", icon: CircleDollarSign, caption: "Every payment in perspective", detail: "Money in motion", metric: "revenue" },
] as const;

export function WorkspaceCanvas({ records, month }: { records: BusinessRecord[]; month: string }) {
  const [selected, setSelected] = useState(0);
  const folderId = useId().replace(/:/g, "");
  const [filter, setFilter] = useState("All spaces");
  const reduced = useReducedMotion();
  const scene = useRef<HTMLDivElement>(null);
  const { openCreate } = useWorkspace();
  const summary = summarize(records, month);
  const visible = spaces.map((space, index) => ({ ...space, index })).filter(space => filter === "All spaces" || (filter === "Operations" ? space.kind !== "invoice" && space.kind !== "lead" : space.kind === "invoice" || space.kind === "lead"));
  const current = spaces[selected];
  const currentPosition = visible.findIndex(space => space.index === selected);
  const relevant = records.filter(record => record.kind === current.kind && (
    current.kind === "invoice" ? record.date.startsWith(month) :
    current.kind === "task" || current.kind === "project" ? record.status !== "Completed" : record.status === "Active"
  ));
  const value = current.metric === "revenue" ? money(summary.revenue) : String(summary[current.metric]);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const container = scene.current;
    const active = container?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (container && active) container.scrollTo({ left: active.offsetLeft - container.offsetLeft - (container.clientWidth - active.clientWidth) / 2, behavior: reduced ? "instant" : "smooth" });
  }, [selected, filter, reduced]);

  function changeFilter(value: string) {
    setFilter(value);
    const allowed = spaces.map((space, index) => ({ ...space, index })).filter(space => value === "All spaces" || (value === "Operations" ? space.kind !== "invoice" && space.kind !== "lead" : space.kind === "invoice" || space.kind === "lead"));
    if (!allowed.some(space => space.index === selected)) setSelected(allowed[0].index);
  }

  function move(direction: number) {
    setSelected(visible[(currentPosition + direction + visible.length) % visible.length].index);
  }

  return <section className="bos-spatial-workspace" aria-label="Interactive workspace overview">
    <div className="bos-canvas-toolbar">
      <span className="bos-canvas-label"><Layers3 size={15} />Your connected workspace<span className="bos-canvas-demo">DEMO</span></span>
      <div className="bos-canvas-filters" role="group" aria-label="Filter workspace spaces">{["All spaces", "Operations", "Business"].map(item => <button key={item} aria-pressed={filter === item} onClick={() => changeFilter(item)}>{item}</button>)}</div>
      <button className="bos-canvas-add" onClick={() => openCreate(current.kind)}><Plus size={15} />Add record</button>
    </div>
    <div className="bos-canvas-content">
      <div className="bos-folder-stage">
        <div className="bos-canvas-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div ref={scene} className="bos-folder-scene" role="group" aria-label="Choose a workspace space" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
          {visible.map((space, position) => {
            let offset = (position - currentPosition + visible.length) % visible.length;
            if (offset > visible.length / 2) offset -= visible.length;
            const amount = space.metric === "revenue" ? money(summary.revenue) : String(summary[space.metric]);
            const previews = records.filter(record => record.kind === space.kind && (space.kind !== "invoice" || record.date.startsWith(month))).slice(0, 3);
            return <button key={space.id} className={`bos-spatial-folder ${selected === space.index ? "selected" : ""}`} onClick={() => setSelected(space.index)} aria-pressed={selected === space.index} aria-label={`Focus ${space.title}`} style={{ "--folder-offset": offset, "--folder-distance": Math.abs(offset), "--folder-right": offset > 0 ? 1 : 0, zIndex: 10 - Math.abs(offset) } as CSSProperties}>
              <span className="bos-folder-backplate" aria-hidden="true" />
              {["back", "middle", "front"].map((layer, index) => <span key={layer} className={`bos-folder-paper paper-${layer}`} aria-hidden="true"><i /><i /><i /><span className="bos-folder-document"><strong>{previews[index]?.title ?? `${space.title} records`}</strong><small>{previews[index]?.owner ?? "Studio North"}</small><span>{previews[index]?.status ?? "Workspace overview"}</span><i /><i /><i /></span></span>)}
              <svg className="bos-folder-pocket" viewBox="0 0 220 220" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={`${folderId}-${space.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--folder-front-top)" /><stop offset="100%" stopColor="var(--folder-front-bottom)" /></linearGradient></defs><path d="M1 81C1 65 13 53 29 53H71C100 53 112 74 143 74H191C207 74 219 86 219 102V191C219 207 207 219 191 219H29C13 219 1 207 1 191Z" fill={`url(#${folderId}-${space.id})`} /></svg>
              <span className="bos-folder-cover"><span className="bos-folder-cover-top"><space.icon size={22} strokeWidth={1.4} /><ArrowUpRight size={14} /></span><strong>{space.title}</strong><span className="bos-folder-cover-bottom"><span>{amount}</span><i /></span></span>
            </button>;
          })}
        </div>
        <div className="bos-canvas-stage-footer"><span><span className="bos-label-dot" />{current.caption}</span><div><button aria-label="Previous workspace space" onClick={() => move(-1)}><ArrowLeft size={16} /></button><span>{String(currentPosition + 1).padStart(2, "0")}<i>/</i>{String(visible.length).padStart(2, "0")}</span><button aria-label="Next workspace space" onClick={() => move(1)}><ArrowRight size={16} /></button></div></div>
      </div>
      <aside className="bos-space-inspector" aria-label="Selected workspace space details">
        <AnimatePresence mode="wait" initial={false}><motion.div key={current.id} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
          <div className="bos-inspector-heading"><span>IN FOCUS</span><Link href={`/${current.id}`} aria-label={`Open ${current.title}`}><ArrowUpRight size={19} /></Link></div>
          <h2>{current.detail}</h2><div className="bos-inspector-metric"><strong>{value}</strong><span>{current.metric === "revenue" ? "received this month" : current.kind === "employee" ? "active team members" : current.kind === "project" ? "active projects" : current.kind === "lead" ? "active leads" : "open tasks"}</span></div>
          <div className="bos-inspector-records">{relevant.slice(0, 3).map(record => <div key={record.id}>{current.kind === "employee" ? <Avatar name={record.title} small /> : <span className="bos-inspector-record-icon"><current.icon size={14} /></span>}<span><strong>{record.title}</strong>{current.kind === "project" ? <span className="bos-inspector-progress" role="progressbar" aria-label={`${record.title} progress`} aria-valuenow={record.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${record.progress}%` }} /></span> : <small>{record.owner}</small>}</span>{current.kind === "project" ? <small>{record.progress}%</small> : current.kind === "invoice" ? <small>{money(record.amount)}</small> : <StatusBadge status={record.status} />}</div>)}</div>
          {!relevant.length && <p className="bos-inspector-empty">No records here yet. Add a record to get started.</p>}
          <Link className="bos-inspector-open" href={`/${current.id}`}>Explore {current.title.toLowerCase()}<ArrowRight size={15} /></Link>
        </motion.div></AnimatePresence>
      </aside>
    </div>
    <div className="bos-canvas-bottomline"><span>One workspace. Every moving part.</span><span>Current records · financials follow selected month</span></div>
  </section>;
}
