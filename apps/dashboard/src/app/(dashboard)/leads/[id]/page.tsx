import { LeadDetails } from "@/features/leads/components/lead-details";

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LeadDetails id={id} />;
}
