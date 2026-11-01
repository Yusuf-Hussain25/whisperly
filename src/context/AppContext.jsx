import { collection, doc, documentId, getDoc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { createContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Firestore "in" queries take at most 30 values
const IN_LIMIT = 30;

// Adds each chat partner's profile to the chat list entries, newest first. Profiles come
// from one query per 30 partners instead of one read per chat.
const withPartners = async (chatItems = []) => {
    const ids = [...new Set(chatItems.map((item) => item.rId))];
    const chunks = [];
    for (let i = 0; i < ids.length; i += IN_LIMIT) chunks.push(ids.slice(i, i + IN_LIMIT));
    const snaps = await Promise.all(chunks.map((chunk) =>
        getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)))
    ));
    const profiles = {};
    snaps.forEach((snap) => snap.forEach((d) => { profiles[d.id] = d.data(); }));
    return chatItems
        .map((item) => ({ ...item, userData: profiles[item.rId] }))
        .filter((item) => item.userData)
        .sort((a, b) => b.updatedAt - a.updatedAt);
};

const AppContextProvider = (props) => {

    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([])
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);
    // Details panel starts open only where there is room for three columns
    const [infoVisible, setInfoVisible] = useState(() => window.innerWidth > 1200);
    const presenceTimer = useRef(null);
    const navigate = useNavigate();

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            // Load the chat list alongside the profile instead of after it, so the chat screen
            // has its data one round trip sooner. The realtime listener takes over once it reports.
            getDoc(doc(db, 'chats', uid))
                .then((snap) => withPartners(snap.data()?.chatsData))
                .then((chats) => {
                    if (auth.currentUser?.uid === uid) setChatData((current) => current ?? chats);
                })
                .catch(() => {});
            // Right after sign up the profile is written just after the auth account exists
            let userSnap = await getDoc(userRef);
            for (let i = 0; i < 10 && !userSnap.exists(); i++) {
                await sleep(300);
                userSnap = await getDoc(userRef);
            }
            const userData = userSnap.data();
            if (!userData) {
                throw new Error("Could not load your profile. Please try again.");
            }
            setUserData(userData);
            if (userData.avatar && userData.name) {
                navigate('/chat');
            }
            else {
                navigate('/profile')
            }
            await updateDoc(userRef, {
                lastSeen: Date.now()
            })
            clearInterval(presenceTimer.current);
            presenceTimer.current = setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    })
                }
            }, 60000);
        } catch (error) {
            toast.error(error.message)
        }
    }

    const resetSession = () => {
        clearInterval(presenceTimer.current);
        setUserData(null);
        setChatData(null);
        setChatUser(null);
        setMessagesId(null);
        setMessages([]);
        setChatVisible(false);
    }

    useEffect(() => () => clearInterval(presenceTimer.current), []);

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id)
            const unSub = onSnapshot(chatRef, async (res) => {
                setChatData(await withPartners(res.data()?.chatsData));
            })

            // Refresh partner profiles so presence ("Active now") stays current
            const timer = setInterval(async () => {
                const data = await getDoc(chatRef)
                setChatData(await withPartners(data.data()?.chatsData));
            }, 30000);

            return () => {
                unSub();
                clearInterval(timer);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.id])

    const value = {
        userData, setUserData,
        loadUserData,
        resetSession,
        chatData,
        messagesId,
        setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible,
        infoVisible, setInfoVisible,
        messages, setMessages
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider;
