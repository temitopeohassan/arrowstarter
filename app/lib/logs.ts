// lib/log.ts
export async function logToServer(message: string) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.error("[logToServer] failed:", err);
  }
}
