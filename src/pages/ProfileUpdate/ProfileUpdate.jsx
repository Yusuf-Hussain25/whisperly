import React, { useContext, useEffect, useMemo, useState } from 'react'
import './ProfileUpdate.css'
import { ArrowLeft, Camera, Check, ImagePlus } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import Avatar from '../../components/ui/Avatar';
import Logo from '../../components/ui/Logo';

const BIO_LIMIT = 140;

const ProfileUpdate = () => {

  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [username, setUsername] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [prevImage, setPrevImage] = useState("");
  const { setUserData } = useContext(AppContext);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : prevImage), [image, prevImage]);
  useEffect(() => () => image && URL.revokeObjectURL(preview), [preview]);

  const isComplete = !!prevImage;

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please choose an image file");
      return;
    }
    setImage(file);
  }

  const profileUpdate = async (event) => {
    event.preventDefault();
    if (!prevImage && !image) {
      toast.error("Add a profile picture to continue")
      return 0;
    }
    setSaving(true);
    try {
      const docRef = doc(db, "users", uid);
      if (image) {
        const imgUrl = await upload(image);
        setPrevImage(imgUrl);
        await updateDoc(docRef, {
          avatar: imgUrl,
          bio: bio,
          name: name
        })
      } else {
        await updateDoc(docRef, {
          bio: bio,
          name: name
        })
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      toast.success("Profile saved")
      navigate('/chat')
    } catch (error) {
      console.error(error);
      toast.error(error.message)
    }
    setSaving(false);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data() || {};
        setUsername(data.username || "");
        if (data.name) {
          setName(data.name);
        }
        if (data.bio) {
          setBio(data.bio);
        }
        if (data.avatar) {
          setPrevImage(data.avatar);
        }
      }
      else {
        navigate("/")
      }
    })
  }, [])

  return (
    <div className='profile'>
      <header className='profile-top'>
        {isComplete
          ? <button className='btn btn-ghost' onClick={() => navigate('/chat')}><ArrowLeft size={17} /> Back to chats</button>
          : <Logo size={30} />}
      </header>

      <div className="profile-container glass">
        <section className='profile-preview'>
          <p className='eyebrow'>Preview</p>
          <div className='preview-card'>
            <div className='preview-cover' />
            <Avatar src={preview} name={name || username} size={104} ring online />
            <h3>{name || 'Your name'}</h3>
            <p className='preview-handle'>@{username || 'username'}</p>
            <p className='preview-bio'>{bio || 'Your bio will appear here.'}</p>
          </div>
          <p className='profile-hint'>This is how people see you in chats and search.</p>
        </section>

        <form onSubmit={profileUpdate} className='profile-form'>
          <div>
            <h2>{isComplete ? 'Edit profile' : 'Set up your profile'}</h2>
            <p className='profile-sub'>{isComplete ? 'Update your photo, name and bio.' : 'Add a photo and a few words so friends recognise you.'}</p>
          </div>

          <label
            htmlFor='avatar'
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <input onChange={(e) => pickFile(e.target.files[0])} id='avatar' type="file" accept="image/png, image/jpeg, image/webp" hidden />
            <span className='dropzone-avatar'>
              <Avatar src={preview} name={name || username} size={64} />
              <span className='dropzone-badge'><Camera size={14} /></span>
            </span>
            <span className='dropzone-text'>
              <strong>{preview ? 'Change photo' : 'Upload a photo'}</strong>
              <span>Drag and drop or click · PNG, JPG or WebP</span>
            </span>
            <ImagePlus size={20} className='dropzone-icon' />
          </label>

          <div className='field'>
            <label htmlFor='name'>Display name</label>
            <input id='name' className='input' onChange={(e) => setName(e.target.value)} value={name} placeholder='e.g. Alex Rivera' type="text" maxLength={40} required />
          </div>

          <div className='field'>
            <div className='field-row'>
              <label htmlFor='bio'>Bio</label>
              <span className={`counter ${bio.length > BIO_LIMIT - 15 ? 'warn' : ''}`}>{bio.length}/{BIO_LIMIT}</span>
            </div>
            <textarea id='bio' className='input' onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))} value={bio} placeholder='A few words about you' rows={4} required />
          </div>

          <button type="submit" className='btn btn-primary btn-block' disabled={saving}>
            {saving ? <><span className='spinner' /> Saving…</> : <><Check size={17} /> Save profile</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileUpdate
