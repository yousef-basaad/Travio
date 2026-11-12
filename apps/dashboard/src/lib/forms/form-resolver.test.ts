import { describe, expect, it } from "vitest";
import type { ResolverOptions } from "react-hook-form";
import { createBookingFormSchema } from "@/features/bookings/schemas/create-booking.schema";
import { formResolver } from "./form-resolver";

// The resolver has to keep working with zod 4: errors per field, with
// the message keys the forms translate, and transformed values on success.
const options = { fields: {}, shouldUseNativeValidation: false } as ResolverOptions<never>;

describe("formResolver", () => {
  const resolve = formResolver(createBookingFormSchema);

  it("returns field errors with their message keys", async () => {
    const result = await resolve({ customerId: "", title: "", adults: "x" } as never, undefined, options);
    expect(result.values).toEqual({});
    expect(result.errors.customerId?.message).toBe("validation.selectCustomer");
    expect(result.errors.adults?.message).toBe("validation.travelerCount");
  });

  it("returns the parsed values when the form is valid", async () => {
    const result = await resolve(
      { customerId: "c1", title: "Trip", adults: "2", destinationCountry: "", startDate: "" } as never,
      undefined,
      options,
    );
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ customerId: "c1", title: "Trip", adults: 2 });
  });
});
