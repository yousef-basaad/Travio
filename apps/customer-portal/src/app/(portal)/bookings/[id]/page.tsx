import { BookingDetailsView } from "@/features/bookings";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetailsView id={id} />;
}
