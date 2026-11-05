"use client";

import { useId, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import type { BusinessRecord } from "@/lib/models";

const statuses = [
  { name: "On track", color: "#0022FF" },
  { name: "At risk", color: "#94A3B8" },
  { name: "Delayed", color: "#0B1024" },
  { name: "Other", color: "#E2E8F0" },
];

export default function DeliveryPulseChart({ projects, integrated = false }: { projects: BusinessRecord[]; integrated?: boolean }) {
  const id = useId().replace(/:/g, "");
  const data = statuses.map(status => ({ ...status, value: projects.filter(project => status.name === "Other" ? !statuses.slice(0, 3).some(item => item.name === project.status) : project.status === status.name).length })).filter(status => status.name !== "Other" || status.value > 0);
  const plotData = data.filter(status => status.value > 0);
  const [selected, setSelected] = useState("On track");
  const selectedStatus = data.find(row => row.name === selected && row.value > 0) ?? data.find(row => row.value > 0);
  const current = selectedStatus?.name;
  const percent = selectedStatus && projects.length ? Math.round(selectedStatus.value / projects.length * 100) : 0;
  const label = (props: PieLabelRenderProps) => {
    if (props.name !== current) return null;
    const angle = -Number(props.midAngle) * Math.PI / 180;
    const cx = Number(props.cx), cy = Number(props.cy), radius = Number(props.outerRadius);
    const x = cx + radius * Math.cos(angle), y = cy + radius * Math.sin(angle);
    const badgeX = Math.max(2, Math.min(x - 29, cx * 2 - 60));
    const badgeY = Math.max(2, Math.min(y - 38, cy * 2 - 34));
    return <g aria-hidden="true" pointerEvents="none"><rect x={badgeX} y={badgeY} width={58} height={34} rx={10} fill="#FFFFFF" stroke="#E2E6EF" strokeWidth={1} /><text x={badgeX + 29} y={badgeY + 22} textAnchor="middle" fill="#0022FF" fontSize={13} fontWeight={500}>{percent}%</text><circle cx={x} cy={y} r={3.5} fill="#FFFFFF" stroke="#99A7FF" strokeWidth={1} /></g>;
  };
  return <div className={`bos-pulse-breakdown ${integrated ? "overview-integrated-pulse" : ""}`}>
    <div className="bos-pulse-legend" role="group" aria-label="Project status breakdown">{data.map(status => <button key={status.name} type="button" aria-pressed={current === status.name} disabled={!status.value} onPointerEnter={() => { if (status.value) setSelected(status.name); }} onFocus={() => setSelected(status.name)} onClick={() => setSelected(status.name)}><i className={current === status.name ? "striped" : ""} style={{ backgroundColor: status.color }} /><span>{status.name}</span><strong>{status.value}</strong></button>)}</div>
    <div className="bos-pulse-ring" role="img" aria-label={projects.length ? `${projects.length} active projects: ${data.map(row => `${row.value} ${row.name.toLowerCase()}`).join(", ")}` : "No active projects"}>
      {projects.length ? <ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart>
        <defs>
          {data.map((row,index)=><linearGradient key={row.name} id={`${id}-segment-${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={row.color} stopOpacity=".55"/><stop offset="100%" stopColor={row.color}/></linearGradient>)}
          <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="7" height="7" fill={selectedStatus?.color||"#0022FF"}/><rect width="1.5" height="7" fill="#FFFFFF" fillOpacity=".24"/></pattern>
          <radialGradient id={`${id}-center`}><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#F1F4FC"/></radialGradient>
        </defs>
        {!integrated && <circle cx="50%" cy="50%" r="43%" fill="none" stroke="#E7ECF6" strokeWidth="1" strokeDasharray="1 5"/>}
        <circle cx="50%" cy="50%" r="27%" fill={`url(#${id}-center)`} stroke="#E9EDF6" strokeWidth="1"/>
        <Pie data={plotData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="62%" outerRadius="82%" startAngle={150} endAngle={-210} paddingAngle={5} cornerRadius={7} stroke="#FFFFFF" strokeWidth={1} labelLine={false} label={integrated ? false : label} isAnimationActive={false} onMouseEnter={(_, index) => setSelected(plotData[index].name)} onClick={(_, index) => setSelected(plotData[index].name)}>{plotData.map(row => <Cell key={row.name} fill={row.name === current ? `url(#${id})` : `url(#${id}-segment-${data.findIndex(item=>item.name===row.name)})`} />)}</Pie>
        <text className="bos-pulse-center-value" x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#111625" fontSize={30} fontWeight={400}>{projects.length}</text>
        <text className="bos-pulse-center-label" x="50%" y="58%" textAnchor="middle" fill="#5C6F8A" fontSize={10}>{projects.length === 1 ? "active project" : "active projects"}</text>
      </PieChart></ResponsiveContainer> : <div className="bos-pulse-empty"><strong>0</strong><span>No active projects</span></div>}
    </div>
    <p className={integrated ? "sr-only" : "bos-pulse-selection"} aria-live="polite">{selectedStatus ? <><span>{selectedStatus.name}</span><strong>{percent}%</strong><span>of active projects</span></> : "Create a project to see its delivery status."}</p>
  </div>;
}
