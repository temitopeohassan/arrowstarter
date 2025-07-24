export async function log(...args: any[]) {
  const message = args.map(arg => 
    typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)
  ).join(" ");

  if (process.env.NODE_ENV === "development") {
    console.log("[log]", message);
  }

  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.error("[log] failed:", err);
  }
}
