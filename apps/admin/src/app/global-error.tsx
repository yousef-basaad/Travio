"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] root error", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0, textAlign: "center" }}>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>حدث خطأ غير متوقع</h1>
          <p lang="en" dir="ltr" style={{ color: "#64748b" }}>Something went wrong.</p>
          <button type="button" onClick={reset} style={{ padding: "8px 16px", cursor: "pointer" }}>
            حاول مرة أخرى / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
