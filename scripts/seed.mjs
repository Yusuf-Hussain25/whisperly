// Seeds Whisperly with a demo account, eight contacts and realistic conversations.
//
//   npm run seed                      # demo account + contacts + conversations
//   npm run seed -- --with <username> # also start conversations with your own account
//
// Needs in .env: the VITE_FIREBASE_* values, VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD and
// SEED_PASSWORD (password for the contact accounts). Uses the normal client SDK, so it
// runs under the same Firestore security rules as the app. Safe to re-run: existing
// accounts are reused and existing conversations are skipped.
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, writeBatch, collection, arrayUnion, serverTimestamp, terminate } from "firebase/firestore";

const env = Object.fromEntries(
    readFileSync(new URL("../.env", import.meta.url), "utf8")
        .split("\n")
        .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
        .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()])
);

for (const key of ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_DEMO_EMAIL", "VITE_DEMO_PASSWORD", "SEED_PASSWORD"]) {
    if (!env[key]) {
        console.error(`Missing ${key} in .env`);
        process.exit(1);
    }
}

const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const now = Date.now();
const portrait = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
const photo = (id) => `https://picsum.photos/id/${id}/900/650`;

const DEMO = {
    username: "demo",
    email: env.VITE_DEMO_EMAIL,
    password: env.VITE_DEMO_PASSWORD,
    name: "Alex Rivera",
    bio: "Product engineer · coffee first, code second ☕",
    avatar: portrait("men", 32),
    lastSeen: now,
};

// online: true keeps the contact showing "Active now" for the demo
const CONTACTS = [
    { username: "aisha.khan", name: "Aisha Khan", bio: "Product designer @ Lumen. Pixels with purpose ✨", avatar: portrait("women", 44), online: true },
    { username: "marco.rossi", name: "Marco Rossi", bio: "Chef by night, backend dev by day 🍝", avatar: portrait("men", 75), lastSeen: now - 12 * MIN },
    { username: "priya.nair", name: "Priya Nair", bio: "Trail runner. Mountains > meetings 🏔️", avatar: portrait("women", 68), lastSeen: now - 3 * HOUR },
    { username: "liam.chen", name: "Liam Chen", bio: "Shipping things at the speed of coffee", avatar: portrait("men", 22), online: true },
    { username: "sofia.martinez", name: "Sofía Martínez", bio: "Music, films and very long playlists 🎧", avatar: portrait("women", 17), lastSeen: now - 26 * HOUR },
    { username: "noah.williams", name: "Noah Williams", bio: "5am runs and 5pm espresso", avatar: portrait("men", 46), lastSeen: now - 2 * DAY },
    { username: "emma.dubois", name: "Emma Dubois", bio: "Paris-based photographer 📷", avatar: portrait("women", 90), lastSeen: now - 50 * MIN },
    { username: "kenji.tanaka", name: "Kenji Tanaka", bio: "Building games, one bug at a time 🎮", avatar: portrait("men", 11), lastSeen: now - 4 * HOUR },
];

