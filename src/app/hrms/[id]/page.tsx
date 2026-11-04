import { EmployeeProfile } from "@/components/business/employee-profile";
export const metadata = { title: "Employee profile" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeProfile id={id} />;
}
