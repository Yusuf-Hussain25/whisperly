import baseline from "../_lib/demo-baseline.js";
import { restoreBaseline, signInAsDemo } from "../_lib/demo-reset.js";

// Called once a day by Vercel Cron (vercel.json). Vercel sends CRON_SECRET as a bearer token.
export default async function handler(req, res) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ ok: false });
    }
    let session;
    try {
        session = await signInAsDemo(process.env);
        if (session.uid !== baseline.uid) throw new Error("The demo account doesn't match the saved baseline");
        const result = await restoreBaseline(session.db, baseline);
        return res.status(200).json({ ok: true, ...result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, error: error.message });
    } finally {
        await session?.close();
    }
}
