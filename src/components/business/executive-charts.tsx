"use client";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/models";
export function ProfitChart({data}:{data:{month:string;profit:number}[]}){return <div className="exec-chart" role="img" aria-label={`Operating profit by month: ${data.map(d=>`${d.month} ${money(d.profit)}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{top:12,right:10,bottom:0,left:0}}><defs><linearGradient id="exec-profit-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0022FF" stopOpacity={.2}/><stop offset="100%" stopColor="#0022FF" stopOpacity={.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#E2E6EF"/><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11}}/><YAxis width={58} tickFormatter={v=>`${Number(v)/1000}k`} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>money(Number(v))}/><Area type="monotone" dataKey="profit" fill="url(#exec-profit-fill)" stroke="none" isAnimationActive={false}/><Line type="monotone" dataKey="profit" stroke="#0022FF" dot={false} isAnimationActive={false}/></ComposedChart></ResponsiveContainer></div>;}
export function CategoryChart({data}:{data:{name:string;value:number}[]}) {
  const categories = [...data].sort((a,b)=>b.value-a.value);
  const total = categories.reduce((sum,category)=>sum+category.value,0);
  const uncategorized = categories.find(category=>category.name==="Uncategorized");
  return <div className="exec-expense-breakdown">
    <div className="exec-expense-total"><div><span>Total paid expenses</span><strong>{money(total)}</strong></div><span className="exec-expense-count">{categories.length} {categories.length===1?"category":"categories"}</span></div>
    <div className="exec-expense-columns" aria-hidden="true"><span>Category</span><span>Amount / share</span></div>
    <ul aria-label="Paid expense breakdown">{categories.map(category=>{
      const share=total>0?category.value/total*100:0;
      return <li key={category.name}><div className="exec-expense-row"><span>{category.name}</span><div><strong>{money(category.value)}</strong><span>{new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(share)}%</span></div></div><div className="exec-expense-track" aria-hidden="true"><span style={{width:`${share}%`}}/></div></li>;
    })}</ul>
    {uncategorized&&uncategorized.value>0&&<p className="exec-expense-note">{money(uncategorized.value)} has no category assigned. Add categories to these expenses for a clearer breakdown.</p>}
  </div>;
}
