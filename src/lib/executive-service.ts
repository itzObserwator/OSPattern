import type { BusinessRecord } from "./models";
import type { ExecutiveData } from "./executive";

export type ExecutiveRole = "Organization Owner" | "Organization Admin" | "CEO" | "Operations Head";
export type VerifiedPrincipal = { userId: string; organizationId: string; role: string; verified: boolean };
const roles: readonly string[] = ["Organization Owner", "Organization Admin", "CEO", "Operations Head"];
export function requireExecutive(principal: VerifiedPrincipal | null, organizationId: string) {
  if (!principal?.verified || principal.organizationId !== organizationId || !roles.includes(principal.role)) throw new Error("Executive access denied");
}
// A real implementation must obtain the principal from a trusted server session,
// then constrain EVERY query/mutation by organizationId. Never accept it from a request body.
export interface ExecutiveRepository {
  read(principal: VerifiedPrincipal, organizationId: string): Promise<{ records: BusinessRecord[]; data: ExecutiveData }>;
  decideApproval(principal: VerifiedPrincipal, organizationId: string, id: string, decision: "Approved" | "Rejected"): Promise<void>;
}
export async function readExecutive(repository: ExecutiveRepository, principal: VerifiedPrincipal | null, organizationId: string) {
  requireExecutive(principal, organizationId);
  return repository.read(principal!, organizationId);
}
export async function decideExecutiveApproval(repository: ExecutiveRepository, principal: VerifiedPrincipal | null, organizationId: string, id: string, decision: "Approved" | "Rejected") {
  requireExecutive(principal, organizationId);
  return repository.decideApproval(principal!, organizationId, id, decision);
}
