import { useContext, useMemo, useState } from 'react'
import './RightSidebar.css'
import { X, ImageIcon, MessageCircle, CalendarDays } from 'lucide-react'
import { AppContext } from '../../context/AppContext'
import Avatar from '../ui/Avatar'
import Lightbox from '../ui/Lightbox'
import { formatLastSeen, isOnline, toDate } from '../../lib/format'

const RightSidebar = () => {

  const { chatUser, messages, infoVisible, setInfoVisible } = useContext(AppContext);
  const [lightbox, setLightbox] = useState(null);

  const msgImages = useMemo(() => messages.filter((msg) => msg.image).map((msg) => msg.image).reverse(), [messages]);

  if (!chatUser || !infoVisible) return null;

  const partner = chatUser.userData;
  const since = messages.length ? toDate(messages[0].createdAt) : null;

  return (
    <>
      <div className='rs-backdrop' onClick={() => setInfoVisible(false)} />
      <aside className='rs panel glass'>
        <header className='rs-head'>
          <p>Details</p>
          <button className='icon-btn' onClick={() => setInfoVisible(false)} aria-label="Close details"><X size={18} /></button>
        </header>

        <div className='rs-body'>
          <section className='rs-profile'>
            <Avatar src={partner.avatar} name={partner.name} size={96} ring online={isOnline(partner.lastSeen)} />
            <h3>{partner.name}</h3>
            <p className='rs-handle'>@{partner.username}</p>
            <span className={`status-pill ${isOnline(partner.lastSeen) ? 'online' : ''}`}>{formatLastSeen(partner.lastSeen)}</span>
          </section>

          {partner.bio &&
            <section className='rs-card'>
              <h4>About</h4>
              <p>{partner.bio}</p>
            </section>}

          <section className='rs-stats'>
            <div>
              <MessageCircle size={16} />
              <strong>{messages.length}</strong>
              <span>messages</span>
            </div>
            <div>
              <ImageIcon size={16} />
              <strong>{msgImages.length}</strong>
              <span>photos</span>
            </div>
            <div>
              <CalendarDays size={16} />
              <strong>{since ? since.toLocaleDateString([], { day: 'numeric', month: 'short' }) : '–'}</strong>
              <span>since</span>
            </div>
          </section>

          <section className='rs-card'>
            <div className='rs-card-head'>
              <h4>Shared media</h4>
              {msgImages.length > 0 && <span>{msgImages.length}</span>}
            </div>
            {msgImages.length
              ? <div className='rs-media'>
                {msgImages.map((url, index) => (
                  <button key={index} onClick={() => setLightbox(url)} aria-label="View photo">
                    <img src={url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              : <p className='rs-muted'>Photos you share in this chat will appear here.</p>}
          </section>
        </div>
      </aside>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  )
}

export default RightSidebar
