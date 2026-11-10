import { describe, it, expect } from "vitest";
import { PlanLimitError, throwIfPlanLimit } from "./plan-limit-error";
import { handleApiError } from "./handle-api-error";

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status });

describe("plan limit errors", () => {
  it("turns the API's refusal into a PlanLimitError", async () => {
    await expect(throwIfPlanLimit(json({ error: "plan_limit_reached", limit: "max_documents" }, 403))).rejects.toMatchObject({
      messageKey: "planLimit.max_documents",
    });
  });

  it("uses a general message for an unknown limit", () => {
    expect(new PlanLimitError("max_cats").messageKey).toBe("planLimit.generic");
  });

  it("ignores every other response and leaves the body readable", async () => {
    await expect(throwIfPlanLimit(json({ error: "forbidden" }, 403))).resolves.toBeUndefined();
    await expect(throwIfPlanLimit(json({ error: "plan_limit_reached" }, 500))).resolves.toBeUndefined();
    const response = json({ error: "forbidden" }, 403);
    await throwIfPlanLimit(response);
    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
  });

  it("the API answers 403 for a database limit error, not 500", async () => {
    const response = handleApiError({ code: "PL001", message: "plan_limit_reached", details: "max_bookings_monthly" });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "plan_limit_reached", limit: "max_bookings_monthly" });
  });

  it("other errors stay a 500", async () => {
    expect(handleApiError(new Error("boom")).status).toBe(500);
  });
});
