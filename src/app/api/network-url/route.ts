import { NextRequest, NextResponse } from "next/server";
import os from "os";

export async function GET(request: NextRequest) {
  // Use the port from the request host header
  const host = request.headers.get("host") || "localhost:3000";
  const port = host.includes(":") ? host.split(":")[1] : "3000";

  // Find the local network IPv4 address (not loopback)
  const interfaces = os.networkInterfaces();
  let networkIp = "localhost";

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) {
        networkIp = addr.address;
        break;
      }
    }
    if (networkIp !== "localhost") break;
  }

  return NextResponse.json({
    url: `http://${networkIp}:${port}`,
    ip: networkIp,
    port,
  });
}
