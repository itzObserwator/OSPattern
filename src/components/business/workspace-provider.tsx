"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { recordListSchema, type BusinessRecord, type RecordKind } from "@/lib/models";
import { CreateRecordDialog } from "./create-record-dialog";

type Workspace = { records: BusinessRecord[]; openCreate: (kind?: RecordKind) => void; complete: (id: string) => void; storageMessage: string };
const Context = createContext<Workspace | null>(null);
const key = "businessos-demo-v1";
export function WorkspaceProvider({initialRecords, children}: {initialRecords: BusinessRecord[]; children: React.ReactNode}) {
  const [records, setRecords] = useState(initialRecords);
  const [storageMessage, setStorageMessage] = useState("Demo workspace · changes are stored in this browser");
  const [kind, setKind] = useState<RecordKind>("task");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(key); if (saved) setRecords(recordListSchema.parse(JSON.parse(saved))); }
    catch { setStorageMessage("Demo workspace · saved data unavailable; showing sample records"); }
  }, []);
  function save(next: BusinessRecord[]) {
    setRecords(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setStorageMessage("Demo workspace · browser storage unavailable; changes last for this session"); }
  }
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.2 }}><Context.Provider value={{records, storageMessage, openCreate: (next = "task") => {setKind(next); setOpen(true);}, complete: id => save(records.map(r => r.id === id ? {...r, status: r.status === "Completed" ? "Pending" : "Completed"} : r))}}>
    {children}<CreateRecordDialog open={open} onOpenChange={setOpen} kind={kind} onKindChange={setKind} onCreate={record => save([...records, record])}/>
  </Context.Provider></MotionConfig>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error("WorkspaceProvider is required"); return value; }
