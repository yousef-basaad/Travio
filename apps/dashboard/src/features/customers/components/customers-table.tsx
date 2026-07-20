"use client";

import { useSession } from "@travio/auth";
import { useCustomers } from "../api/customers.api";
import type { Database } from "@travio/database";

type Customer =
  Database["public"]["Tables"]["customers"]["Row"];



export function CustomersTable() {
  const { profile } = useSession();

  const { data, isLoading } = useCustomers(
    profile?.tenantId ?? ""
  );

  const customers: Customer[] = data ?? [];

  if (isLoading) return <p>Loading customers…</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2">Name</th>
          <th className="py-2">Email</th>
          <th className="py-2">Phone</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id} className="border-b">
            <td className="py-2">{customer.full_name}</td>
            <td className="py-2">{customer.email}</td>
            <td className="py-2">{customer.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}