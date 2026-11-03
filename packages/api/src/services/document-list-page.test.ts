import { describe, it, expect } from "vitest";
import { documentService } from "./document.service";
import { createFakeSupabaseClient, findCalls, findCallsByMethod } from "../test-utils/fake-supabase";

function documentRow(id: string, ownerType: string, ownerId: string | null) {
  return {
    id,
    tenant_id: "t1",
    owner_type: ownerType,
    owner_id: ownerId,
    document_type: "passport",
    file_name: `${id}.pdf`,
    file_path: `t1/${id}.pdf`,
    mime_type: "application/pdf",
    file_size: 100,
    uploaded_by: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    deleted_at: null,
  };
}

describe("documentService.listPage", () => {
  it("pages, filters and searches documents, newest first", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      documents: [{ data: [], count: 1200, error: null } as never],
    });

    const page = await documentService.listPage(client, "t1", {
      page: 3,
      pageSize: 25,
      search: "passport scan",
      ownerType: "customer",
      documentType: "passport",
    });

    expect(findCallsByMethod(allCalls, "documents", "select")[0]?.args).toEqual(["*", { count: "exact", head: false }]);
    expect(findCallsByMethod(allCalls, "documents", "range")[0]?.args).toEqual([50, 74]);
    const eqArgs = findCallsByMethod(allCalls, "documents", "eq").map((call) => call.args);
    expect(eqArgs).toEqual([
      ["tenant_id", "t1"],
      ["owner_type", "customer"],
      ["document_type", "passport"],
    ]);
    expect(findCallsByMethod(allCalls, "documents", "is")[0]?.args).toEqual(["deleted_at", null]);
    expect(findCallsByMethod(allCalls, "documents", "or")[0]?.args).toEqual(['file_name.ilike."*passport scan*"']);
    expect(page).toEqual({ items: [], total: 1200, page: 3, pageSize: 25 });
    // Nothing on the page -> no owner lookups at all.
    expect(findCalls(allCalls, "customers")).toHaveLength(0);
  });

  it("labels each document with its owner, looking up only the ids on the page", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      documents: [
        {
          data: [
            documentRow("d1", "customer", "c1"),
            documentRow("d2", "customer", "c1"),
            documentRow("d3", "booking", "b1"),
            documentRow("d4", "invoice", "i1"),
            documentRow("d5", "agency", null),
            documentRow("d6", "customer", "c-hidden"),
          ],
          count: 6,
          error: null,
        } as never,
      ],
      customers: [{ data: [{ id: "c1", full_name: "Sara Ali" }], error: null }],
      bookings: [{ data: [{ id: "b1", booking_number: "BK-1", title: "Umrah trip" }], error: null }],
      invoices: [{ data: [{ id: "i1", invoice_number: "INV-7" }], error: null }],
    });

    const page = await documentService.listPage(client, "t1", { page: 1, pageSize: 25 });

    expect(findCallsByMethod(allCalls, "customers", "in")[0]?.args).toEqual(["id", ["c1", "c-hidden"]]);
    expect(findCallsByMethod(allCalls, "bookings", "in")[0]?.args).toEqual(["id", ["b1"]]);
    expect(findCallsByMethod(allCalls, "invoices", "in")[0]?.args).toEqual(["id", ["i1"]]);
    expect(page.items.map((item) => [item.id, item.ownerLabel])).toEqual([
      ["d1", "Sara Ali"],
      ["d2", "Sara Ali"],
      ["d3", "BK-1 · Umrah trip"],
      ["d4", "INV-7"],
      ["d5", null],
      // RLS hid this customer: no label rather than an error.
      ["d6", null],
    ]);
  });

  it("only queries the owner types present on the page", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      documents: [{ data: [documentRow("d1", "booking", "b1")], count: 1, error: null } as never],
      bookings: [{ data: [{ id: "b1", booking_number: "BK-1", title: "Trip" }], error: null }],
    });

    await documentService.listPage(client, "t1", { page: 1, pageSize: 25 });

    expect(findCalls(allCalls, "customers")).toHaveLength(0);
    expect(findCalls(allCalls, "invoices")).toHaveLength(0);
    expect(findCalls(allCalls, "bookings")).toHaveLength(1);
  });

  it("a page past the end becomes an empty page with the real total", async () => {
    const { client } = createFakeSupabaseClient({
      documents: [
        { data: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } },
        { data: null, count: 4, error: null } as never,
      ],
    });
    const page = await documentService.listPage(client, "t1", { page: 2, pageSize: 25 });
    expect(page).toEqual({ items: [], total: 4, page: 2, pageSize: 25 });
  });
});
