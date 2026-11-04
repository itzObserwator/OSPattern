"use client";

import { useId, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import type { BusinessRecord } from "@/lib/models";

const statuses = [
  { name: "On track", color: "#99A7FF" },
  { name: "At risk", color: "#C0CAD6" },
  { name: "Delayed", color: "#3F485D" },
  { name: "Other", color: "#E2E8F0" },
];

export default function DeliveryPulseChart({ projects }: { projects: BusinessRecord[] }) {
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
    return <g aria-hidden="true" pointerEvents="none"><rect x={badgeX} y={badgeY} width={58} height={34} rx={13} fill="#E6E9FF" /><text x={badgeX + 29} y={badgeY + 22} textAnchor="middle" fill="#0022FF" fontSize={13} fontWeight={500}>{percent}%</text><circle cx={x} cy={y} r={3.5} fill="#FFFFFF" stroke="#99A7FF" strokeWidth={1} /></g>;
  };
  return <div className="bos-pulse-breakdown">
    <div className="bos-pulse-legend" role="group" aria-label="Project status breakdown">{data.map(status => <button key={status.name} type="button" aria-pressed={current === status.name} disabled={!status.value} onPointerEnter={() => { if (status.value) setSelected(status.name); }} onFocus={() => setSelected(status.name)} onClick={() => setSelected(status.name)}><i className={current === status.name ? "striped" : ""} style={{ backgroundColor: status.color }} /><span>{status.name}</span><strong>{status.value}</strong></button>)}</div>
    <div className="bos-pulse-ring" role="img" aria-label={projects.length ? `${projects.length} active projects: ${data.map(row => `${row.value} ${row.name.toLowerCase()}`).join(", ")}` : "No active projects"}>
      {projects.length ? <ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart>
        <defs><pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(42)"><rect width="10" height="10" fill="#E6E9FF" /><rect width="5" height="10" fill="#99A7FF" /></pattern></defs>
        <Pie data={plotData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="57%" outerRadius="85%" startAngle={150} endAngle={-210} paddingAngle={3} cornerRadius={8} stroke="none" labelLine={false} label={label} isAnimationActive={false} onMouseEnter={(_, index) => setSelected(plotData[index].name)} onClick={(_, index) => setSelected(plotData[index].name)}>{plotData.map(row => <Cell key={row.name} fill={row.name === current ? `url(#${id})` : row.color} />)}</Pie>
        <text className="bos-pulse-center-value" x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#111625" fontSize={30} fontWeight={400}>{projects.length}</text>
        <text className="bos-pulse-center-label" x="50%" y="58%" textAnchor="middle" fill="#5C6F8A" fontSize={10}>{projects.length === 1 ? "active project" : "active projects"}</text>
      </PieChart></ResponsiveContainer> : <div className="bos-pulse-empty"><strong>0</strong><span>No active projects</span></div>}
    </div>
    <p className="bos-pulse-selection" aria-live="polite">{selectedStatus ? <><span>{selectedStatus.name}</span><strong>{percent}%</strong><span>of active projects</span></> : "Create a project to see its delivery status."}</p>
  </div>;
}
