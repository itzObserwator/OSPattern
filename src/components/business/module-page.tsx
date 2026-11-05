"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckSquare2, CircleDashed, Database, FolderKanban, Globe2, Layers3, LockKeyhole, MessageSquare, Plus, Search, Send, Settings2, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { modules, navigation } from "@/lib/navigation";
import { money, type BusinessRecord, type RecordKind } from "@/lib/models";
import { useWorkspace } from "./workspace-provider";
import { DataTable } from "./data-table";
import { WorkflowShowcase, ClientPortalShowcase, SandboxShowcase } from "./module-showcases";
import { ExecutiveFilters } from "./executive-controls";
import { useExecutive } from "./executive-provider";
import { useExecutiveScope } from "./executive-controls";
import { FinancialIntelligence, ProjectPerformance, WorkforceReport, SalesReport, MarketingReport } from "./executive-panels";
import { ManagementData, GoalsPanel } from "./executive-management";
import { RecordDeepLink } from "./record-inspector";
import { EmptyState } from "./primitives";
import { Button } from "../ui/button";

type Lookup = { question: string; answer: string };

function CollectionSummary({ records, kind }: { records: BusinessRecord[]; kind: RecordKind }) {
  const active = records.filter(record => !["Completed", "Paid"].includes(record.status)).length;
  const value = records.reduce((total, record) => total + record.amount, 0);
  const average = records.length ? Math.round(records.reduce((total, record) => total + record.progress, 0) / records.length) : 0;
  const items = [
    { label: "Records in this collection", value: String(records.length), icon: Layers3 },
    { label: kind === "invoice" || kind === "expense" ? "Paid records" : "Active records", value: String(kind === "invoice" || kind === "expense" ? records.filter(record => record.status === "Paid").length : active), icon: CheckSquare2 },
    { label: kind === "project" ? "Average recorded progress" : kind === "task" ? "Completed tasks" : kind === "employee" ? "Teams in this directory" : "Recorded value · INR", value: kind === "project" ? `${average}%` : kind === "task" ? String(records.filter(record => record.status === "Completed").length) : kind === "employee" ? String(new Set(records.map(record => record.owner)).size) : money(value), icon: kind === "project" ? TrendingUp : kind === "task" ? CheckSquare2 : kind === "employee" ? Globe2 : Wallet },
  ];
  return <div className="bos-collection-summary">{items.map(item => <div key={item.label}><span className="bos-summary-icon"><item.icon size={18} strokeWidth={1.4} /></span><div><span>{item.label}</span><strong>{item.value}</strong></div></div>)}</div>;
}

