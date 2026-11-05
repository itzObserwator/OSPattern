"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Bell, ChevronsLeft, Command, HelpCircle, Menu, PanelTop, Search, Settings2, Sparkles, X } from "lucide-react";
import { modules, navigation } from "@/lib/navigation";
import { useWorkspace } from "./workspace-provider";
import { Avatar, StatusBadge } from "./primitives";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const reduced = useReducedMotion();
  const active = (slug: string) => path === `/${slug}` || Boolean(slug) && path.startsWith(`/${slug}/`);
  return <nav aria-label="Main navigation" className="bos-nav">
    {navigation.map((group, index) => <div className="bos-nav-group" key={group.label}>
      <h2><span>{String(index + 1).padStart(2, "0")}</span>{group.label}</h2>
      {group.items.map(item => <Link key={item.slug} href={`/${item.slug}`} onClick={onNavigate} className={`bos-nav-item ${active(item.slug) ? "active" : ""}`} aria-current={active(item.slug) ? "page" : undefined} aria-label={item.label} title={item.label}>
        {active(item.slug) && <motion.span className="bos-nav-current" layoutId={onNavigate ? "mobile-nav-current" : "desktop-nav-current"} transition={{ duration: reduced ? 0 : 0.22 }} />}
        <item.icon size={18} strokeWidth={1.65} /><span className="bos-nav-label">{item.label}</span>{item.slug === "ai-assistant" && <span className="bos-new">AI</span>}{item.slug === "" && <span className="bos-nav-location" />}
      </Link>)}
    </div>)}
  </nav>;
}

