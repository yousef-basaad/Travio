// Thin re-export so this feature only ever imports its domain types from
// its own types/ module, not from @travio/types directly - Booking/
// BookingStatus aren't re-exported by @travio/api's public surface today,
// and packages/api is out of scope for this issue.
export type { Booking, BookingStatus } from "@travio/types";

// BookingTimelineEvent/BookingTimelineEventType do come from @travio/api
// (booking-timeline.mapper.ts) - re-exported here too so every domain type
// this feature uses is imported from this one local module.
export type { BookingTimelineEvent, BookingTimelineEventType } from "@travio/api";

// Same reasoning for BookingFlight/CabinClass (booking-flights.mapper.ts).
export type { BookingFlight, CabinClass } from "@travio/api";

// Same reasoning for BookingHotel/BoardType (booking-hotels.mapper.ts).
export type { BookingHotel, BoardType } from "@travio/api";

// Same reasoning for BookingTransfer/TransferType (booking-transfers.mapper.ts).
export type { BookingTransfer, TransferType } from "@travio/api";

// Same reasoning for BookingNote (booking-notes.mapper.ts).
export type { BookingNote } from "@travio/api";
