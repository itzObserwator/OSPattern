import { LayoutDashboard, CheckSquare2, Users, FolderKanban, TrendingUp, Megaphone, Wallet, Sparkles, Workflow, FlaskConical, PanelsTopLeft, Settings2 } from "lucide-react";

export const navigation = [
  { label: "Workspace", items: [
    { slug: "", label: "Overview", icon: LayoutDashboard, description: "A clear view of everything moving your business forward." },
    { slug: "tasks", label: "My work", icon: CheckSquare2, kind: "task", description: "Your priorities, deadlines, and next steps in one place." },
  ] },
  { label: "Operations", items: [
    { slug: "projects", label: "Projects", icon: FolderKanban, kind: "project", description: "Keep delivery, ownership, and project health in focus." },
    { slug: "hrms", label: "People & HR", icon: Users, kind: "employee", description: "The people behind your best work." },
    { slug: "crm", label: "CRM & Sales", icon: TrendingUp, kind: "lead", description: "Turn your next conversation into your next opportunity." },
    { slug: "marketing", label: "Marketing", icon: Megaphone, description: "Bring campaigns, content, and approvals together." },
    { slug: "finance", label: "Finance", icon: Wallet, kind: "invoice", description: "A transparent view of revenue and business expenses." },
  ] },
  { label: "Intelligence", items: [
    { slug: "ai-assistant", label: "AI Assistant", icon: Sparkles, description: "A contextual workspace for your business questions." },
    { slug: "workflows", label: "Workflows", icon: Workflow, description: "Connect the steps that keep your business moving." },
  ] },
  { label: "Management", items: [
    { slug: "client-portal", label: "Client portal", icon: PanelsTopLeft, description: "A simpler space for client collaboration." },
    { slug: "sandbox", label: "Sandbox", icon: FlaskConical, description: "A place to review and test future configurations." },
    { slug: "settings", label: "Settings", icon: Settings2, description: "Your workspace preferences and environment." },
  ] },
] as const;
export const modules = navigation.flatMap(group => [...group.items]);