function Brand() {
  return <Link href="/" className="bos-brand" aria-label="Techgy Link overview"><Image className="bos-techgy-logo" src="/techgy-link-logo.png" alt="" width={32} height={32} /><span className="bos-brand-copy"><strong>Techgy Link</strong><small>OSPattern</small></span></Link>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [profile, setProfile] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const current = modules.find(item => `/${item.slug}` === pathname || Boolean(item.slug) && pathname.startsWith(`/${item.slug}/`));
  const { records } = useWorkspace();
  const matches = search.trim() ? records.filter(record => `${record.title} ${record.owner}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 7) : [];
  const record = records.find(record => record.id === detail);

  useEffect(() => {
    const commandSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchInput.current?.focus(); }
      if (event.key === "Escape") setSearch("");
    };
    window.addEventListener("keydown", commandSearch);
    return () => window.removeEventListener("keydown", commandSearch);
  }, []);

  return <div className={`bos-app ${collapsed ? "is-collapsed" : ""}`}>
    <a className="bos-skip" href="#main">Skip to content</a>
    <aside className="bos-sidebar">
      <div className="bos-sidebar-brand"><Brand /><Button variant="ghost" size="icon" className="bos-collapse-control" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}><ChevronsLeft size={16} /></Button></div>
      <Navigation collapsed={collapsed} />
      <div className="bos-sidebar-bottom"><Link href="/ai-assistant" className="bos-sidebar-ai"><span className="bos-sidebar-ai-mark"><Sparkles size={20} /></span><span><strong>A different perspective.</strong><small>Explore your AI workspace</small></span><ArrowUpRight size={16} /></Link><button className="bos-sidebar-profile" onClick={() => setProfile(true)} aria-label="Open Alex Morgan profile"><Avatar name="Alex Morgan" /><span><strong>Alex Morgan</strong><small>Workspace admin · demo</small></span><Settings2 size={16} /></button></div>
    </aside>
    <div className="bos-app-body">
      <header className="bos-topbar">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogTrigger asChild><Button className="bos-mobile-toggle" size="icon" variant="ghost" aria-label="Open navigation"><Menu size={22} /></Button></DialogTrigger><DialogContent className="bos-mobile-nav"><DialogTitle className="sr-only">Workspace navigation</DialogTitle><DialogDescription className="sr-only">Choose a Techgy Link module.</DialogDescription><Brand /><Navigation onNavigate={() => setMobileOpen(false)} /></DialogContent></Dialog>
        <div className="bos-breadcrumb"><PanelTop size={16} /><span>Workspace</span><i>/</i><strong>{current?.label ?? "Workspace"}</strong></div>
        <div className="bos-topbar-tools">
          <div className="bos-search"><Search size={17} /><input ref={searchInput} aria-label="Search workspace records" placeholder="Find your next move…" value={search} onChange={event => setSearch(event.target.value)} />{search ? <button aria-label="Clear search" onClick={() => { setSearch(""); searchInput.current?.focus(); }}><X size={15} /></button> : <kbd><Command size={11} />K</kbd>}
            {search.trim() && <div className="bos-search-results" role="region" aria-label="Workspace search results"><small>RECORDS IN YOUR WORKSPACE</small>{matches.length ? matches.map(record => <button key={record.id} onClick={() => { setDetail(record.id); setSearch(""); }}><strong>{record.title}</strong><span>{record.kind} · {record.owner}</span></button>) : <p>No records match “{search}”.</p>}</div>}
          </div>
          <Button asChild variant="ghost" size="icon" className="bos-ai-shortcut"><Link href="/ai-assistant" aria-label="Open AI Assistant"><Sparkles size={19} /></Link></Button>
          <Button variant="ghost" size="icon" aria-label="Open notifications" onClick={() => setNotifications(true)}><span className="bos-notification-icon"><Bell size={19} />{records.some(record => record.kind === "task" && record.status !== "Completed") && <i />}</span></Button>
          <span className="bos-topbar-divider" />
          <Button asChild variant="ghost" size="icon" className="bos-workspace-controls"><Link href="/settings" aria-label="Workspace settings"><Settings2 size={19} /></Link></Button>
          <button className="bos-profile" aria-label="Workspace profile" onClick={() => setProfile(true)}><Avatar name="Alex Morgan" /></button>
        </div>
      </header>
      <main id="main" className="bos-main"><motion.div className="bos-route-view" key={pathname} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.22 }}>{children}</motion.div>{pathname !== "/" && <footer className="bos-content-footer"><span>Techgy Link / Your business. One intelligent workspace.</span><Link href="/settings"><HelpCircle size={14} /> Workspace information</Link></footer>}</main>
    </div>
    <Dialog open={profile} onOpenChange={setProfile}><DialogContent><DialogTitle>Your demo workspace</DialogTitle><DialogDescription>Alex Morgan · Studio North</DialogDescription><p>This preview uses a sample admin identity. Authentication and role enforcement are not connected.</p><Button asChild><Link href="/settings">View workspace settings</Link></Button></DialogContent></Dialog>
    <Dialog open={notifications} onOpenChange={setNotifications}><DialogContent><DialogTitle>Needs your attention</DialogTitle><DialogDescription>Open and at-risk tasks in the demo workspace.</DialogDescription><div className="bos-notification-list">{records.filter(record => record.kind === "task" && record.status !== "Completed").slice(0, 4).map(record => <button key={record.id} onClick={() => { setDetail(record.id); setNotifications(false); }}><Bell size={16} /><span><strong>{record.title}</strong><small>{record.owner} · Due {record.date}</small></span></button>)}{!records.some(record => record.kind === "task" && record.status !== "Completed") && <p>No open tasks. You’re all caught up.</p>}</div></DialogContent></Dialog>
    <Dialog open={!!record} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent><DialogTitle>{record?.title}</DialogTitle><DialogDescription>Demo {record?.kind} details</DialogDescription>{record && <dl className="bos-record-detail"><dt>Owner</dt><dd>{record.owner}</dd><dt>Date</dt><dd>{record.date}</dd><dt>Status</dt><dd><StatusBadge status={record.status} /></dd></dl>}</DialogContent></Dialog>
  </div>;
}