// Conversation scripts. "me" is the demo account (or --with user); t is minutes ago.
// unread: the last message from the contact has not been opened yet.
const THREADS = {
    "aisha.khan": {
        unread: true,
        messages: [
            { from: "them", t: 95, text: "Morning! Did you get a chance to look at the new onboarding flow?" },
            { from: "me", t: 90, text: "Not yet, opening Figma now 👀" },
            { from: "me", t: 71, text: "Okay this is SO much cleaner. The progress dots are a nice touch" },
            { from: "them", t: 69, text: "Right?? I cut it from 6 screens to 3" },
            { from: "them", t: 68, text: "Here's the moodboard I pulled the colors from" },
            { from: "them", t: 67, image: photo(1015) },
            { from: "me", t: 40, text: "Love the palette. Can we try the gradient on the CTA too?" },
            { from: "them", t: 6, text: "Done! Pushed a new version 🎉" },
            { from: "them", t: 3, text: "Can you review before the 4pm sync?" },
        ],
    },
    "marco.rossi": {
        messages: [
            { from: "them", t: 180, text: "Pizza night at mine on Friday?" },
            { from: "me", t: 170, text: "Always yes. What should I bring?" },
            { from: "them", t: 165, text: "Just yourself, and maybe something sweet 🍰" },
            { from: "them", t: 160, image: photo(1080) },
            { from: "them", t: 159, text: "Testing a new dough recipe, 72 hour ferment" },
            { from: "me", t: 75, text: "That looks incredible. I'll bring tiramisu" },
            { from: "them", t: 62, text: "Perfect, 7:30 then 🙌" },
        ],
    },
    "liam.chen": {
        messages: [
            { from: "them", t: 26 * 60, text: "Hey, the deploy pipeline is green again" },
            { from: "me", t: 26 * 60 - 5, text: "Legend. What was it?" },
            { from: "them", t: 26 * 60 - 7, text: "A cache key that never expired 🙃" },
            { from: "me", t: 26 * 60 - 8, text: "Classic. Want to pair on the search feature tomorrow?" },
            { from: "them", t: 25 * 60, text: "Sure, 10am works" },
            { from: "me", t: 24 * 60 + 30, text: "Booked it. I'll bring the coffee ☕" },
        ],
    },
    "priya.nair": {
        messages: [
            { from: "them", t: 30 * 60, text: "Are we still on for the hike on Saturday?" },
            { from: "me", t: 29 * 60, text: "Yes! Which trail?" },
            { from: "them", t: 29 * 60 - 3, text: "The ridge loop. 14km, mostly shade" },
            { from: "them", t: 29 * 60 - 4, image: photo(1036) },
            { from: "them", t: 29 * 60 - 5, text: "This is the view from the top 😍" },
            { from: "me", t: 28 * 60, text: "Okay I'm sold. Meet at 7?" },
            { from: "them", t: 27 * 60 + 40, text: "7 it is. Bring snacks!" },
        ],
    },
    "sofia.martinez": {
        unread: true,
        messages: [
            { from: "me", t: 3 * 24 * 60 + 200, text: "Did you get the tickets?" },
            { from: "them", t: 3 * 24 * 60 + 190, text: "Got them!! Row 12, center 🎶" },
            { from: "me", t: 3 * 24 * 60 + 180, text: "No way, amazing" },
            { from: "them", t: 3 * 24 * 60 + 60, text: "Made us a warm-up playlist, sending it tonight" },
            { from: "them", t: 3 * 24 * 60, text: "Also, dinner before the show? There's a new taco place nearby 🌮" },
        ],
    },
    "noah.williams": {
        messages: [
            { from: "them", t: 5 * 24 * 60 + 90, text: "10k this Sunday, you in?" },
            { from: "me", t: 5 * 24 * 60 + 80, text: "My legs say no, my heart says yes" },
            { from: "them", t: 5 * 24 * 60 + 75, text: "Heart wins. 6am at the park gate 🏃" },
            { from: "me", t: 5 * 24 * 60 + 70, text: "See you there 💪" },
        ],
    },
    "emma.dubois": {
        messages: [
            { from: "me", t: 9 * 24 * 60 + 300, text: "Heading to Paris next month, any tips?" },
            { from: "them", t: 9 * 24 * 60 + 250, text: "Oh you'll love it! Skip the big queues and walk along the canal at sunset" },
            { from: "them", t: 9 * 24 * 60 + 249, image: photo(1043) },
            { from: "them", t: 9 * 24 * 60 + 248, text: "Took this one last week" },
            { from: "me", t: 9 * 24 * 60 + 200, text: "That light is unreal 📸" },
            { from: "them", t: 9 * 24 * 60 + 190, text: "Send me your dates, I'll make you a list ❤️" },
        ],
    },
    // kenji.tanaka has no conversation, so you can try search + "start a chat" with him
};

