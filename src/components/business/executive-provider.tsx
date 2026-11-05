"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { defaultPreferences, preferenceSchema, executiveSchema, emptyExecutive, validateExecutive, type ExecutiveData, type Preferences, type ActivityEvent } from "@/lib/executive";
import { recordListSchema, recordSchema, type BusinessRecord } from "@/lib/models";
import { withSalesDemo } from "@/lib/sales-demo";
import { withWorkforceDemo } from "@/lib/workforce-demo";
import { useWorkspace } from "./workspace-provider";

const activitySchema=z.array(z.object({id:z.string(),title:z.string(),action:z.string(),at:z.iso.datetime(),department:z.string(),user:z.string(),recordId:z.string(),href:z.string(),category:z.string()}));
type RecordRelationships={department?:ExecutiveData["departments"][number];client?:ExecutiveData["clients"][number]};
type ExecutiveContext={saveRecordDetails:(record:BusinessRecord,relationships?:RecordRelationships)=>void;data:ExecutiveData;prefs:Preferences;events:ActivityEvent[];ready:boolean;notice:string;setPrefs:(p:Preferences)=>void;setData:(d:ExecutiveData)=>void;decide:(id:string,status:"Approved"|"Rejected")=>void;importSnapshot:(value:unknown)=>void;};
const Context=createContext<ExecutiveContext|null>(null);
export function ExecutiveProvider({children,recordsReady}:{children:React.ReactNode;recordsReady:boolean}) {
 const {records,replaceRecords}=useWorkspace();
 const [data,setDataState]=useState(emptyExecutive),[prefs,setPrefsState]=useState<Preferences>(defaultPreferences),[events,setEvents]=useState<ActivityEvent[]>([]),[ready,setReady]=useState(false),[notice,setNotice]=useState("");
 const currentRecords=useRef(records); currentRecords.current=records;
 useEffect(()=>{
  if(!recordsReady)return;
  try { const raw=localStorage.getItem("executive-data-v1");const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   const restored=raw?executiveSchema.parse(JSON.parse(raw)):emptyExecutive();
   setDataState(validateExecutive(withSalesDemo(withWorkforceDemo(restored,currentRecords.current,today),currentRecords.current),currentRecords.current)); }catch{try{const saved=localStorage.getItem("executive-data-v1");if(saved)localStorage.setItem("executive-data-recovery-v1",saved);}catch{}setNotice("Executive data could not be restored. A recovery snapshot was retained when browser storage allowed it. Existing workspace records are preserved.");}
  try { const raw=localStorage.getItem("executive-preferences-v1");if(raw)setPrefsState(preferenceSchema.parse(JSON.parse(raw))); }catch{setNotice("Saved layout is unavailable. Using the default layout.");}
  try { const raw=localStorage.getItem("executive-events-v1");if(raw)setEvents(activitySchema.parse(JSON.parse(raw))); }catch{setNotice("Device activity history is unavailable.");}
  setReady(true);
 },[recordsReady]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem("executive-data-v1",JSON.stringify(data));localStorage.setItem("executive-preferences-v1",JSON.stringify(prefs));localStorage.setItem("executive-events-v1",JSON.stringify(events));}catch{setNotice("Browser storage is unavailable. Executive changes last for this session.");}},[data,prefs,events,ready]);
 useEffect(()=>{const handler=(event:Event)=>{const parsed=activitySchema.safeParse([(event as CustomEvent).detail]);if(parsed.success)setEvents(current=>[parsed.data[0],...current].slice(0,200));};window.addEventListener("workspace-activity",handler);return()=>window.removeEventListener("workspace-activity",handler);},[]);
 function setData(d:ExecutiveData){setDataState(validateExecutive(d,records));}
 function saveRecordDetails(value:BusinessRecord,relationships:RecordRelationships={}) {
  const record=recordSchema.parse(value);
  const existing=records.find(r=>r.id===record.id);
  if(!existing||existing.kind!==record.kind)throw Error("The record is no longer available or its type changed.");
  if(relationships.department&&relationships.department.id!==record.departmentId)throw Error("Department selection does not match the record.");
  if(relationships.client&&relationships.client.id!==record.clientId)throw Error("Client selection does not match the record.");
  const nextRecords=records.map(r=>r.id===record.id?record:r);
  const nextData=validateExecutive({...data,
   departments:relationships.department&&!data.departments.some(d=>d.id===relationships.department!.id)?[...data.departments,relationships.department]:data.departments,
   clients:relationships.client&&!data.clients.some(c=>c.id===relationships.client!.id)?[...data.clients,relationships.client]:data.clients,
  },nextRecords);
  // Validate the complete relationship graph before updating either browser-local collection.
  replaceRecords(nextRecords);setDataState(nextData);
 }
 function decide(id:string,status:"Approved"|"Rejected") {
  const approval=data.approvals.find(a=>a.id===id);if(!approval||approval.status!=="Pending")return;
  const at=new Date().toISOString();
  setData({...data,approvals:data.approvals.map(a=>a.id===id?{...a,status,decidedAt:at}:a)});
  setEvents(current=>[{id:crypto.randomUUID(),title:approval.title,action:status,at,department:approval.departmentId||approval.type,user:"Alex Morgan · demo owner",recordId:id,href:"/settings#management-data",category:"Approval"},...current].slice(0,200));
 }
 function importSnapshot(value:unknown){
  const envelope=z.object({data:z.unknown(),records:recordListSchema.optional()}).parse(value);
  const incoming=envelope.records??[];
  if(new Set(incoming.map(r=>r.id)).size!==incoming.length)throw Error("Duplicate workspace IDs");
  const merged=records.map(r=>{const update=incoming.find(x=>x.id===r.id);if(update&&update.kind!==r.kind)throw Error("Record types cannot change");return update??r;});
  if(incoming.some(r=>!records.some(old=>old.id===r.id)))throw Error("Use Create new for new workspace records; import enriches existing IDs only.");
  const next=validateExecutive(envelope.data,merged);
  replaceRecords(merged);setDataState(next);
  const at=new Date().toISOString();setEvents(current=>[{id:crypto.randomUUID(),title:"Executive data",action:"Imported validated device snapshot",at,department:"Management",user:"Alex Morgan · demo owner",recordId:"snapshot",href:"/settings#management-data",category:"Data"},...current].slice(0,200));
 }
 return <Context.Provider value={{data,prefs,events,ready,notice,saveRecordDetails,setPrefs:p=>setPrefsState(preferenceSchema.parse(p)),setData,decide,importSnapshot}}><span hidden data-executive-ready={ready}/>{children}</Context.Provider>;
}
export function useExecutive(){const value=useContext(Context);if(!value)throw Error("ExecutiveProvider is required");return value;}
