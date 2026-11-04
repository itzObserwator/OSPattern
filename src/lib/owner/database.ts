// Server-only repository. Never import this module into a client component.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
let database:DatabaseSync|undefined;
export function db() {
 if(database)return database;
 const filename=process.env.BUSINESSOS_DATABASE_PATH||resolve(process.cwd(),".data/owner.sqlite");
 mkdirSync(dirname(filename),{recursive:true,mode:0o700});
 const next=new DatabaseSync(filename);
 next.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);");
 if(!next.prepare("SELECT version FROM schema_migrations WHERE version=1").get()){
  next.exec("BEGIN IMMEDIATE");
  try {next.exec(readFileSync(resolve(process.cwd(),"migrations/001_owner_foundation.sql"),"utf8"));next.prepare("INSERT INTO schema_migrations VALUES(1,?)").run(new Date().toISOString());next.exec("COMMIT");}catch(e){next.exec("ROLLBACK");next.close();throw e;}
 }
 chmodSync(filename,0o600);database=next;return next;
}
export function transaction<T>(work:()=>T):T {const d=db();d.exec("BEGIN IMMEDIATE");try {const result=work();d.exec("COMMIT");return result;}catch(e){d.exec("ROLLBACK");throw e;}}
export class OwnerError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
