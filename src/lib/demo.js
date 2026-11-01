import { auth } from "../config/firebase";

// The demo login is shared by every visitor. firestore.rules stops it from editing its
// profile or starting new chats; these checks explain that before the request is denied.
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL || "").toLowerCase();

export const isDemoAccount = () =>
  Boolean(DEMO_EMAIL) && auth.currentUser?.email?.toLowerCase() === DEMO_EMAIL;

export const DEMO_PROFILE_LOCKED =
  "The demo profile is shared by every visitor, so it can't be edited. Create your own account to set up a profile.";

export const DEMO_NEW_CHAT_LOCKED =
  "The demo account can message its existing contacts. Create your own account to start new chats.";
