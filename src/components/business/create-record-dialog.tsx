"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, CircleDashed, FilePlus2, Plus } from "lucide-react";
import { createSchema, kinds, type CreateValues, type RecordKind, type BusinessRecord } from "@/lib/models";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";

export function CreateRecordDialog({ open, onOpenChange, kind, onKindChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; kind: RecordKind; onKindChange: (kind: RecordKind) => void; onCreate: (record: BusinessRecord) => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateValues>({ resolver: zodResolver(createSchema), defaultValues: { title: "", owner: "", date: "2026-11-02", amount: 0 } });
  useEffect(() => {
    if (open) reset({ title: "", owner: "", date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()), amount: 0 });
  }, [open, reset]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="bos-create-dialog">
    <span className="bos-form-emblem" aria-hidden="true"><FilePlus2 size={26} strokeWidth={1.25} /><ArrowUpRight size={11} /></span><span className="bos-eyebrow">MAKE YOUR NEXT MOVE</span><DialogTitle>Create a {kind}</DialogTitle><DialogDescription>A small step. A new possibility for your workspace.</DialogDescription>
    <div className="bos-form-context"><span className="bos-label-dot" /><strong>Studio North</strong><span>/</span><span>Browser-local demo</span></div>
    <form onSubmit={handleSubmit(values => { onCreate({ ...values, id: crypto.randomUUID(), kind, status: kind === "employee" || kind === "lead" ? "Active" : kind === "project" ? "On track" : kind === "invoice" || kind === "expense" ? "Paid" : "Pending", progress: 0 }); onOpenChange(false); })} className="bos-form">
      <div className="bos-form-field"><div className="bos-field-label"><label htmlFor="record-kind">Record type</label><span>01</span></div><select id="record-kind" value={kind} onChange={event => onKindChange(event.target.value as RecordKind)}>{kinds.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
      <div className="bos-form-field"><div className="bos-field-label"><label htmlFor="record-title">{kind === "employee" ? "Full name" : "Title"}</label><span>Required</span></div><input id="record-title" aria-required="true" {...register("title")} placeholder={kind === "project" ? "e.g. Horizon customer platform" : "Give this record a name"} aria-invalid={!!errors.title} aria-describedby={errors.title ? "title-error" : undefined} />{errors.title && <p id="title-error" className="bos-form-error">{errors.title.message}</p>}</div>
      <div className="bos-form-field"><div className="bos-field-label"><label htmlFor="record-owner">{kind === "employee" ? "Team" : "Owner"}</label><span>Required</span></div><input id="record-owner" aria-required="true" {...register("owner")} placeholder="Name or team" aria-invalid={!!errors.owner} aria-describedby={errors.owner ? "owner-error" : undefined} />{errors.owner && <p id="owner-error" className="bos-form-error">{errors.owner.message}</p>}</div>
      <div className="bos-form-row"><div className="bos-form-field"><label htmlFor="record-date">{kind === "invoice" || kind === "expense" ? "Payment date" : "Date"}</label><input id="record-date" type="date" {...register("date")} aria-invalid={!!errors.date} aria-describedby={errors.date ? "date-error" : undefined} />{errors.date && <p id="date-error" className="bos-form-error">Use a valid date.</p>}</div><div className="bos-form-field"><label htmlFor="record-amount">Amount (USD)</label><input id="record-amount" type="number" min="0" step="0.01" {...register("amount", { valueAsNumber: true })} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "amount-error" : undefined} />{errors.amount && <p id="amount-error" className="bos-form-error">Enter a nonnegative amount.</p>}</div></div>
      <div className="bos-form-storage-note"><CircleDashed size={14} /><p>{kind === "invoice" || kind === "expense" ? "Demo financial records represent payments already made." : "This demo record is saved in your browser."}</p></div>
      <div className="bos-dialog-actions"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={isSubmitting}><Plus size={16} />Create {kind}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