const ensureAccount = async (person) => {
    const email = person.email || `${person.username}@whisperly-demo.dev`;
    const password = person.password || env.SEED_PASSWORD;
    const profile = {
        name: person.name,
        bio: person.bio,
        avatar: person.avatar,
        // "online" contacts get a far-future lastSeen so they keep showing as active in the demo
        lastSeen: person.online ? now + 365 * DAY : person.lastSeen ?? now,
    };

    await signOut(auth);
    const taken = await getDoc(doc(db, "usernames", person.username));
    let uid;
    if (taken.exists()) {
        ({ user: { uid } } = await signInWithEmailAndPassword(auth, email, password));
        await updateDoc(doc(db, "users", uid), profile);
        console.log(`  ✓ ${person.username} (existing, profile refreshed)`);
    } else {
        ({ user: { uid } } = await createUserWithEmailAndPassword(auth, email, password));
        const batch = writeBatch(db);
        batch.set(doc(db, "users", uid), { id: uid, username: person.username, email, ...profile });
        batch.set(doc(db, "chats", uid), { chatsData: [] });
        batch.set(doc(db, "usernames", person.username), { uid });
        await batch.commit();
        console.log(`  + ${person.username} (created)`);
    }
    return uid;
};

// Runs while signed in as the contact, who is a participant of the conversation.
const seedThread = async (contactId, meId, thread) => {
    const theirChats = (await getDoc(doc(db, "chats", contactId))).data().chatsData;
    if (theirChats.some((c) => c.rId === meId)) return false;

    const messages = thread.messages.map((m) => ({
        sId: m.from === "me" ? meId : contactId,
        ...(m.image ? { image: m.image } : { text: m.text }),
        createdAt: new Date(now - m.t * MIN),
    }));
    const last = thread.messages[thread.messages.length - 1];
    const lastMessage = last.image ? "Image" : last.text;
    const updatedAt = now - last.t * MIN;

    const ref = doc(collection(db, "messages"));
    await setDoc(ref, { createAt: serverTimestamp(), participants: [contactId, meId], messages });
    await updateDoc(doc(db, "chats", contactId), {
        chatsData: arrayUnion({ messageId: ref.id, lastMessage, rId: meId, updatedAt, messageSeen: true }),
    });
    await updateDoc(doc(db, "chats", meId), {
        chatsData: arrayUnion({ messageId: ref.id, lastMessage, rId: contactId, updatedAt, messageSeen: !thread.unread }),
    });
    return true;
};

const withIndex = process.argv.indexOf("--with");
const withUsername = withIndex > -1 ? process.argv[withIndex + 1]?.toLowerCase() : null;

console.log("Accounts");
const demoId = await ensureAccount(DEMO);
const contactIds = {};
for (const contact of CONTACTS) {
    contactIds[contact.username] = await ensureAccount(contact);
}

const targets = [{ label: "demo", id: demoId }];
if (withUsername) {
    const snap = await getDoc(doc(db, "usernames", withUsername));
    if (!snap.exists()) {
        console.error(`\nNo Whisperly user named "${withUsername}"`);
    } else {
        targets.push({ label: withUsername, id: snap.data().uid });
    }
}

for (const target of targets) {
    console.log(`\nConversations for ${target.label}`);
    for (const [username, thread] of Object.entries(THREADS)) {
        await signOut(auth);
        await signInWithEmailAndPassword(auth, `${username}@whisperly-demo.dev`, env.SEED_PASSWORD);
        const created = await seedThread(contactIds[username], target.id, thread);
        console.log(`  ${created ? "+" : "·"} ${username}${created ? "" : " (already exists)"}`);
    }
}

await signOut(auth);
console.log(`\nDone. Log in as ${DEMO.email} or use "Explore with a demo account" on the login page.`);
await terminate(db);
process.exit(0);
