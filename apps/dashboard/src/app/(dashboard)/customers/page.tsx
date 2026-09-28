import { CustomersTable } from "@/features/customers/components/customers-table";

// ?new=1 opens the New Customer dialog (linked from the Quick add menu).
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openCreate } = await searchParams;
  return <CustomersTable openCreate={openCreate === "1"} />;
}
