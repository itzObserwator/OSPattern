import type { ReactNode } from "react";
import { Layers3, CheckCircle2, AlertCircle, Clock3, CircleDashed, type LucideIcon } from "lucide-react";

export function StatusBadge({status}: {status: string}) {
  const success = ["On track", "Active", "Completed", "Paid"].includes(status);
  const warn = ["At risk", "Pending"].includes(status);
  const neutral = ["Draft", "Planned", "Not connected", "Preview"].includes(status);
  const Icon = success ? CheckCircle2 : warn ? Clock3 : neutral ? CircleDashed : AlertCircle;
  return <span className={`bos-badge ${success ? "success" : warn ? "warning" : neutral ? "neutral" : "danger"}`}><Icon size={12}/>{status}</span>;
}
export function Avatar({name, small = false}: {name: string; small?: boolean}) {
  const tone = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4;
  return <span className={`bos-avatar avatar-tone-${tone} ${small ? "small" : ""}`} aria-label={name}>{name.split(" ").slice(0, 2).map(n => n[0]).join("")}</span>;
}
export function Card({title, subtitle, action, children, className = ""}: {title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string}) {
  return <section className={`bos-card ${className}`}><header className="bos-card-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>;
}
export function EmptyState({title, children, action, icon: Icon = Layers3}: {title: string; children: ReactNode; action?: ReactNode; icon?: LucideIcon}) {
  return <div className="bos-empty"><div className="bos-empty-stack" aria-hidden="true"><span/><span/><span><Icon size={32} strokeWidth={1.2}/></span></div><span className="bos-panel-index">A SPACE FOR WHAT’S NEXT</span><h2>{title}</h2><p>{children}</p>{action}</div>;
}
