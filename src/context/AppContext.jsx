import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Adds each chat partner's profile to the chat list entries, newest first.
const withPartners = async (chatItems = []) => {
    const items = await Promise.all(chatItems.map(async (item) => {
        const userSnap = await getDoc(doc(db, "users", item.rId));
        return { ...item, userData: userSnap.data() };
    }));
    return items.filter((item) => item.userData).sort((a, b) => b.updatedAt - a.updatedAt);
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