function AssistantWorkspace({ records }: { records: BusinessRecord[] }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Lookup[]>([]);
  const prompts = [
    { text: "Show open tasks", icon: CheckSquare2, detail: "Find your next move" },
    { text: "Summarize project health", icon: FolderKanban, detail: "See the delivery picture" },
    { text: "Find active sales leads", icon: TrendingUp, detail: "Explore opportunities" },
  ];
  function ask(text: string) {
    if (!text.trim()) return;
    const query = text.toLowerCase();
    const relevant = query.includes("task") ? records.filter(record => record.kind === "task" && record.status !== "Completed") : query.includes("project") ? records.filter(record => record.kind === "project") : query.includes("lead") ? records.filter(record => record.kind === "lead" && record.status === "Active") : [];
    const answer = relevant.length ? `Local demo lookup · ${relevant.length} matching records:\n${relevant.slice(0, 6).map(record => `${record.title} — ${record.status} (${record.owner})`).join("\n")}` : "This demo supports local lookups for tasks, projects, and leads. A language model and external data sources are not connected.";
    setMessages(current => [...current, { question: text.trim(), answer }]);
    setQuestion("");
  }
  return <section className="bos-assistant-shell">
    <aside className="bos-assistant-context"><div className="bos-assistant-context-header"><span className="bos-node-glyph"><Sparkles size={22} /></span><span><strong>Workspace assistant</strong><small>Local record lookup</small></span></div>
      <Button onClick={() => { setMessages([]); setQuestion(""); }}><Plus size={16} />New lookup</Button>
      <span className="bos-panel-index">YOUR CONTEXT</span><div className="bos-context-sources">{[{ kind: "project", title: "Projects", href: "/projects", icon: FolderKanban }, { kind: "task", title: "Tasks", href: "/tasks", icon: CheckSquare2 }, { kind: "lead", title: "Sales leads", href: "/crm", icon: TrendingUp }].map(source => <Link key={source.kind} href={source.href}><source.icon size={16} /><span>{source.title}</span><strong>{records.filter(record => record.kind === source.kind).length}</strong><ArrowUpRight size={13} /></Link>)}</div>
      <div className="bos-assistant-session"><span className="bos-panel-index">THIS SESSION</span>{messages.length ? messages.slice(-4).map((message, index) => <div key={`${index}-${message.question}`}><MessageSquare size={13} /><span>{message.question}</span></div>) : <p>Your questions will appear here.</p>}</div>
      <div className="bos-assistant-context-note"><CircleDashed size={16} /><p>No live AI provider.<br />Answers use this browser’s records.</p></div>
    </aside>
    <div className="bos-ai-workspace"><header className="bos-conversation-bar"><span><span className="bos-label-dot" />A little more perspective</span><span>DEMO LOOKUP</span></header>
      {!messages.length && <div className="bos-ai-intro"><div className="bos-assistant-orbit" aria-hidden="true"><span /><span /><Sparkles size={30} /></div><span className="bos-panel-index">CONTEXT, WITHOUT THE CLUTTER</span><h2>What’s on your mind?</h2><p>A question can be a good place to start.<br />Find what matters across your workspace records.</p><div className="bos-prompt-grid">{prompts.map(prompt => <button key={prompt.text} onClick={() => ask(prompt.text)}><prompt.icon size={20} /><strong>{prompt.text}</strong><span>{prompt.detail}<ArrowUpRight size={14} /></span></button>)}</div></div>}
      <div className="bos-messages" aria-live="polite">{messages.map((message, index) => <div className="bos-conversation-pair" key={index}><div className="bos-user-question"><span>YOU</span><strong>{message.question}</strong></div><div className="bos-lookup-answer"><span className="bos-answer-icon"><Sparkles size={17} /></span><div><span>WORKSPACE LOOKUP</span><p>{message.answer}</p></div></div></div>)}</div>
      <form className="bos-ai-input" onSubmit={event => { event.preventDefault(); ask(question); }}><label htmlFor="ai-question" className="sr-only">Ask about demo records</label><input id="ai-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about tasks, projects, or leads…" /><Button type="submit" variant="primary" size="icon" aria-label="Send question" disabled={!question.trim()}><Send size={17} /></Button></form><p className="bos-composer-note">Local record lookup · no external data access or automated actions</p>
    </div>
  </section>;
}

function WorkspaceSettings() {
  return <div className="bos-settings-grid"><section className="bos-settings-profile"><span className="bos-settings-workspace-mark">N<ArrowUpRight size={18} /></span><span className="bos-panel-index">YOUR WORKSPACE</span><h2>Studio North</h2><p>A connected space for your people,<br />projects, and next possibilities.</p><span className="bos-environment-pill"><span className="bos-label-dot" />Browser-local demonstration</span><div className="bos-settings-profile-footer"><Layers3 size={15} />Techgy Link · Agency workspace</div></section>
    <section className="bos-card bos-settings"><header className="bos-settings-heading"><span className="bos-node-glyph"><Settings2 size={20} /></span><div><span className="bos-panel-index">THE FOUNDATIONS</span><h2>Workspace information</h2></div></header><dl><dt>Organization</dt><dd>Studio North · sample agency</dd><dt>Currency</dt><dd>INR · Indian rupee</dd><dt>Reporting</dt><dd>Revenue is received payments; expenses are paid outflows. Net cash movement is revenue less expenses.</dd><dt>Typography</dt><dd>Brutel, loaded from the supplied local font assets. Inter remains a fallback.</dd><dt>Storage</dt><dd>Demo records are stored in this browser. They are not shared with other devices.</dd></dl></section>
    <section className="bos-settings-integrations"><div className="bos-settings-heading"><span className="bos-node-glyph"><LockKeyhole size={20} /></span><div><span className="bos-panel-index">CONNECTION STATUS</span><h2>A clear view of what’s connected.</h2></div></div><div>{[{ title: "Business data", text: "Sample records and browser storage", status: "Local demo", icon: Database }, { title: "Identity & permissions", text: "Authentication and tenant isolation pending", status: "Not connected", icon: LockKeyhole }, { title: "AI & automation", text: "Provider and execution engine pending", status: "Not connected", icon: Sparkles }].map(item => <div key={item.title}><item.icon size={18} /><span><strong>{item.title}</strong><small>{item.text}</small></span><span className="bos-neutral-pill">{item.status}</span></div>)}</div></section>
  </div>;
}

