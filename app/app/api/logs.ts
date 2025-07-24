// pages/api/log.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    console.log("[CLIENT LOG]", req.body.message); // will show in Vercel function logs
    res.status(200).json({ status: "ok" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
