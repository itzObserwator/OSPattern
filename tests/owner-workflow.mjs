import { request } from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.BUSINESSOS_OWNER_URL||'http://localhost:3003';
const origin=new URL(base).origin;
const suffix=crypto.randomUUID();
const password='Connected-Test-Password-784!';
const contexts=[];
async function context(){const c=await request.newContext({baseURL:base,extraHTTPHeaders:{Origin:origin}});contexts.push(c);return c;}
async function post(c,action,input,status=200){const response=await c.post('/api/owner',{data:{action,input}});const result=await response.json();assert.equal(response.status(),status,`${action}: ${JSON.stringify(result)}`);return result;}
async function snapshot(c){const r=await c.get('/api/owner');assert.equal(r.status(),200);return r.json();}
async function register(c,email,organization){return post(c,'register',{email,password,name:'Owner Test',organization});}
const owner=await context(),other=await context(),anon=await context();
try {
 assert.equal((await anon.get('/api/owner')).status(),401);
 await register(owner,`owner-${suffix}@example.test`,'Workflow QA');
 let s=await snapshot(owner);assert.equal(s.records.length,0);assert.equal(s.principal.role,'Business Owner');
 const ownerId=s.principal.userId;
 const cookie=(await owner.storageState()).cookies.find(c=>c.name==='techgy-owner-session');assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'Lax');
 const lead=(await post(owner,'createLead',{title:'Connected client',contactEmail:'client-'+suffix+'@example.test',amount:24000,date:'2030-01-10',source:'Website'})).result.id;
 await post(owner,'startDelivery',{leadId:lead,projectName:'Premature delivery',due:'2030-02-01',taskTitle:'Brief',assigneeUserId:ownerId},400);
 const converted=await post(owner,'convertLead',{leadId:lead,client:{name:'Connected client',email:'client-'+suffix+'@example.test',company:'Acme',notes:'Kickoff next week'}});
 const clientId=converted.result.client_id;
 await Promise.all([post(owner,'convertLead',{leadId:lead,clientId}),post(owner,'convertLead',{leadId:lead,clientId})]);
 s=await snapshot(owner);assert.equal(s.clients.length,1);assert.equal(s.onboarding.length,3);assert.equal(s.records.find(r=>r.id===lead).stage,'Won');
 const repeatClient=await post(owner,'createClient',{name:'Duplicate email',email:'CLIENT-'+suffix+'@EXAMPLE.TEST',company:'',notes:''});assert.equal(repeatClient.result.id,clientId);
 const employeeEmail=`employee-${suffix}@example.test`;
 const employeeId=(await post(owner,'createMember',{name:'Delivery Employee',email:employeeEmail,password,role:'Employee'})).result.id;
 const deliveryInput={leadId:lead,projectName:'Connected launch',due:'2030-02-01',taskTitle:'Confirm the brief',assigneeUserId:employeeId};
 const deliveries=await Promise.all([post(owner,'startDelivery',deliveryInput),post(owner,'startDelivery',deliveryInput)]);
 assert.equal(deliveries[0].result.project_id,deliveries[1].result.project_id);
 s=await snapshot(owner);assert.equal(s.records.filter(r=>r.kind==='project').length,1);assert.equal(s.records.filter(r=>r.kind==='task').length,1);
 const project=s.records.find(r=>r.kind==='project'),task=s.records.find(r=>r.kind==='task');
 assert.equal(project.clientId,clientId);assert.equal(task.clientId,clientId);assert.equal(task.projectId,project.id);assert.equal(project.originLeadId,lead);assert.equal(project.amount,0);
 await post(owner,'completeOnboarding',{id:s.onboarding[0].id,completed:true});
 await register(other,`other-${suffix}@example.test`,'Other organization');const otherS=await snapshot(other);assert.equal(otherS.clients.length,0);assert.equal(otherS.records.length,0);
 await post(other,'convertLead',{leadId:lead,clientId},404);
 await post(other,'startDelivery',deliveryInput,400);
 await post(other,'completeTask',{id:task.id,completed:true},404);
 await post(other,'completeOnboarding',{id:s.onboarding[0].id,completed:true},404);
 const employee=await context();await post(employee,'login',{email:employeeEmail,password});const employeeS=await snapshot(employee);
 assert.equal(employeeS.records.length,2);assert.equal(employeeS.audit.length,0);assert.equal(employeeS.members.length,1);
 await post(employee,'createClient',{name:'Forbidden',email:'forbidden@example.test'},403);
 await post(employee,'createMember',{name:'Escalation',email:'escalation@example.test',password,role:'Organization Admin'},403);
 await post(employee,'completeTask',{id:task.id,completed:true});assert.equal((await snapshot(owner)).records.find(r=>r.id===task.id).status,'Completed');
 await post(employee,'completeTask',{id:task.id,completed:false});
 await post(owner,'createMember',{name:'Portal User',email:`portal-${suffix}@example.test`,password,role:'Client'});
 const portal=await context();await post(portal,'login',{email:`portal-${suffix}@example.test`,password});assert.equal((await portal.get('/api/owner')).status(),403);
 const wrong=await request.newContext({baseURL:base,storageState:await owner.storageState(),extraHTTPHeaders:{Origin:'https://attacker.invalid'}});contexts.push(wrong);await post(wrong,'createLead',{},403);
 await post(owner,'createLead',{title:'Forged org',contactEmail:'forge@example.test',amount:10,date:'2030-01-01',source:'Website',organizationId:otherS.principal.organizationId},400);
 const imported={id:`import-${suffix}`,kind:'task',title:'Imported task',owner:'Original Owner',date:'2030-03-01',status:'Pending',amount:0,progress:0};
 const count=(await snapshot(owner)).records.length;
 await post(owner,'importPrototype',{records:[{...imported,projectId:'cross-org-or-missing'}],clients:[]},400);assert.equal((await snapshot(owner)).records.length,count);
 await post(owner,'importPrototype',{records:[imported,imported],clients:[]},400);
 await post(owner,'importPrototype',{records:[imported],clients:[]});await post(owner,'importPrototype',{records:[imported],clients:[]},409);
 s=await snapshot(owner);assert.equal(s.records.find(r=>r.id===imported.id).owner,'Original Owner');assert.ok(s.audit.some(e=>e.action==='delivery.started'));assert.ok(s.audit.some(e=>e.action==='task.completed'));
 // A second authenticated HTTP client reads the same persisted records.
 const restored=await request.newContext({baseURL:base,storageState:await owner.storageState()});contexts.push(restored);
 const restoredSnapshot=await snapshot(restored);
 assert.equal(restoredSnapshot.records.find(r=>r.id===project.id).clientId,clientId);
 assert.equal(restoredSnapshot.onboarding.find(r=>r.id===s.onboarding[0].id).completed,1);
 await post(owner,'logout',{});assert.equal((await owner.get('/api/owner')).status(),401);
 console.log('PASS: authentication, cookie flags, tenant isolation, role denial, assignment scopes, idempotent conversion/delivery, client deduplication, onboarding, task completion, audit events, import atomicity/collision rejection, CSRF rejection, server persistence across authenticated clients.');
} finally {await Promise.all(contexts.map(c=>c.dispose()));}
