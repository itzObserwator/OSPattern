"use client";
import Link from "next/link";
import { ArrowUpRight, FolderOpen, Check } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, type BusinessRecord } from "@/lib/models";
export function ProfitChart({data}:{data:{month:string;profit:number}[]}){return <div className="exec-chart" role="img" aria-label={`Operating profit by month: ${data.map(d=>`${d.month} ${money(d.profit)}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{top:12,right:10,bottom:0,left:0}}><defs><linearGradient id="exec-profit-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0022FF" stopOpacity={.2}/><stop offset="100%" stopColor="#0022FF" stopOpacity={.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#E2E6EF"/><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11}}/><YAxis width={58} tickFormatter={v=>`${Number(v)/1000}k`} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>money(Number(v))}/><Area type="monotone" dataKey="profit" fill="url(#exec-profit-fill)" stroke="none" isAnimationActive={false}/><Line type="monotone" dataKey="profit" stroke="#0022FF" dot={false} isAnimationActive={false}/></ComposedChart></ResponsiveContainer></div>;}
export function CategoryChart({data,spatial=false,expenses=[]}:{data:{name:string;value:number}[];spatial?:boolean;expenses?:BusinessRecord[]}) {
  const categories = [...data].sort((a,b)=>b.value-a.value);
  const total = categories.reduce((sum,category)=>sum+category.value,0);
  const uncategorized = categories.find(category=>category.name==="Uncategorized");
  if(spatial){
    const assigned=categories.filter(category=>category.name!=="Uncategorized");
    const categorized=assigned.reduce((sum,category)=>sum+category.value,0);
    const coverage=total?Math.round(categorized/total*100):0;
    const review=expenses.filter(expense=>!expense.category).sort((a,b)=>b.date.localeCompare(a.date));
    const colors=["#0022FF","#657EDB","#99A9CA","#263955","#C5CEDF"];
    return <div className="finance-expense-board">
      <div className="finance-expense-overview"><span className="finance-expense-glyph"><FolderOpen size={22} strokeWidth={1.4}/></span><span>Total paid expenses</span><strong>{money(total)}</strong><small>{expenses.length} recorded {expenses.length===1?"payment":"payments"}</small><div className="finance-allocation-caption"><span>Categorized</span><b>{coverage}%</b></div><div className="finance-allocation-track" role="progressbar" aria-label="Expense value categorized" aria-valuenow={coverage} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${coverage}%`}}/></div><p>{money(categorized)} of {money(total)}</p></div>
      <div className="finance-expense-content">
        {assigned.length>0&&<ul className="finance-category-ledger" aria-label="Paid expense breakdown">{assigned.map((category,index)=><li key={category.name}><span className="finance-category-dot" style={{background:colors[index%colors.length]}}/><span>{category.name}</span><strong>{money(category.value)}</strong><small>{total?(category.value/total*100).toLocaleString("en-IN",{maximumFractionDigits:1}):0}%</small></li>)}</ul>}
        {review.length>0?<div className="finance-category-review"><header><div><span className="finance-review-eyebrow">NEEDS REVIEW</span><h4>{review.length} {review.length===1?"expense needs":"expenses need"} a category</h4>{!assigned.length&&<p>Assign categories to reveal your spending mix.</p>}</div><span className="finance-review-amount">{money(uncategorized?.value||0)}</span></header><div className="finance-review-records">{review.slice(0,3).map(expense=><Link key={expense.id} href={`/finance?record=${encodeURIComponent(expense.id)}`}><span><strong>{expense.title}</strong><small>{expense.date}</small></span><b>{money(expense.amount)}</b><ArrowUpRight size={15}/></Link>)}</div>{review.length>3&&<span className="finance-review-remaining">+{review.length-3} more to categorize</span>}</div>:<div className="finance-category-complete"><Check size={16}/><span>All recorded expenses are categorized.</span></div>}
      </div>
    </div>;
  }
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
