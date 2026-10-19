import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import './ChatBox.css'
import { ArrowLeft, ImagePlus, PanelRight, SendHorizontal, Lock } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import Avatar from '../ui/Avatar';
import Lightbox from '../ui/Lightbox';
import { LogoMark } from '../ui/Logo';
import { formatDayLabel, formatLastSeen, formatTime, isOnline, isSameDay, toDate } from '../../lib/format';

const GROUP_WINDOW = 5 * 60 * 1000;

const ChatBox = () => {

  const { userData, messagesId, chatUser, messages, setMessages, chatData, setChatVisible, infoVisible, setInfoVisible } = useContext(AppContext);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const scrollRef = useRef();
  const inputRef = useRef();
  const fileRef = useRef();
  const stickToBottom = useRef(true);
  const firstLoad = useRef(true);

  // Updates both people's chat list entry with the latest message
  const touchChats = async (lastMessage) => {
    const userIDs = [chatUser.rId, userData.id];
    await Promise.all(userIDs.map(async (id) => {
      const userChatsRef = doc(db, "chats", id);
      const userChatsSnapshot = await getDoc(userChatsRef);

      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();
        const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === messagesId);
        if (chatIndex < 0) return;
        userChatsData.chatsData[chatIndex].lastMessage = lastMessage.slice(0, 80);
        userChatsData.chatsData[chatIndex].updatedAt = Date.now();
        if (userChatsData.chatsData[chatIndex].rId == userData.id) {
          userChatsData.chatsData[chatIndex].messageSeen = false;
        }
        await updateDoc(userChatsRef, {
          chatsData: userChatsData.chatsData,
        });
      }
    }));
  }

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || !messagesId) return;
    setInput("");
    try {
      await updateDoc(doc(db, "messages", messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          text: message,
          createdAt: new Date()
        })
      })
      await touchChats(message);
    } catch (error) {
      toast.error(error.message)
      setInput(message);
    }
    inputRef.current?.focus();
  }

  const sendImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !messagesId) return;

    setUploading(true);
    try {
      const fileUrl = await upload(file)
      await updateDoc(doc(db, "messages", messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          image: fileUrl,
          createdAt: new Date()
        })
      })
      await touchChats("Image");
    } catch (error) {
      toast.error(error.message)
    }
    setUploading(false);
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-grow the composer up to 6 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }, [input]);

  const scrollToBottom = (behavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // Follow new messages only while the reader is already near the bottom
  const onScroll = () => {
    const el = scrollRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  useEffect(() => {
    if (!stickToBottom.current) return;
    scrollToBottom(firstLoad.current ? "auto" : "smooth");
    if (messages.length) firstLoad.current = false;
  }, [messages, uploading])

  useEffect(() => {
    if (messagesId) {
      firstLoad.current = true;
      stickToBottom.current = true;
      if (window.innerWidth <= 1200) setInfoVisible(false);
      setMessages([]);
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data()?.messages || []);
      });
      inputRef.current?.focus();
      return () => {
        unSub();
      };
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesId]);

  if (!chatUser) {
    const people = chatData?.length || 0;
    return (
      <main className='chat-welcome panel glass'>
        <div className='welcome-art' aria-hidden="true">
          <span className='orbit orbit-1' />
          <span className='orbit orbit-2' />
          <LogoMark size={72} />
        </div>
        <h2>Welcome back, {userData.name.split(' ')[0]} 👋</h2>
        <p>Pick a conversation from the list, or search for someone by username to start a new one.</p>
        <div className='welcome-stats'>
          <div><strong>{people}</strong><span>{people === 1 ? 'conversation' : 'conversations'}</span></div>
          <div><strong>{chatData?.filter((c) => !c.messageSeen).length || 0}</strong><span>unread</span></div>
        </div>
        <p className='welcome-note'><Lock size={13} /> Conversations are visible only to the people in them</p>
      </main>
    );
  }

  const partner = chatUser.userData;

  return (
    <main className='chat-box panel glass'>
      <header className="chat-header">
        <button className='icon-btn back-btn' onClick={() => setChatVisible(false)} aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <button className='chat-header-user' onClick={() => setInfoVisible(!infoVisible)}>
          <Avatar src={partner.avatar} name={partner.name} size={42} online={isOnline(partner.lastSeen)} />
          <div>
            <p className='chat-header-name'>{partner.name}</p>
            <p className={`chat-header-status ${isOnline(partner.lastSeen) ? 'online' : ''}`}>{formatLastSeen(partner.lastSeen)}</p>
          </div>
        </button>
        <button className={`icon-btn ${infoVisible ? 'active' : ''}`} onClick={() => setInfoVisible(!infoVisible)} aria-label="Toggle details" title="Details">
          <PanelRight size={19} />
        </button>
      </header>

      <div className="chat-msg" ref={scrollRef} onScroll={onScroll}>
        {messages.length === 0
          ? <div className='chat-empty'>
            <Avatar src={partner.avatar} name={partner.name} size={84} ring />
            <h3>{partner.name}</h3>
            <p>@{partner.username} · {partner.bio}</p>
            <button className='btn btn-ghost' onClick={() => sendMessage("Hey 👋")}>Say hey 👋</button>
          </div>
          : messages.map((msg, index) => {
            const mine = msg.sId === userData.id;
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const time = toDate(msg.createdAt)?.getTime();
            const newDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
            const groupStart = newDay || prev.sId !== msg.sId || time - toDate(prev.createdAt).getTime() > GROUP_WINDOW;
            const groupEnd = !next || next.sId !== msg.sId || !isSameDay(next.createdAt, msg.createdAt) || toDate(next.createdAt).getTime() - time > GROUP_WINDOW;

            return (
              <Fragment key={index}>
                {newDay && <div className='day-sep'><span>{formatDayLabel(msg.createdAt)}</span></div>}
                <div className={`msg-row ${mine ? 'out' : 'in'} ${groupStart ? 'start' : ''} ${groupEnd ? 'end' : ''}`}>
                  {!mine && (groupEnd
                    ? <Avatar src={partner.avatar} name={partner.name} size={28} />
                    : <span className='msg-avatar-gap' />)}
                  <div className='msg-stack'>
                    {msg.image
                      ? <button className='msg-img' onClick={() => setLightbox(msg.image)}>
                        <img src={msg.image} alt="Shared photo" onLoad={() => stickToBottom.current && scrollToBottom()} />
                      </button>
                      : <p className="msg">{msg.text}</p>}
                    {groupEnd && <span className='msg-time'>{formatTime(msg.createdAt)}</span>}
                  </div>
                </div>
              </Fragment>
            )
          })}
        {uploading &&
          <div className='msg-row out end'>
            <div className='msg-stack'>
              <div className='msg-uploading'><span className='spinner' /> Sending photo…</div>
            </div>
          </div>}
      </div>

      <footer className="composer">
        <input ref={fileRef} onChange={sendImage} type="file" accept="image/png, image/jpeg, image/webp, image/gif" hidden />
        <button className='icon-btn' onClick={() => fileRef.current.click()} disabled={uploading} aria-label="Send a photo" title="Send a photo">
          <ImagePlus size={20} />
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          onKeyDown={onKeyDown}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder={`Message ${partner.name.split(' ')[0]}…`}
          aria-label="Message"
        />
        <button className='send-btn' onClick={() => sendMessage()} disabled={!input.trim()} aria-label="Send">
          <SendHorizontal size={19} />
        </button>
      </footer>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </main>
  )
}

export default ChatBox
