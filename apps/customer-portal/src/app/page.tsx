import type { Route } from "next";
import { redirect } from "next/navigation";

// The portal has no home page of its own: bookings are where a customer
// starts, and that page's layout sends anyone not signed in to /login.
export default function Home() {
  redirect("/bookings" as Route);
}
