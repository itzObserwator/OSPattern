import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db, transaction, OwnerError } from "./database";
import { credentials, registration, type Principal } from "./contracts";
export const sessionCookie="techgy-owner-session";
export const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export function hashPassword(password:string){const salt=randomBytes(16).toString("hex");return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
function verify(password:string,hash:string){const [salt,value]=hash.split(":");const target=Buffer.from(value,"hex");const actual=scryptSync(password,salt,64);return target.length===actual.length&&timingSafeEqual(target,actual);}
export function audit(p:Pick<Principal,"organizationId"|"userId">,action:string,id:string,details:unknown={}){db().prepare("INSERT INTO audit_events(organization_id,user_id,action,record_id,details,created_at) VALUES(?,?,?,?,?,?)").run(p.organizationId,p.userId,action,id,JSON.stringify(details),new Date().toISOString());}
export function sessionPrincipal(token:string|undefined):Principal|null {
 if(!token||token.length!==64)return null;
 const row=db().prepare("SELECT u.id userId,u.name,u.email,o.id organizationId,o.name organization,m.role FROM sessions s JOIN users u ON u.id=s.user_id JOIN organizations o ON o.id=s.organization_id JOIN memberships m ON m.user_id=u.id AND m.organization_id=o.id WHERE s.token_hash=? AND s.expires_at>?").get(digest(token),Date.now());
 return row?row as unknown as Principal:null;
}
function issue(userId:string,organizationId:string){const token=randomBytes(32).toString("hex");db().prepare("DELETE FROM sessions WHERE expires_at<=?").run(Date.now());db().prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(digest(token),userId,organizationId,Date.now()+8*60*60*1000);return token;}
export function authenticate(input:unknown,signup=false){
 const parsed=signup?registration.parse(input):credentials.parse(input);
 // Persistent per-account throttle applies before expensive password hashing.
 const key=digest(parsed.email);const now=Date.now();const attempt=db().prepare("SELECT attempts,reset_at FROM auth_attempts WHERE key=?").get(key) as {attempts:number;reset_at:number}|undefined;
 if(attempt&&attempt.reset_at>now&&attempt.attempts>=10)throw new OwnerError("Too many attempts. Try again in 15 minutes.",429);
 db().prepare("INSERT INTO auth_attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END").run(key,now+900000,now,now,now+900000);
 if(signup){
  const values=registration.parse(input);const hash=hashPassword(values.password);
  return transaction(()=>{
   if(db().prepare("SELECT id FROM users WHERE email=?").get(values.email))throw new OwnerError("Unable to create this account. Sign in or use a different email.",409);
   const userId=randomUUID(),organizationId=randomUUID(),at=new Date().toISOString();
   db().prepare("INSERT INTO organizations VALUES(?,?,?)").run(organizationId,values.organization,at);
   db().prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(userId,values.email,values.name,hash,at);
   db().prepare("INSERT INTO memberships VALUES(?,?,?)").run(organizationId,userId,"Business Owner");
   audit({organizationId,userId},"organization.created",organizationId);
   db().prepare("DELETE FROM auth_attempts WHERE key=?").run(key);return issue(userId,organizationId);
  });
 }
 const user=db().prepare("SELECT id,password_hash FROM users WHERE email=?").get(parsed.email) as {id:string;password_hash:string}|undefined;
 // Do comparable password work for unknown accounts.
 const valid=verify(parsed.password,user?.password_hash||"00000000000000000000000000000000:"+"00".repeat(64));
 if(!user||!valid)throw new OwnerError("Email or password is incorrect.",401);
 const membership=db().prepare("SELECT organization_id FROM memberships WHERE user_id=? ORDER BY organization_id LIMIT 1").get(user.id) as {organization_id:string}|undefined;
 if(!membership)throw new OwnerError("No organization membership.",403);
 return transaction(()=>{const token=issue(user.id,membership.organization_id);db().prepare("DELETE FROM auth_attempts WHERE key=?").run(key);audit({userId:user.id,organizationId:membership.organization_id},"session.signed_in",user.id);return token;});
}
export function signOut(token:string){const principal=sessionPrincipal(token);transaction(()=>{if(principal)audit(principal,"session.signed_out",principal.userId);db().prepare("DELETE FROM sessions WHERE token_hash=?").run(digest(token));});}
