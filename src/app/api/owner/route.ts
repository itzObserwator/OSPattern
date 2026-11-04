import { cookies } from "next/headers";
import { z } from "zod";
import { authenticate, sessionCookie, sessionPrincipal, signOut } from "@/lib/owner/auth";
import { OwnerError } from "@/lib/owner/database";
import { completeOnboarding, completeTask, convertLead, createClient, createLead, createMember, importPrototype, readSnapshot, startDelivery } from "@/lib/owner/repository";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
function fail(error:unknown){if(error instanceof OwnerError)return Response.json({error:error.message},{status:error.status,headers});if(error instanceof z.ZodError)return Response.json({error:error.issues.map(i=>`${i.path.join(".")||"Input"}: ${i.message}`).join("; ")},{status:400,headers});console.error("Owner request failed",error instanceof Error?error.message:"Unknown error");return Response.json({error:"The operation could not be completed. No partial changes were saved."},{status:500,headers});}
export async function GET(){try {const store=await cookies();const principal=sessionPrincipal(store.get(sessionCookie)?.value);if(!principal)throw new OwnerError("Sign in to your organization.",401);return Response.json(readSnapshot(principal),{headers});}catch(error){return fail(error);}}
export async function POST(request:Request){try{
 if(request.headers.get("origin")!==new URL(request.url).origin)throw new OwnerError("Request origin is not allowed.",403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))throw new OwnerError("Use a JSON request.",415);
 const text=await request.text();if(text.length>2_000_000)throw new OwnerError("Request is too large.",413);
 let raw:unknown;try{raw=JSON.parse(text);}catch{throw new OwnerError("Invalid JSON.");}
 const body=z.object({action:z.enum(["register","login","logout","createLead","createClient","convertLead","startDelivery","completeTask","completeOnboarding","createMember","importPrototype"]),input:z.unknown().optional()}).strict().parse(raw);
 const store=await cookies();
 if(body.action==="login"||body.action==="register"){
  const token=authenticate(body.input,body.action==="register");store.set(sessionCookie,token,{httpOnly:true,sameSite:"lax",secure:new URL(request.url).protocol==="https:",path:"/",maxAge:8*60*60});return Response.json({ok:true},{headers});
 }
 const token=store.get(sessionCookie)?.value;const principal=sessionPrincipal(token);if(!principal)throw new OwnerError("Sign in to your organization.",401);
 if(body.action==="logout"){signOut(token!);store.delete(sessionCookie);return Response.json({ok:true},{headers});}
 const actions={createLead,createClient,convertLead,startDelivery,completeTask,completeOnboarding,createMember,importPrototype};
 const result=actions[body.action](principal,body.input);return Response.json({ok:true,result,snapshot:readSnapshot(principal)},{headers});
 }catch(error){return fail(error);}}
