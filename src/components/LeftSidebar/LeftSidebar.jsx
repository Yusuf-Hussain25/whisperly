import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './LeftSidebar.css'
import { Search, X, MoreHorizontal, UserRound, LogOut, Sun, Moon, MessageSquarePlus, ImageIcon, Check } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { db, logout } from '../../config/firebase';
import { arrayUnion, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import { formatListTime, isOnline } from '../../lib/format';
import { resolveTheme, toggleTheme } from '../../lib/theme';

const LeftSidebar = () => {

    const { chatData, userData, chatUser, setChatUser, setMessagesId, messagesId, setChatVisible } = useContext(AppContext);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [filter, setFilter] = useState("all");
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState(resolveTheme());
    const searchRef = useRef();
    const menuRef = useRef();
    const navigate = useNavigate();

    const isUnread = (item) => !item.messageSeen && item.messageId !== messagesId;
    const unreadCount = chatData.filter(isUnread).length;
    const visibleChats = filter === "unread" ? chatData.filter(isUnread) : chatData;

    // Prefix search on username, debounced
    useEffect(() => {
        const term = search.trim().toLowerCase().replace(/^@/, '');
        if (!term) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const q = query(collection(db, "users"), where("username", ">=", term), where("username", "<=", term + ""), limit(8));
                const snap = await getDocs(q);
                setResults(snap.docs.map((d) => d.data()).filter((u) => u.id !== userData.id));
            } catch (error) {
                toast.error(error.message)
            }
            setSearching(false);
        }, 250);
        return () => clearTimeout(timer);
    }, [search, userData.id]);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [menuOpen]);

    const existingChat = useMemo(() => {
        const byUser = {};
        chatData.forEach((item) => { byUser[item.rId] = item; });
        return byUser;
    }, [chatData]);

    const addChat = async (user) => {
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
        try {
            if (user.id === userData.id) {
                return 0
            }
            if (existingChat[user.id]) {
                setSearch("");
                return setChat(existingChat[user.id]);
            }
            const newMessageRef = doc(messagesRef);

            await setDoc(newMessageRef, {
                createAt: serverTimestamp(),
                participants: [userData.id, user.id],
                messages: []
            })

            await updateDoc(doc(chatsRef, user.id), {
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",
                    rId: userData.id,
                    updatedAt: Date.now(),
                    messageSeen: true
                }),
            });

            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",
                    rId: user.id,
                    updatedAt: Date.now(),
                    messageSeen: true
                }),
            });

            const uSnap = await getDoc(doc(db, "users", user.id));
            const uData = uSnap.data();
            setChat({
                messageId: newMessageRef.id,
                lastMessage: "",
                rId: user.id,
                updatedAt: Date.now(),
                messageSeen: true,
                userData: uData,
            });
            setSearch("")
        } catch (error) {
            toast.error(error.message)
        }
    }

    const setChat = async (item) => {
        setMessagesId(item.messageId)
        setChatUser(item)
        setChatVisible(true)
        if (item.messageSeen) return;
        try {
            const userChatsRef = doc(db, "chats", userData.id);
            const userChatsSnapshot = await getDoc(userChatsRef);
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
            userChatsData.chatsData[chatIndex].messageSeen = true;
            await updateDoc(userChatsRef, {
                chatsData: userChatsData.chatsData,
            });
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        const updateChatUserData = async () => {
            if (chatUser) {
                const userRef = doc(db, "users", chatUser.userData.id);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                setChatUser(prev => ({ ...prev, userData: userData }))
            }
        }
        updateChatUserData();
    }, [chatData])

    const onToggleTheme = () => setTheme(toggleTheme());

    return (
        <aside className='ls panel glass'>
            <header className='ls-top'>
                <div className='ls-nav'>
                    <Logo size={30} />
                    <div className='ls-actions'>
                        <button className='icon-btn' onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button className='icon-btn' onClick={() => searchRef.current?.focus()} aria-label="New conversation" title="New conversation">
                            <MessageSquarePlus size={18} />
                        </button>
                    </div>
                </div>

                <div className='ls-title'>
                    <h2>Messages</h2>
                    {unreadCount > 0 && <span className='count-badge'>{unreadCount} new</span>}
                </div>

                <div className='input-wrap ls-search'>
                    <Search size={17} />
                    <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} className='input' type="text" placeholder='Search people by username' aria-label="Search people" />
                    {search && <button className='icon-btn input-action' onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
                </div>

                {!search &&
                    <div className='chips'>
                        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                        <button className={`chip ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
                            Unread {unreadCount > 0 && <span>{unreadCount}</span>}
                        </button>
                    </div>}
            </header>

            <div className="ls-list">
                {search
                    ? <>
                        <p className='ls-section'>{searching ? 'Searching…' : results.length ? 'People' : 'No one found'}</p>
                        {results.map((user) => (
                            <button key={user.id} onClick={() => addChat(user)} className='chat-item'>
                                <Avatar src={user.avatar} name={user.name || user.username} size={46} online={isOnline(user.lastSeen)} />
                                <div className='chat-item-body'>
                                    <div className='chat-item-row'>
                                        <p className='chat-item-name'>{user.name || user.username}</p>
                                    </div>
                                    <p className='chat-item-preview'>@{user.username}</p>
                                </div>
                                <span className='pill'>{existingChat[user.id] ? 'Open' : 'Message'}</span>
                            </button>
                        ))}
                        {!searching && !results.length &&
                            <div className='ls-empty'>
                                <Search size={22} />
                                <p>Try a different username</p>
                            </div>}
                    </>
                    : visibleChats.length
                        ? visibleChats.map((item) => {
                            const unread = isUnread(item);
                            return (
                                <button onClick={() => setChat(item)} key={item.messageId} className={`chat-item ${item.messageId === messagesId ? 'active' : ''} ${unread ? 'unread' : ''}`}>
                                    <Avatar src={item.userData.avatar} name={item.userData.name} size={48} online={isOnline(item.userData.lastSeen)} />
                                    <div className='chat-item-body'>
                                        <div className='chat-item-row'>
                                            <p className='chat-item-name'>{item.userData.name}</p>
                                            <span className='chat-item-time'>{formatListTime(item.updatedAt)}</span>
                                        </div>
                                        <div className='chat-item-row'>
                                            <p className='chat-item-preview'>
                                                {item.lastMessage === "Image"
                                                    ? <><ImageIcon size={14} /> Photo</>
                                                    : item.lastMessage || <em>Say hello 👋</em>}
                                            </p>
                                            {unread && <span className='unread-dot' aria-label="Unread" />}
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                        : <div className='ls-empty'>
                            {filter === 'unread' ? <Check size={22} /> : <MessageSquarePlus size={22} />}
                            <p>{filter === 'unread' ? "You're all caught up" : 'No conversations yet'}</p>
                            {filter !== 'unread' && <span>Search for someone by username to start chatting.</span>}
                        </div>}
            </div>

            <footer className='ls-me' ref={menuRef}>
                <Avatar src={userData.avatar} name={userData.name} size={38} online />
                <div className='ls-me-text'>
                    <p>{userData.name}</p>
                    <span>@{userData.username}</span>
                </div>
                <button className={`icon-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Account menu" aria-expanded={menuOpen}>
                    <MoreHorizontal size={18} />
                </button>
                {menuOpen &&
                    <div className='menu glass' role="menu">
                        <button role="menuitem" onClick={() => navigate('/profile')}><UserRound size={16} /> Edit profile</button>
                        <button role="menuitem" onClick={onToggleTheme}>
                            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Dark' : 'Light'} mode
                        </button>
                        <hr />
                        <button role="menuitem" className='danger' onClick={() => logout()}><LogOut size={16} /> Log out</button>
                    </div>}
            </footer>
        </aside>
    )
}

export default LeftSidebar
