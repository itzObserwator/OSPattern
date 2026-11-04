import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, transaction, OwnerError } from "./database";
import { audit, hashPassword } from "./auth";
import { clientInput, leadInput, conversionInput, deliveryInput, memberInput, ownerRecordSchema, type Principal, type OwnerRecord, type Snapshot, type Client, type Conversion } from "./contracts";
const privileged=(p:Principal)=>["Business Owner","Organization Admin"].includes(p.role);
export function requireManager(p:Principal){if(!privileged(p))throw new OwnerError("Owner or organization admin permission required.",403);}
function requireSales(p:Principal){if(!privileged(p)&&p.role!=="Sales Manager")throw new OwnerError("Sales permission required.",403);}
function now(){return new Date().toISOString();}
function day(){return now().slice(0,10);}
function filter(p:Principal){
 if(privileged(p))return {sql:"",params:[] as string[]};
 if(p.role==="Client"||p.role==="Marketing Manager")throw new OwnerError("This owner workspace is not available to your role.",403);
 if(p.role==="HR Manager")return {sql:" AND kind='employee'",params:[]};
 if(p.role==="Finance Manager")return {sql:" AND kind IN ('invoice','expense','project')",params:[]};
 return {sql:" AND assignee_user_id=? AND kind IN ("+(p.role==="Sales Manager"?"'lead'":"'project','task'")+")",params:[p.userId]};
}
function recordsFor(p:Principal){const scope=filter(p);return db().prepare(`SELECT payload FROM records WHERE organization_id=?${scope.sql} ORDER BY rowid`).all(p.organizationId,...scope.params).map(row=>ownerRecordSchema.parse(JSON.parse(String(row.payload))));}
function getRecord(p:Principal,id:string,kind?:OwnerRecord["kind"]){const record=recordsFor(p).find(r=>r.id===id&&(!kind||r.kind===kind));if(!record)throw new OwnerError("Record not found.",404);return record;}
function memberExists(p:Principal,id:string){if(!db().prepare("SELECT user_id FROM memberships WHERE organization_id=? AND user_id=? AND role!='Client'").get(p.organizationId,id))throw new OwnerError("Assignee must be a member of this organization.");}
function validateRelations(p:Principal,record:OwnerRecord,incoming:OwnerRecord[]=[]){
 const find=(id:string,kind:string)=>incoming.find(r=>r.id===id&&r.kind===kind)||db().prepare("SELECT id FROM records WHERE organization_id=? AND id=? AND kind=?").get(p.organizationId,id,kind);
 if(record.clientId&&!db().prepare("SELECT id FROM clients WHERE organization_id=? AND id=?").get(p.organizationId,record.clientId))throw new OwnerError("Client must belong to this organization.");
 for(const [id,kind] of [[record.projectId,"project"],[record.employeeId,"employee"],[record.originLeadId,"lead"]])if(id&&!find(id,kind!))throw new OwnerError(`Invalid ${kind} relationship.`);
 if(record.projectId){const target=incoming.find(r=>r.id===record.projectId)||JSON.parse(String(db().prepare("SELECT payload FROM records WHERE organization_id=? AND id=?").get(p.organizationId,record.projectId)?.payload||"{}"));if(record.clientId&&target.clientId&&record.clientId!==target.clientId)throw new OwnerError("Task and project clients must match.");}
 if(record.assigneeUserId)memberExists(p,record.assigneeUserId);
}
function insertRecord(p:Principal,record:OwnerRecord){
 const r=ownerRecordSchema.parse(record);validateRelations(p,r);
 db().prepare("INSERT INTO records(organization_id,id,kind,assignee_user_id,client_id,project_id,employee_id,lead_id,payload) VALUES(?,?,?,?,?,?,?,?,?)").run(p.organizationId,r.id,r.kind,r.assigneeUserId??null,r.clientId??null,r.projectId??null,r.employeeId??null,r.originLeadId??null,JSON.stringify(r));
}
function updateRecord(p:Principal,record:OwnerRecord){const r=ownerRecordSchema.parse(record);validateRelations(p,r);db().prepare("UPDATE records SET assignee_user_id=?,client_id=?,project_id=?,employee_id=?,lead_id=?,payload=? WHERE organization_id=? AND id=?").run(r.assigneeUserId??null,r.clientId??null,r.projectId??null,r.employeeId??null,r.originLeadId??null,JSON.stringify(r),p.organizationId,r.id);}
function ensureOnboarding(p:Principal,id:string){for(const title of ["Confirm client contacts","Collect project brief","Arrange kickoff meeting"])db().prepare("INSERT OR IGNORE INTO onboarding VALUES(?,?,?,?,0)").run(p.organizationId,id,randomUUID(),title);}
function insertClient(p:Principal,input:z.infer<typeof clientInput>,id=randomUUID()){
 const existing=db().prepare("SELECT id FROM clients WHERE organization_id=? AND normalized_email=?").get(p.organizationId,input.email.toLowerCase());
 if(existing)return {id:String(existing.id),created:false};
 db().prepare("INSERT INTO clients VALUES(?,?,?,?,?,?,?,?)").run(p.organizationId,id,input.name,input.email,input.email.toLowerCase(),input.company,input.notes,now());
 return {id,created:true};
}
export function readSnapshot(p:Principal):Snapshot{
 const records=recordsFor(p);const all=privileged(p)||p.role==="Sales Manager"||p.role==="Finance Manager";
 const clientIds=new Set(records.map(r=>r.clientId).filter(Boolean));
 const clients=db().prepare("SELECT id,name,email,company,notes,created_at FROM clients WHERE organization_id=? ORDER BY created_at DESC").all(p.organizationId).filter(c=>all||clientIds.has(String(c.id))) as unknown as Client[];
 const visibleClients=new Set(clients.map(c=>c.id));const visibleRecords=new Set(records.map(r=>r.id));
 const conversions=db().prepare("SELECT lead_id,client_id,project_id,task_id FROM conversions WHERE organization_id=?").all(p.organizationId).filter(c=>privileged(p)||visibleRecords.has(String(c.lead_id))) as unknown as Conversion[];
 const onboarding=db().prepare("SELECT id,client_id,title,completed FROM onboarding WHERE organization_id=? ORDER BY rowid").all(p.organizationId).filter(c=>visibleClients.has(String(c.client_id))) as unknown as Snapshot["onboarding"];
 const members=privileged(p)?db().prepare("SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=? ORDER BY u.name").all(p.organizationId) as unknown as Snapshot["members"]:[{id:p.userId,name:p.name,email:p.email,role:p.role}];
 const events=privileged(p)?db().prepare("SELECT a.id,a.action,a.record_id,a.details,a.created_at,u.name actor FROM audit_events a JOIN users u ON u.id=a.user_id WHERE a.organization_id=? ORDER BY a.id DESC LIMIT 100").all(p.organizationId) as unknown as Snapshot["audit"]:[];
 return {principal:p,records,clients,conversions,onboarding,members,audit:events};
}
export function createClient(p:Principal,input:unknown){requireSales(p);const value=clientInput.parse(input);return transaction(()=>{const result=insertClient(p,value);ensureOnboarding(p,result.id);if(result.created)audit(p,"client.created",result.id);return result;});}
export function createLead(p:Principal,input:unknown){requireSales(p);const value=leadInput.parse(input);return transaction(()=>{
 const id=randomUUID();insertRecord(p,{id,kind:"lead",title:value.title,owner:p.name,assigneeUserId:p.userId,date:value.date,status:"Active",amount:value.amount,progress:0,stage:"New Lead",source:value.source,followUpDate:value.date,contactEmail:value.contactEmail,stageHistory:[{stage:"New Lead",date:day()}]});audit(p,"lead.created",id);return {id};
});}
export function convertLead(p:Principal,input:unknown){requireSales(p);const value=conversionInput.parse(input);return transaction(()=>{
 const lead=getRecord(p,value.leadId,"lead");
 const existing=db().prepare("SELECT client_id,project_id,task_id FROM conversions WHERE organization_id=? AND lead_id=?").get(p.organizationId,lead.id);
 if(existing)return existing;
 let clientId=value.clientId;
 if(clientId){if(!db().prepare("SELECT id FROM clients WHERE organization_id=? AND id=?").get(p.organizationId,clientId))throw new OwnerError("Client not found.",404);}
 else {const client=insertClient(p,value.client!);clientId=client.id;if(client.created)audit(p,"client.created",clientId,{originLeadId:lead.id});}
 ensureOnboarding(p,clientId!);
 updateRecord(p,{...lead,stage:"Won",closedDate:day(),clientId,stageHistory:[...(lead.stageHistory??[]),{stage:"Won",date:day()}]});
 db().prepare("INSERT INTO conversions(organization_id,lead_id,client_id) VALUES(?,?,?)").run(p.organizationId,lead.id,clientId!);audit(p,"lead.converted",lead.id,{clientId});return {client_id:clientId,project_id:null,task_id:null};
});}
export function startDelivery(p:Principal,input:unknown){requireManager(p);const value=deliveryInput.parse(input);return transaction(()=>{
 const conversion=db().prepare("SELECT * FROM conversions WHERE organization_id=? AND lead_id=?").get(p.organizationId,value.leadId) as unknown as Conversion|undefined;
 if(!conversion)throw new OwnerError("Convert the lead before starting delivery.");
 if(conversion.project_id)return conversion;
 if(value.due<day())throw new OwnerError("Choose a current or future delivery deadline.");memberExists(p,value.assigneeUserId);
 const assigneeRole=db().prepare("SELECT role FROM memberships WHERE organization_id=? AND user_id=?").get(p.organizationId,value.assigneeUserId)?.role;
 if(!["Business Owner","Organization Admin","Project Manager","Employee"].includes(String(assigneeRole)))throw new OwnerError("Choose an owner, admin, project manager or employee for delivery.");
 const owner=db().prepare("SELECT name FROM users WHERE id=?").get(value.assigneeUserId)!;
 const projectId=randomUUID(),taskId=randomUUID();
 insertRecord(p,{id:projectId,kind:"project",title:value.projectName,owner:String(owner.name),assigneeUserId:value.assigneeUserId,date:value.due,status:"On track",amount:0,progress:0,clientId:conversion.client_id,originLeadId:value.leadId});
 insertRecord(p,{id:taskId,kind:"task",title:value.taskTitle,owner:String(owner.name),assigneeUserId:value.assigneeUserId,date:value.due,status:"Pending",amount:0,progress:0,clientId:conversion.client_id,projectId,originLeadId:value.leadId});
 db().prepare("UPDATE conversions SET project_id=?,task_id=? WHERE organization_id=? AND lead_id=?").run(projectId,taskId,p.organizationId,value.leadId);
 audit(p,"delivery.started",projectId,{leadId:value.leadId,clientId:conversion.client_id,taskId,assigneeUserId:value.assigneeUserId});return {project_id:projectId,task_id:taskId};
});}
export function completeTask(p:Principal,input:unknown){const value=z.object({id:z.string(),completed:z.boolean()}).strict().parse(input);if(!privileged(p)&&!["Project Manager","Employee"].includes(p.role))throw new OwnerError("Task update permission required.",403);return transaction(()=>{const task=getRecord(p,value.id,"task");updateRecord(p,{...task,status:value.completed?"Completed":"Pending",progress:value.completed?100:0});audit(p,value.completed?"task.completed":"task.reopened",task.id);});}
export function completeOnboarding(p:Principal,input:unknown){requireSales(p);const value=z.object({id:z.string(),completed:z.boolean()}).strict().parse(input);return transaction(()=>{const result=db().prepare("UPDATE onboarding SET completed=? WHERE organization_id=? AND id=?").run(value.completed?1:0,p.organizationId,value.id);if(!result.changes)throw new OwnerError("Checklist item not found.",404);audit(p,"onboarding.updated",value.id,{completed:value.completed});});}
export function createMember(p:Principal,input:unknown){requireManager(p);const value=memberInput.parse(input);if(value.role==="Organization Admin"&&p.role!=="Business Owner")throw new OwnerError("Only the owner can assign organization admins.",403);const hash=hashPassword(value.password);return transaction(()=>{
 if(db().prepare("SELECT id FROM users WHERE email=?").get(value.email))throw new OwnerError("This account already exists. Cross-organization account invitations are not enabled.",409);
 const id=randomUUID();db().prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(id,value.email,value.name,hash,now());db().prepare("INSERT INTO memberships VALUES(?,?,?)").run(p.organizationId,id,value.role);audit(p,"member.created",id,{role:value.role});return {id};
});}
export function importPrototype(p:Principal,input:unknown){requireManager(p);const value=z.object({records:z.array(ownerRecordSchema).max(5000),clients:z.array(z.object({id:z.string().min(1),name:z.string().min(2),email:z.email().optional()})).max(1000).default([])}).strict().parse(input);
 if(value.records.some(r=>r.departmentId||r.campaignId))throw new OwnerError("Department and campaign-linked snapshots need the later department import adapter. The browser snapshot is unchanged.");
 const ids=value.records.map(r=>r.id);if(new Set(ids).size!==ids.length||new Set(value.clients.map(c=>c.id)).size!==value.clients.length)throw new OwnerError("Duplicate IDs in import.");
 return transaction(()=>{
 for(const c of value.clients){if(db().prepare("SELECT id FROM clients WHERE organization_id=? AND id=?").get(p.organizationId,c.id))throw new OwnerError("Client ID already exists. Import never overwrites records.",409);const email=c.email?.toLowerCase()||"";if(email&&db().prepare("SELECT id FROM clients WHERE organization_id=? AND normalized_email=?").get(p.organizationId,email))throw new OwnerError("Client email already exists. Link to the existing client before importing.",409);db().prepare("INSERT INTO clients VALUES(?,?,?,?,?,?,?,?)").run(p.organizationId,c.id,c.name,email,email||`missing:${c.id}`,"",email?"":"Imported client: contact email not supplied.",now());}
 for(const r of value.records){if(db().prepare("SELECT id FROM records WHERE organization_id=? AND id=?").get(p.organizationId,r.id))throw new OwnerError("Record ID already exists. Import never overwrites records.",409);validateRelations(p,r,value.records);}
 // Deferred FKs support arbitrary source ordering, while type checks above prevent invalid links.
 for(const r of value.records){const record={...r,assigneeUserId:p.userId};db().prepare("INSERT INTO records(organization_id,id,kind,assignee_user_id,client_id,project_id,employee_id,lead_id,payload) VALUES(?,?,?,?,?,?,?,?,?)").run(p.organizationId,record.id,record.kind,p.userId,record.clientId??null,record.projectId??null,record.employeeId??null,record.originLeadId??null,JSON.stringify(record));}
 audit(p,"prototype.imported","snapshot",{records:value.records.length,clients:value.clients.length});return {records:value.records.length};
 });
}
