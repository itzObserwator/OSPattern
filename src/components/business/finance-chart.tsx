"use client";

import { useId, useState } from "react";
import { Area, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, usePlotArea, useXAxisScale, useYAxisScale } from "recharts";
import { money, financialSeries, type BusinessRecord } from "@/lib/models";

// Illustrative profile traced from the reference, separate from cash records.
const referenceArea = [.09, .17, .06, .36, .31, .45, .39, .34, .25, .18, .23, .15, .52, .57, .59, .24, .16, .48, .59, .51, .7];
const referenceTrend = [.22, .42, .22, .5, .42, .7];

function SelectedMonth({ position, value, label, patternId }: { position: number; value: number; label: string; patternId: string }) {
  const plot = usePlotArea();
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const x = xScale?.(position);
  const y = yScale?.(value);
  if (!plot || x === undefined || y === undefined) return null;
  const badgeX = Math.max(plot.x, Math.min(x - 42, plot.x + plot.width - 84));
  return <g aria-hidden="true" pointerEvents="none">
    <rect x={x - 11} y={y} width={22} height={Math.max(0, plot.y + plot.height - y)} fill={`url(#${patternId})`} />
    <g transform={`translate(${badgeX},${Math.max(4, y - 44)}) rotate(-5 42 17)`}>
      <rect width={84} height={34} rx={13} fill="#E6E9FF" />
      <text x={42} y={22} textAnchor="middle" fill="#0022FF" fontSize={12} fontWeight={500}>{label}</text>
    </g>
    <circle cx={x} cy={y} r={4.5} fill="#0022FF" stroke="#FFFFFF" strokeWidth={2} />
  </g>;
}

export default function FinanceChart({ records, month }: { records: BusinessRecord[]; month: string }) {
  const id = useId().replace(/:/g, "");
  const data = financialSeries(records, month);
  const [selected, setSelected] = useState(3);
  const [illustrative, setIllustrative] = useState(false);
  const active = data[selected];
  const plotData = illustrative
    ? referenceArea.map((value, index) => ({ position: index, area: value, trend: index % 4 === 0 ? referenceTrend[index / 4] : null, expenses: 0 }))
    : data.map((row, index) => ({ position: index * 4, area: row.revenue, trend: row.revenue, expenses: row.expenses }));
  const sorted = (illustrative ? [...referenceTrend] : data.map(row => row.revenue)).sort((a, b) => a - b);
  const median = (sorted[2] + sorted[3]) / 2;
  const average = sorted.reduce((total, value) => total + value, 0) / sorted.length;
  const format = (value: number) => illustrative ? value.toFixed(2) : money(value);
  const compact = (value: number) => illustrative ? value.toFixed(2) : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(value);
  const year = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 6 + selected, 1)).getUTCFullYear();
  return <div className="bos-momentum-visual">
    <div className="bos-momentum-mode"><div role="group" aria-label="Financial momentum chart data"><button type="button" aria-pressed={illustrative} onClick={() => setIllustrative(true)}>Reference curve</button><button type="button" aria-pressed={!illustrative} onClick={() => setIllustrative(false)}>Recorded data</button></div><span>{illustrative ? "Illustrative index · not recorded revenue" : "Recorded monthly revenue · INR"}</span></div>
    <div className="bos-momentum-statistics"><span><strong>{illustrative ? referenceArea.length : data.length}</strong> {illustrative ? "shape points" : "monthly points"}</span><dl>{[["Min", sorted[0]], ["Max", sorted[5]], ["Median", median], ["Average", average]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{compact(Number(value))}</dd></div>)}</dl></div>
    <div className="bos-chart bos-momentum-chart" aria-label={illustrative ? "Illustrative reference profile with a wavy area and six smooth trend pivots. Select Recorded data to view cash records." : `Monthly revenue and expenses ending ${month}. Select a month on the timeline for exact figures.`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={plotData} margin={{ top: 36, right: 30, left: 30, bottom: 4 }} accessibilityLayer onMouseMove={state => { const index = Number(state.activeTooltipIndex); if (state.activeTooltipIndex != null && Number.isInteger(index) && index >= 0 && index < plotData.length) setSelected(illustrative ? Math.round(index / 4) : index); }}>
          <defs>
            <linearGradient id={`${id}-revenue`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#B8C6E8" stopOpacity={0.7} /><stop offset="100%" stopColor="#DCE4F4" stopOpacity={0.8} /></linearGradient>
            <pattern id={`${id}-stripe`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#8198CD" fillOpacity={0.3} /><rect width="5" height="10" fill="#FFFFFF" fillOpacity={0.9} /></pattern>
          </defs>
          <XAxis dataKey="position" type="number" domain={[0, 20]} hide padding={{ left: 0, right: 0 }} />
          <YAxis hide domain={[0, (max: number) => Math.max(illustrative ? .75 : 1, max * 1.08)]} />
          <Tooltip content={() => null} cursor={false} />
          <Area name={illustrative ? "Illustrative profile" : "Revenue area"} type="natural" dataKey="area" stroke="none" fill={`url(#${id}-revenue)`} activeDot={false} isAnimationActive={false} />
          {!illustrative && <Area name="Expenses" type="natural" dataKey="expenses" stroke="none" fill="#E2E8F0" fillOpacity={0.5} activeDot={false} isAnimationActive={false} />}
          <Line name={illustrative ? "Illustrative trend" : "Revenue"} type="natural" dataKey="trend" connectNulls stroke="#334EFF" strokeWidth={1.2} dot={{ r: 3, fill: "#0022FF", stroke: "#FFFFFF", strokeWidth: 1.5 }} activeDot={false} isAnimationActive={false} />
          <SelectedMonth position={selected * 4} value={illustrative ? referenceTrend[selected] : active.revenue} label={format(illustrative ? referenceTrend[selected] : active.revenue)} patternId={`${id}-stripe`} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="bos-momentum-timeline">
      <input type="range" min={0} max={5} step={1} value={selected} onChange={event => setSelected(Number(event.target.value))} aria-label="Select financial momentum month" aria-valuetext={illustrative ? `${active.month} ${year}: illustrative index ${referenceTrend[selected].toFixed(2)}` : `${active.month} ${year}: revenue ${money(active.revenue)}, expenses ${money(active.expenses)}`} />
      <div className="bos-momentum-months" aria-hidden="true">{data.map((row, index) => <span key={row.month} className={index === selected ? "active" : ""}>{row.month}</span>)}</div>
      <output aria-live="polite"><span>{active.month} {year}</span>{illustrative ? <span>Illustrative index <strong>{referenceTrend[selected].toFixed(2)}</strong></span> : <span>Revenue <strong>{money(active.revenue)}</strong><i />Expenses <strong>{money(active.expenses)}</strong></span>}</output>
    </div>
  </div>;
}
