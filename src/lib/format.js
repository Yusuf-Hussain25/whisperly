// Date helpers shared by the chat list, conversation view and profile panel.

// Firestore Timestamp, Date or epoch millis -> Date
export const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
};

const ONLINE_WINDOW = 70 * 1000;

export const isOnline = (lastSeen) => !!lastSeen && Date.now() - lastSeen <= ONLINE_WINDOW;

const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "9:05 PM"
export const formatTime = (value) => {
    const date = toDate(value);
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

// Chat list stamp: "9:05 PM" today, "Yesterday", "Mon", or "12 Oct"
export const formatListTime = (value) => {
    const date = toDate(value);
    if (!date) return "";
    const now = new Date();
    if (sameDay(date, now)) return formatTime(date);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(date, yesterday)) return "Yesterday";
    if (now - date < 6 * 24 * 60 * 60 * 1000) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

// Separator between message groups: "Today", "Yesterday", "Monday, 12 October"
export const formatDayLabel = (value) => {
    const date = toDate(value);
    if (!date) return "";
    const now = new Date();
    if (sameDay(date, now)) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(date, yesterday)) return "Yesterday";
    const opts = { weekday: "long", day: "numeric", month: "long" };
    if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
    return date.toLocaleDateString([], opts);
};

export const isSameDay = (a, b) => {
    const da = toDate(a), db = toDate(b);
    return !!da && !!db && sameDay(da, db);
};

// "Active now", "Active 5m ago", "Active 3h ago", "Last seen Yesterday"
export const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Offline";
    if (isOnline(lastSeen)) return "Active now";
    const mins = Math.floor((Date.now() - lastSeen) / 60000);
    if (mins < 60) return `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    return `Last seen ${formatListTime(lastSeen)}`;
};
