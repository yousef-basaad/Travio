import { LoginForm } from "@/features/settings/components/login-form";
import { getLoginNotice } from "@/features/settings/utils/login-notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; confirmed?: string }>;
}) {
  const notice = getLoginNotice(await searchParams);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      {notice ? (
        <p role="status" className="w-80 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
