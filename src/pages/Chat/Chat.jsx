import React, { useContext } from 'react'
import './Chat.css'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar'
import ChatBox from '../../components/ChatBox/ChatBox'
import RightSidebar from '../../components/RightSidebar/RightSidebar'
import { AppContext } from '../../context/AppContext'

const ListSkeleton = () => (
  <div className='shell-skeleton'>
    <div className='skeleton' style={{ height: 32, width: 140 }} />
    <div className='skeleton' style={{ height: 44 }} />
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className='skeleton-row'>
        <div className='skeleton' style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <div className='skeleton' style={{ height: 12, width: '55%' }} />
          <div className='skeleton' style={{ height: 10, width: '80%' }} />
        </div>
      </div>
    ))}
  </div>
);

const Chat = () => {

  const { chatData, userData, chatUser, chatVisible, infoVisible } = useContext(AppContext);
  const loading = !(chatData && userData);

  return (
    <div className={`app-shell ${chatVisible ? 'chat-open' : ''} ${chatUser && infoVisible ? 'info-open' : ''}`}>
      {loading
        ? <>
          <aside className='panel glass'><ListSkeleton /></aside>
          <main className='panel glass shell-loading'><span className='spinner' /></main>
        </>
        : <>
          <LeftSidebar />
          <ChatBox />
          <RightSidebar />
        </>
      }
    </div>
  )
}

export default Chat
