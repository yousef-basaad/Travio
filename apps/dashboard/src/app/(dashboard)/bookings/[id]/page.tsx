import { BookingDetails } from "@/features/bookings/components/booking-details";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookingDetails id={id} />;
}
