// Standard organization departments remain selectable before records are assigned.
// Imported departments retain their IDs and names; no business records are reassigned.
export const standardDepartments = [
  { id: "Administration", name: "Administration" },
  { id: "Customer Success", name: "Customer Success" },
  { id: "Design", name: "Design" },
  { id: "Engineering", name: "Engineering" },
  { id: "Finance", name: "Finance" },
  { id: "Marketing", name: "Marketing" },
  { id: "Operations", name: "Operations" },
  { id: "People", name: "People & HR" },
  { id: "Delivery", name: "Project Management" },
  { id: "Sales", name: "Sales" },
] as const;

export function departmentOptions(registered: { id: string; name: string }[], referencedIds: string[]) {
  const options = new Map<string, { id: string; name: string }>(standardDepartments.map(d => [d.id, d]));
  for (const department of registered) options.set(department.id, department);
  for (const id of referencedIds) if (id && !options.has(id)) options.set(id, { id, name: id });
  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
}
