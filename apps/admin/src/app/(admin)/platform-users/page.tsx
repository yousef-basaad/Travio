import { AlertCircle } from "lucide-react";
import { platformService, type PlatformUserPage } from "@travio/api";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { PlatformUsersView } from "@/features/platform-users";
import { USERS_PAGE_SIZE, parseUserParams } from "@/features/platform-users/utils/user-params";
import { getLocale } from "@/lib/i18n/get-locale";
import { translate } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Rendered alongside the layout's gate, so it checks the role itself.
  if (!(await requireRole(["travio_admin"])).authorized) return null;

  const params = parseUserParams(await searchParams);
  let data: PlatformUserPage | null = null;
  try {
    data = await platformService.listUsers(await createServerSupabaseClient(), { ...params, pageSize: USERS_PAGE_SIZE });
  } catch (error) {
    console.error("[admin] platform_users failed", error);
  }

  if (!data) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {translate(await getLocale(), "users.error")}
      </div>
    );
  }

  return <PlatformUsersView data={data} params={params} />;
}
