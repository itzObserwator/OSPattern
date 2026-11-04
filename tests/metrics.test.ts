import { test } from "node:test";
import assert from "node:assert/strict";
// Native Node tests execute the domain functions without a framework runner.
// @ts-ignore -- Node executes explicit .ts imports with type stripping.
import { financialSeries, summarize, createSchema, recordListSchema } from "../src/lib/models.ts";
// @ts-ignore -- Node executes explicit .ts imports with type stripping.
import { demoService } from "../src/lib/demo-service.ts";

test("financial KPIs use the selected month and change when records are added", async () => {
  const records = await demoService.getRecords();
  const october = summarize(records, "2026-10");
  assert.equal(october.revenue, 54000);
  assert.equal(october.expenses, 35000);
  assert.equal(summarize(records,"2026-09").revenue, 46000);
  const next = [...records, {id:"extra",kind:"invoice",title:"Extra payment",owner:"Alex",status:"Paid",date:"2026-10-15",amount:100,progress:0}];
  assert.equal(summarize(next, "2026-10").revenue, 54100);
  assert.equal(summarize(next, "2026-09").revenue, 46000);
});
test("task completion and project health counts derive from records", async () => {
  const records = await demoService.getRecords();
  const first = records.find(r=>r.kind==="task" && r.status!=="Completed")!;
  assert.equal(summarize(records,"2026-10").projects, 6);
  assert.equal(summarize(records,"2026-10").employees, 12);
  assert.equal(summarize(records.map(r=>r.id===first.id ? {...r,status:"Completed"} : r),"2026-10").tasks, summarize(records,"2026-10").tasks-1);
});
test("chart spans six calendar months including year boundaries", () => {
  assert.deepEqual(financialSeries([],"2026-02").map(r=>r.month),["Sep","Oct","Nov","Dec","Jan","Feb"]);
});
test("forms reject impossible dates, negative amounts, and empty owners", () => {
  const valid = {title:"New project",owner:"Alex",date:"2026-11-02",amount:10};
  assert.equal(createSchema.safeParse(valid).success,true);
  assert.equal(createSchema.safeParse({...valid,date:"2026-02-30"}).success,false);
  assert.equal(createSchema.safeParse({...valid,amount:-1}).success,false);
  assert.equal(createSchema.safeParse({...valid,owner:" "}).success,false);
  assert.equal(recordListSchema.safeParse([{id:"corrupt"}]).success,false);
});
