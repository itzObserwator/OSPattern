import { z } from "zod";

export const kinds = ["project", "employee", "task", "lead", "invoice", "expense"] as const;
export type RecordKind = (typeof kinds)[number];
export const recordSchema = z.object({
  id: z.string(), kind: z.enum(kinds), title: z.string().trim().min(2).max(120),
  owner: z.string().trim().min(2).max(80), date: z.iso.date(),
  status: z.enum(["On track", "At risk", "Delayed", "Active", "Pending", "Completed", "Paid"]),
  amount: z.number().finite().nonnegative(), progress: z.number().min(0).max(100),
  departmentId: z.string().optional(), clientId: z.string().optional(), projectId: z.string().optional(),
  employeeId: z.string().optional(), campaignId: z.string().optional(), category: z.string().optional(),
  contactName: z.string().trim().max(100).optional(),
  contactEmail: z.email().optional(),
  jobTitle: z.string().trim().max(80).optional(),
  estimatedHours: z.number().nonnegative().optional(), weeklyCapacityHours: z.number().positive().optional(),
  blocker: z.boolean().optional(),
  stage: z.enum(["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]).optional(),
  source: z.enum(["Instagram", "Facebook", "Website", "Referrals", "Direct Enquiries", "Other Sources"]).optional(),
  closedDate: z.iso.date().optional(), followUpDate: z.iso.date().optional(),
  stageHistory: z.array(z.object({ stage: z.enum(["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]), date: z.iso.date() })).optional(),
});
export type BusinessRecord = z.infer<typeof recordSchema>;
export const recordListSchema = z.array(recordSchema);
export const createSchema = recordSchema.pick({ title: true, owner: true, date: true, amount: true, jobTitle: true, contactName: true, contactEmail: true, source: true, followUpDate: true });
export type CreateValues = z.infer<typeof createSchema>;
export type Month = "2026-09" | "2026-10" | "2026-11";
export const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function summarize(records: BusinessRecord[], month: string) {
  const sum = (kind: RecordKind) => records.filter(r => r.kind === kind && r.status === "Paid" && r.date.startsWith(month)).reduce((n, r) => n + r.amount, 0);
  return {
    projects: records.filter(r => r.kind === "project" && r.status !== "Completed").length,
    employees: records.filter(r => r.kind === "employee" && r.status === "Active").length,
    revenue: sum("invoice"), expenses: sum("expense"),
    tasks: records.filter(r => r.kind === "task" && r.status !== "Completed").length,
    leads: records.filter(r => r.kind === "lead" && r.status === "Active").length,
  };
}

export function financialSeries(records: BusinessRecord[], month: string) {
  const [year, m] = month.split("-").map(Number);
  return Array.from({length: 6}, (_, i) => {
    const date = new Date(Date.UTC(year, m - 6 + i, 1));
    const key = date.toISOString().slice(0, 7);
    const summary = summarize(records, key);
    return { month: date.toLocaleDateString("en-US", {month: "short", timeZone: "UTC"}), revenue: summary.revenue, expenses: summary.expenses };
  });
}
