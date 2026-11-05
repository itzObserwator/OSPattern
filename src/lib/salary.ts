import type { BusinessRecord } from "./models";

/** Salary totals use paid expense records once, never employee directory amounts. */
export function salaryBreakdown(records: BusinessRecord[], period: {from:string;to:string}, salaryClientIds: string[]) {
 const rows=records.filter(record=>record.kind==="expense"&&record.date>=period.from&&record.date<=period.to&&(!!record.salaryAllocation||/\b(salary|salaries|payroll)\b/i.test(record.category||"")||salaryClientIds.includes(record.clientId||"")));
 const paid=rows.filter(record=>record.status==="Paid");
 const total=(allocation?:"direct"|"indirect")=>paid.filter(record=>record.salaryAllocation===allocation).reduce((sum,record)=>sum+record.amount,0);
 return {rows,direct:total("direct"),indirect:total("indirect"),unclassified:total(),total:paid.reduce((sum,record)=>sum+record.amount,0)};
}
