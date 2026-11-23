import { localSupabase } from "./local-env";

// Minimal calls to the LOCAL Supabase APIs used to build and remove the
// test agency. localSupabase() refuses anything that isn't 127.0.0.1.

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const local = localSupabase();
  const token = init.token ?? local.serviceRoleKey;
  const response = await fetch(`${local.url}${path}`, {
    ...init,
    headers: {
      apikey: init.token ? local.anonKey : local.serviceRoleKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${response.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  metadata: Record<string, string> = {},
): Promise<string> {
  const user = await request<{ id: string }>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName, ...metadata } }),
  });
  return user.id;
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
}

export async function signIn(email: string, password: string): Promise<string> {
  const session = await request<{ access_token: string }>("/auth/v1/token?grant_type=password", {
    method: "POST",
    token: localSupabase().anonKey,
    body: JSON.stringify({ email, password }),
  });
  return session.access_token;
}

// As the given user (their own token, so RLS and the function's own
// checks apply, same as the signup flow).
export async function rpcAs<T>(token: string, fn: string, args: Record<string, unknown>): Promise<T> {
  return request<T>(`/rest/v1/rpc/${fn}`, { method: "POST", token, body: JSON.stringify(args) });
}

// Service-role table access, for linking accounts the app would link by
// invitation (which needs email delivery).
export async function insert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const rows = await request<T[]>(`/rest/v1/${table}`, { method: "POST", body: JSON.stringify(row) });
  return rows[0]!;
}

export async function update(table: string, filter: string, values: Record<string, unknown>): Promise<void> {
  await request(`/rest/v1/${table}?${filter}`, { method: "PATCH", body: JSON.stringify(values) });
}

export async function remove(table: string, filter: string): Promise<void> {
  await request(`/rest/v1/${table}?${filter}`, { method: "DELETE" });
}
