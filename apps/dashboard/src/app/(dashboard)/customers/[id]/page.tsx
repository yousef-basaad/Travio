import { CustomerDetails } from "@/features/customers/components/customer-details";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CustomerDetails id={id} />;
}
