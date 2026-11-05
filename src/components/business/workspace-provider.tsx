"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { recordListSchema, type BusinessRecord, type RecordKind } from "@/lib/models";
import { ExecutiveProvider } from "./executive-provider";
import { CreateRecordDialog } from "./create-record-dialog";

type Workspace = { records: BusinessRecord[]; openCreate: (kind?: RecordKind) => void; complete: (id: string) => void; storageMessage: string; replaceRecords: (records: BusinessRecord[]) => void };
const Context = createContext<Workspace | null>(null);
const key = "businessos-demo-v1";
export function WorkspaceProvider({initialRecords, children}: {initialRecords: BusinessRecord[]; children: React.ReactNode}) {
  const [records, setRecords] = useState(initialRecords);
  const [recordsReady, setRecordsReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("Demo workspace · changes are stored in this browser");
  const [kind, setKind] = useState<RecordKind>("task");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(key); if (saved) setRecords(recordListSchema.parse(JSON.parse(saved)).map(record => {
      const seed=initialRecords.find(item=>item.id===record.id);
      // Add missing demo metadata without replacing edited values or custom records.
      const leadDefaults=record.kind==="lead"&&seed&&!record.stage&&!record.stageHistory?.length?{date:seed.date,stage:seed.stage,source:record.source??seed.source,stageHistory:seed.stageHistory,closedDate:seed.closedDate,followUpDate:record.followUpDate??seed.followUpDate,status:record.status==="Active"?seed.status:record.status}:{};
      return seed?{...record,...leadDefaults,contactName:record.contactName??seed.contactName,contactEmail:record.contactEmail??seed.contactEmail,jobTitle:record.jobTitle??seed.jobTitle,departmentId:record.departmentId??seed.departmentId,weeklyCapacityHours:record.weeklyCapacityHours??seed.weeklyCapacityHours,estimatedHours:record.estimatedHours??seed.estimatedHours}:record;
    })); }
    catch { setStorageMessage("Demo workspace · saved data unavailable; showing sample records"); }
    finally { setRecordsReady(true); }
  }, []);
  function save(next: BusinessRecord[]) {
    const at = new Date().toISOString();
    for (const record of next) {
      const old = records.find(r => r.id === record.id);
      if (!old || Object.keys(record).some(field => JSON.stringify(record[field as keyof BusinessRecord]) !== JSON.stringify(old[field as keyof BusinessRecord]))) window.dispatchEvent(new CustomEvent("workspace-activity", {detail:{id:crypto.randomUUID(),title:record.title,action:!old?"Created":old.status!==record.status?`Marked ${record.status.toLowerCase()}`:"Updated record",at,department:record.departmentId||({project:"Delivery",task:"Operations",employee:"People",lead:"Sales",invoice:"Finance",expense:"Finance"}[record.kind]),user:record.owner,recordId:record.id,href:`/${{project:"projects",task:"tasks",employee:"hrms",lead:"crm",invoice:"finance",expense:"finance"}[record.kind]}?record=${encodeURIComponent(record.id)}`,category:record.kind}}));
    }
    setRecords(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setStorageMessage("Demo workspace · browser storage unavailable; changes last for this session"); }
  }
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.2 }}><Context.Provider value={{records, storageMessage, replaceRecords: next => save(recordListSchema.parse(next)), openCreate: (next = "task") => {setKind(next); setOpen(true);}, complete: id => save(records.map(r => r.id === id && r.kind === "task" ? {...r, status: r.status === "Completed" ? "Pending" : "Completed"} : r))}}>
    <ExecutiveProvider recordsReady={recordsReady}>{children}<CreateRecordDialog open={open} onOpenChange={setOpen} kind={kind} onKindChange={setKind} onCreate={record => save([...records, record])}/></ExecutiveProvider>
  </Context.Provider></MotionConfig>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error("WorkspaceProvider is required"); return value; }
