import { useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { AppContext } from './context/AppContext';
import { applyTheme } from './lib/theme';

const App = () => {

  const navigate = useNavigate();
  const {loadUserData,resetSession} = useContext(AppContext);

  useEffect(() => {
    applyTheme();
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        loadUserData(user.uid);
      }
      else{
        resetSession()
        navigate('/')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ToastContainer position="top-center" autoClose={3500} hideProgressBar newestOnTop closeButton={false} />
      <Routes>
        <Route path='/chat' element={<Chat />} />
        <Route path='/' element={<Login />} />
        <Route path='/profile' element={<ProfileUpdate />} />
      </Routes>
    </>
  )
}

export default App
