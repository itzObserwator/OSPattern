// Fictional client identities available for explicitly linking sample records.
// Selecting an option does not import portal invoices, balances or other financial fixtures.
export const salaryClientOption = { id: "client-salary", name: "Salary" } as const;

export const sampleRecordClients = [
  salaryClientOption,
  { id: "sample-client-acme", name: "Acme Studio" },
  { id: "sample-client-atlas", name: "Atlas Digital" },
  { id: "sample-client-nova", name: "Nova Collective" },
] as const;

export function availableSampleClients(existing: { id: string; name: string }[]) {
  const ids = new Set(existing.map(client => client.id));
  const names = new Set(existing.map(client => client.name.trim().toLowerCase()));
  return sampleRecordClients.filter(client => !ids.has(client.id) && !names.has(client.name.toLowerCase()));
}
