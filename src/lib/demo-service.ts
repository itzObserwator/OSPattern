import type { BusinessRecord, RecordKind } from "./models";

const make = (kind: RecordKind, title: string, owner: string, status: BusinessRecord["status"], date: string, amount = 0, progress = 0): BusinessRecord => ({ id: `${kind}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${date}`, kind, title, owner, status, date, amount, progress });

const projects = [
  make("project", "Acme website redesign", "Olivia Chen", "On track", "2026-11-12", 24000, 76),
  make("project", "Atlas mobile experience", "James Wilson", "On track", "2026-11-18", 42000, 58),
  make("project", "Nova brand platform", "Sofia Patel", "At risk", "2026-11-06", 18000, 42),
  make("project", "Orbit customer portal", "Noah Kim", "On track", "2026-11-24", 36000, 34),
  make("project", "Vertex analytics suite", "Emma Davis", "Delayed", "2026-11-01", 28000, 87),
  make("project", "Linear growth campaign", "Liam Brooks", "On track", "2026-11-28", 12000, 22),
];
const people = ["Olivia Chen", "James Wilson", "Sofia Patel", "Noah Kim", "Emma Davis", "Liam Brooks", "Ava Thompson", "Ethan Miller", "Mia Garcia", "Lucas Martin", "Isabella Lee", "Arjun Shah"];
const tasks = [
  make("task", "Review Acme homepage concepts", "Olivia Chen", "Pending", "2026-11-02"),
  make("task", "Finalize Nova design direction", "Sofia Patel", "At risk", "2026-11-03"),
  make("task", "Resolve analytics API blockers", "Emma Davis", "Delayed", "2026-11-01"),
  make("task", "Send Atlas milestone update", "James Wilson", "Pending", "2026-11-04"),
  make("task", "QA Orbit authentication flow", "Noah Kim", "Pending", "2026-11-05"),
  make("task", "Approve November content plan", "Liam Brooks", "Pending", "2026-11-06"),
  make("task", "Publish October project report", "Ava Thompson", "Completed", "2026-10-31"),
];
const financials = Array.from({ length: 7 }, (_, i) => {
  const month = `2026-${String(i + 5).padStart(2, "0")}`;
  return [
    make("invoice", `Acme retainer · ${month}`, "Olivia Chen", "Paid", `${month}-01`, [18000, 21000, 24000, 22500, 28000, 32000, 12000][i]),
    make("invoice", `Atlas delivery · ${month}`, "James Wilson", "Paid", `${month}-02`, [12000, 15000, 14000, 19500, 18000, 22000, 8000][i]),
    make("expense", `Team & operations · ${month}`, "Arjun Shah", "Paid", `${month}-01`, [18000, 19000, 22000, 21000, 25000, 27000, 9000][i]),
    make("expense", `Software & contractors · ${month}`, "Arjun Shah", "Paid", `${month}-02`, [4000, 6000, 5000, 7000, 6500, 8000, 2500][i]),
  ];
}).flat();

// This adapter is the sole initial source. Replace it with an authenticated,
// tenant-scoped server adapter when a supported backend becomes available.
export const demoService = {
  async getRecords(): Promise<BusinessRecord[]> {
    return [...projects, ...tasks,
      ...people.map(name => make("employee", name, "Studio North", "Active", "2026-10-01")),
      ...["Horizon Labs", "Evergreen Digital", "Pulse Health", "Studio Forma", "Summit Ventures"].map((title, i) => make("lead", title, people[i], "Active", "2026-11-05", 15000 + i * 5000)),
      ...financials];
  },
};