export function ModulePage({ slug }: { slug: string }) {
  const module = modules.find(item => item.slug === slug)!;
  const group = navigation.find(group => group.items.some(item => item.slug === slug));
  const { openCreate } = useWorkspace();
  const { records, prefs } = useExecutiveScope();
  const { setPrefs } = useExecutive();
  const [stageFilter,setStageFilter]=useState("All stages");

  const [financeView, setFinanceView] = useState<"invoice" | "expense">("invoice");
  const kind = "kind" in module ? module.kind as RecordKind : undefined;
  const selectedKind = slug === "finance" ? financeView : kind;
  const data = records.filter(record => record.kind === selectedKind && (slug!=="crm"||stageFilter==="All stages"||record.stage===stageFilter));
  const Icon = module.icon;
  return <div className={`bos-module-page module-${slug} ${["tasks","projects","hrms","crm","marketing","finance","workflows","client-portal","sandbox"].includes(slug)?"bos-studio-module":""}`}><Link href="/" className="bos-back-link"><ArrowLeft size={14} />Workspace overview</Link>
    <header className="bos-module-hero"><div className="bos-module-title"><span className="bos-module-symbol"><Icon size={28} strokeWidth={1.3} /></span><div><span className="bos-panel-index">{group?.label.toUpperCase()} <i>/</i> STUDIO NORTH</span><h1>{module.label}</h1><p>{module.description}</p></div></div>{kind && <Button variant="primary" onClick={() => openCreate(selectedKind)}><Plus size={16} />Create {selectedKind}</Button>}</header>
    {["finance","projects","hrms","crm","marketing"].includes(slug)&&<ExecutiveFilters compact/>}
    {slug==="finance"&&<FinancialIntelligence/>}{slug==="projects"&&<ProjectPerformance/>}{slug==="hrms"&&<WorkforceReport/>}{slug==="crm"&&<SalesReport/>}
    <Suspense fallback={null}><RecordDeepLink/>{slug==="crm"&&<CRMStageSync onChange={setStageFilter}/>}</Suspense>
    {kind ? <><CollectionSummary records={data} kind={selectedKind!} />{slug === "finance" && <div className="bos-tabs" role="group" aria-label="Financial record type">{(["invoice", "expense"] as const).map(type => <Button key={type} aria-pressed={financeView === type} variant={financeView === type ? "primary" : "ghost"} onClick={() => setFinanceView(type)}>{type === "invoice" ? "Received payments" : "Paid expenses"}</Button>)}</div>}{slug === "crm"&&<label className="exec-report-period">Funnel stage<select aria-label="CRM funnel stage" value={stageFilter} onChange={e=>setStageFilter(e.target.value)}>{["All stages","New Lead","Contacted","Qualified","Proposal Sent","Negotiation","Won","Lost"].map(stage=><option key={stage}>{stage}</option>)}</select></label>}<DataTable key={selectedKind} records={data} title={slug === "finance" ? financeView === "invoice" ? "Received payments" : "Paid expenses" : module.label} /></> : slug === "ai-assistant" ? <AssistantWorkspace records={records} /> : slug === "settings" ? <><WorkspaceSettings /><ManagementData /><GoalsPanel /></> : slug === "marketing" ? <MarketingReport /> : slug === "workflows" ? <WorkflowShowcase /> : slug === "client-portal" ? <ClientPortalShowcase /> : slug === "sandbox" ? <SandboxShowcase /> : <section className={`bos-planned-module planned-${slug}`}><div className="bos-planned-topline"><span><CircleDashed size={14} />PLANNED WORKSPACE</span><span>PREVIEW</span></div><EmptyState icon={Icon} title={`${module.label} is planned for a later phase`} action={<Button asChild><Link href="/">Return to overview<ArrowRight size={15} /></Link></Button>}>{slug === "workflows" ? "The visual editor and execution engine are not connected. This module will use React Flow when workflow development begins." : slug === "sandbox" ? "This demo does not provide an isolated runtime or publishing controls." : slug === "client-portal" ? "A secure customer workspace requires authenticated client access and tenant-scoped records." : "Campaigns, content scheduling, and integration-backed reporting will be developed in a later phase."}</EmptyState><div className="bos-planned-footer"><Layers3 size={15} />Part of your connected Techgy Link workspace<span>Design preview · functionality pending</span></div></section>}
  </div>;
}

function CRMStageSync({onChange}:{onChange:(value:string)=>void}){const stage=useSearchParams().get("stage");useEffect(()=>onChange(stage||"All stages"),[stage,onChange]);return null;}
