import type { BusinessRecord } from "./models";
import type { ExecutiveData } from "./executive";
// @ts-ignore Node native type stripping uses explicit extensions.
import { standardDepartments } from "./departments.ts";

// Populate only an empty workforce source, using existing demo employee IDs.
// Imported attendance/timesheets and custom employees are never overwritten.
export function withWorkforceDemo(data: ExecutiveData, records: BusinessRecord[], today: string): ExecutiveData {
  const people = records.filter(record => record.kind === "employee" && record.id.startsWith("employee-") && record.id.endsWith("-2026-10-01") && record.jobTitle && record.weeklyCapacityHours !== undefined);
  const departments = [...data.departments];
  for (const department of standardDepartments) if (records.some(record => record.departmentId === department.id) && !departments.some(existing => existing.id === department.id)) departments.push(department);
  if (!people.length || data.ledger.length || data.invoices.length || data.clients.length || data.budgets.length || data.balances.length || data.campaigns.length || data.approvals.length || data.events.length || data.goals.length || data.coverage.attendance || data.coverage.timesheets || data.attendance.length || data.timesheets.length) return {...data, departments};
  return {...data, departments,
    attendance: people.map((person,index)=>({id:`workforce-demo-attendance-${person.id}-${today}`,employeeId:person.id,date:today,status:index===10?"Leave" as const:index===11?"Absent" as const:"Present" as const})),
    timesheets: people.slice(0,10).map((person,index)=>({id:`workforce-demo-timesheet-${person.id}-${today}`,employeeId:person.id,date:today,hours:index===4?10:8,overtime:index===4?2:0})),
    coverage:{...data.coverage,attendance:true,timesheets:true},
  };
}
