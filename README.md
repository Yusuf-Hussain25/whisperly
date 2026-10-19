# Whisperly

A real-time one-to-one messaging app built with **React**, **Vite** and **Firebase**. Sign up, set up a profile, find people by username and chat instantly, with text and image messages, online status and unread indicators.

## Features

- **Authentication**: sign up, log in, log out and password reset by email (Firebase Auth)
- **Unique usernames**: you can't sign up with a username that's already taken
- **Profile setup**: name, bio and profile picture
- **User search**: find other users by username and start a conversation
- **Real-time messaging**: messages show up immediately through Firestore `onSnapshot` listeners
- **Image messages**: send photos through a configurable upload provider (Cloudinary, Firebase Storage or inline)
- **Online status**: a green dot appears from each user's last-seen time
- **Unread indicators**: conversations with new messages are highlighted
- **Shared media panel**: the right sidebar shows every image shared in a chat
- **Toast notifications** for errors and confirmations
- **Secure by default**: production Firestore rules keep conversations private to their two participants

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 18, React Router 6                     |
| Build tool | Vite 5                                       |
| Backend    | Firebase Authentication, Cloud Firestore |
| Media      | Cloudinary, Firebase Storage or inline (configurable) |
| UI         | Plain CSS, React Toastify                    |
| Deployment | Vercel (SPA rewrites in `vercel.json`)       |

## Project Structure

```
firestore.rules         # Production Firestore security rules
firebase.json           # Firebase CLI config (points at firestore.rules)
src/
├── components/
│   ├── ChatBox/        # Active conversation: messages, input, image upload
│   ├── LeftSidebar/    # Chat list, user search, menu
│   └── RightSidebar/   # Chat partner's profile and shared media
├── config/firebase.js  # Firebase init and auth helpers (signup, login, logout, reset)
├── context/AppContext.jsx  # Global state: current user, chats, selected chat
├── lib/upload.js       # Image upload (Cloudinary, Firebase Storage or inline)
└── pages/
    ├── Login/          # Sign up / log in / forgot password
    ├── Chat/           # Main chat layout
    └── ProfileUpdate/  # Edit profile
```

### Firestore collections

- `users`: profile data (`username`, `name`, `bio`, `avatar`, `lastSeen`)
- `usernames`: username → `uid` lookup so sign up can check that a username is free
- `chats`: each user's chat list (`chatsData`, with last message and seen state)
- `messages`: the message history for each conversation, plus its two `participants`

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Firebase project with these turned on:
  - **Authentication** with the **Email/Password** provider
  - **Cloud Firestore** (production mode is fine; see [step 3](#3-publish-the-firestore-security-rules))
- An image upload provider (see [Image uploads](#image-uploads)). A free Cloudinary account is the default.

### 1. Clone and install

```bash
git clone https://github.com/Yusuf-Hussain25/whisperly.git
cd whisperly
npm install
```

### 2. Configure environment variables

Copy the example file and add your Firebase web app config. You'll find it in the Firebase Console under **Project settings → Your apps → `</>` Web app → Config**.

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_UPLOAD_PROVIDER=cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Image uploads

Profile pictures and image messages go through a pluggable uploader (`src/lib/upload.js`). Choose a provider with `VITE_UPLOAD_PROVIDER`:

| Provider     | What you need | Notes |
|--------------|---------------|-------|
| `cloudinary` (default) | Free [Cloudinary](https://cloudinary.com) account: your **cloud name** plus an **unsigned upload preset** (Settings → Upload → Upload presets) | No credit card, 25 GB free |
| `firebase`   | Firebase Storage turned on | New projects need the Blaze (pay-as-you-go) plan |
| `inline`     | Nothing extra | Images are resized to 512px and saved in Firestore as data URLs. Good for quick demos, but a conversation's messages share one 1 MB document |

### 3. Publish the Firestore security rules

A Firestore database created in **production mode** denies every read and write until you publish rules, and the app shows permission errors until then. The rules in [`firestore.rules`](firestore.rules) allow exactly what the app needs:

- Signed-out visitors can only check whether a username is taken
- Any signed-in user can read profiles (for search and the chat list), but only the owner can edit theirs. Username and email can't be changed
- Only the **two participants** in a conversation can read or add messages
- Everything else, including deletes, is denied

Publish them in one of two ways:

- **Firebase Console:** Firestore Database → **Rules** tab → replace the contents with `firestore.rules` → **Publish**
- **Firebase CLI:**
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase deploy --only firestore:rules --project <your-project-id>
  ```

> If you created the database in **test mode**, publish these rules before the 30-day test window ends. Otherwise Firebase starts denying all access and the app stops working.

### 4. Run

```bash
npm run dev       # start the dev server at http://localhost:5173
npm run build     # make a production build in dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Deployment

The project is set up for **Vercel**. Import the repository, add the variables from `.env.example` under **Project Settings → Environment Variables** and deploy. `vercel.json` rewrites every route to `index.html`, so client-side routing works.

## Author

**Yusuf Hussain**, AI Full-Stack Engineer · [GitHub](https://github.com/Yusuf-Hussain25)
