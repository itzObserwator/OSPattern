import {test} from "node:test";
import assert from "node:assert/strict";
// @ts-ignore Native Node TypeScript imports.
import {salaryBreakdown} from "../src/lib/salary.ts";
// @ts-ignore
import {recordSchema} from "../src/lib/models.ts";
const row=(patch={})=>recordSchema.parse({id:"salary",kind:"expense",title:"Salary payment",owner:"Alex Morgan",date:"2026-11-05",status:"Paid",amount:100,progress:0,...patch});
test("salary breakdown separates explicit allocations, unclassified payroll and unpaid records",()=>{
 const report=salaryBreakdown([row({salaryAllocation:"direct"}),row({id:"indirect",salaryAllocation:"indirect",amount:50}),row({id:"unknown",category:"Payroll",amount:20}),row({id:"legacy",clientId:"client-salary",amount:30}),row({id:"unpaid",salaryAllocation:"direct",status:"Pending",amount:999}),row({id:"software",category:"Software",amount:800}),row({id:"old",salaryAllocation:"direct",date:"2026-10-05",amount:700}),row({id:"person",kind:"employee",salaryAllocation:"direct",amount:600})],{from:"2026-11-01",to:"2026-11-30"},["client-salary"]);
 assert.equal(report.direct,100);assert.equal(report.indirect,50);assert.equal(report.unclassified,50);assert.equal(report.total,200);assert.equal(report.rows.length,5);
});
test("salary allocation validates and persists in record schema",()=>{
 assert.equal(row({salaryAllocation:"direct"}).salaryAllocation,"direct");
 assert.throws(()=>row({salaryAllocation:"guess"}));
});
