
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, deleteUser, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut} from 'firebase/auth'
import { doc, getDoc, getFirestore, writeBatch } from 'firebase/firestore'
import { toast } from "react-toastify";

// --------- Firebase config is read from the .env file ---------

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const signup = async (username, email, password) => {
    try {
        // usernames/{username} -> { uid } keeps usernames unique without exposing the users collection
        username = username.toLowerCase()
        const usernameRef = doc(db,'usernames',username)
        const usernameSnap = await getDoc(usernameRef)
        if(usernameSnap.exists()){
            toast.error("Username already taken")
            return 0;
        }
        const res = await createUserWithEmailAndPassword(auth, email, password)
        const user = res.user
        const batch = writeBatch(db)
        batch.set(doc(db,"users",user.uid), {
            id: user.uid,
            username,
            email,
            name:"",
            avatar:"",
            bio:"Hey there, I am using Whisperly",
            lastSeen: Date.now()
        });
        batch.set(doc(db,"chats",user.uid), {
            chatsData:[]
        });
        batch.set(usernameRef, {
            uid: user.uid
        });
        try {
            await batch.commit()
        } catch (error) {
            // Username was claimed between the check and now: undo the auth account
            await deleteUser(user)
            throw error
        }

    } catch (error) {
        console.error(error)
        toast.error((error.code || error.message).split('/').pop().split('-').join(" "))
    }
}

const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
        console.error(error)
        toast.error((error.code || error.message).split('/').pop().split('-').join(" "))
    }
}

const logout = () => {
    signOut(auth)
}

const resetPass = async (email) => {
    if (!email) {
        toast.error("Enter your email")
        return null
    }
    try {
        // Firebase does not reveal whether the email is registered (email enumeration protection)
        await sendPasswordResetEmail(auth,email)
        toast.success("If an account exists for this email, a reset link has been sent")
    } catch (error) {
        console.error(error)
        toast.error(error.message)
    }
   
}

export { auth, db, login, signup, logout, resetPass};