export function isAdminApp() {
  const mode = process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "web";
  return String(mode).toLowerCase() === "admin";
}

export function isWebApp() {
  const mode = process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "web";
  return String(mode).toLowerCase() === "web";
}
