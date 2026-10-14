"use client";
// Last resort if the whole app fails to load. It replaces the root layout, so it brings its own
// minimal styles (the app's stylesheet isn't loaded here) and follows the device's light or dark setting.
import Link from "next/link";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", lineHeight: 1.55, colorScheme: "light dark" }}>
        <title>Something went wrong · Leader Onboarding</title>
        <main style={{ maxWidth: 560, margin: "15vh auto", padding: "0 20px" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 12px" }}>Something went wrong</h1>
          <p>The program didn&apos;t load properly. Your progress is safe. Try again in a moment.</p>
          <p style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => retry()} style={{ font: "inherit", padding: "10px 16px", borderRadius: 10, border: 0, background: "#1F5FA8", color: "#fff", cursor: "pointer" }}>Try again</button>
            <Link href="/" style={{ padding: "10px 16px" }}>Go to the program</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
