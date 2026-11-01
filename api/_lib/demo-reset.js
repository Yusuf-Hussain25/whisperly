// Shared by the daily cron (api/cron/demo-reset.js) and the npm scripts in scripts/.
//
// The demo login is shared by every visitor. firestore.rules already stops it from editing
// its profile or starting new chats, but visitors can still send messages, open unread chats
// and receive chats from real users. Once a day the demo is put back to its seeded state
// (the baseline in demo-baseline.js), with every timestamp moved forward by the time since
// the baseline was captured, so the conversations always look recent.
//
// Everything runs signed in as the demo account through the normal client SDK, so it goes
// through the same security rules as the app.
import { deleteApp, initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Timestamp, doc, getDoc, getFirestore, terminate, updateDoc } from "firebase/firestore";

const toMillis = (value) => (typeof value?.toMillis === "function" ? value.toMillis() : new Date(value).getTime());

export async function signInAsDemo(env) {
    for (const key of ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_DEMO_EMAIL", "VITE_DEMO_PASSWORD"]) {
        if (!env[key]) throw new Error(`Missing ${key}`);
    }
    const app = initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
    }, `demo-reset-${Date.now()}`);
    const auth = getAuth(app);
    const { user } = await signInWithEmailAndPassword(auth, env.VITE_DEMO_EMAIL, env.VITE_DEMO_PASSWORD);
    const db = getFirestore(app);
    const close = async () => {
        await terminate(db);
        await deleteApp(app);
    };
    return { db, uid: user.uid, close };
}

// Reads the demo's chat list, every conversation in it and the other person's chat list
// entry for it. Timestamps are stored as milliseconds.
export async function captureBaseline(db, uid) {
    const chats = (await getDoc(doc(db, "chats", uid))).data()?.chatsData || [];
    const conversations = {};
    for (const chat of chats) {
        const messages = (await getDoc(doc(db, "messages", chat.messageId))).data()?.messages || [];
        const partnerChats = (await getDoc(doc(db, "chats", chat.rId))).data()?.chatsData || [];
        const partnerEntry = partnerChats.find((entry) => entry.messageId === chat.messageId) || null;
        conversations[chat.messageId] = {
            partnerId: chat.rId,
            messages: messages.map((m) => ({ ...m, createdAt: toMillis(m.createdAt) })),
            partnerEntry,
        };
    }
    // The moment the seeded chats represent: just after their newest message. Restoring
    // moves that moment to "now", so the latest message always looks a few minutes old.
    const newest = Math.max(
        0,
        ...chats.map((chat) => chat.updatedAt || 0),
        ...Object.values(conversations).flatMap((conv) => conv.messages.map((m) => m.createdAt || 0)),
    );
    return { asOf: (newest || Date.now()) + 5 * 60 * 1000, uid, chats, conversations };
}

export async function restoreBaseline(db, baseline, now = Date.now()) {
    const shift = now - baseline.asOf;
    const moved = (entry) => ({ ...entry, updatedAt: entry.updatedAt + shift });
    let conversations = 0;

    for (const [messageId, conv] of Object.entries(baseline.conversations)) {
        await updateDoc(doc(db, "messages", messageId), {
            messages: conv.messages.map((m) => ({ ...m, createdAt: Timestamp.fromMillis(m.createdAt + shift) })),
        });
        if (conv.partnerEntry) {
            const partnerRef = doc(db, "chats", conv.partnerId);
            const partnerChats = (await getDoc(partnerRef)).data()?.chatsData || [];
            const restored = partnerChats.map((entry) => (entry.messageId === messageId ? moved(conv.partnerEntry) : entry));
            if (!partnerChats.some((entry) => entry.messageId === messageId)) restored.push(moved(conv.partnerEntry));
            await updateDoc(partnerRef, { chatsData: restored });
        }
        conversations++;
    }

    // Drops chats other accounts started with the demo and restores the unread badges
    await updateDoc(doc(db, "chats", baseline.uid), { chatsData: baseline.chats.map(moved) });
    return { conversations, shiftedByHours: Math.round(shift / 36e5) };
}
