import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'

// Full-screen image viewer. Closes on Escape or backdrop click.
const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div className='lightbox' onClick={onClose} role="dialog" aria-modal="true" aria-label="Image preview">
      <div className='lightbox-actions' onClick={(e) => e.stopPropagation()}>
        <a className='icon-btn' href={src} target="_blank" rel="noreferrer" aria-label="Open original"><ExternalLink size={18} /></a>
        <button className='icon-btn' onClick={onClose} aria-label="Close"><X size={20} /></button>
      </div>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
};

export default Lightbox
