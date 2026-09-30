import './App.css'
import AllContactsAndNotifications from './routes/AllNotification';
import AllUsers from './routes/AllUsers';
import ChatsRoute from './routes/ChatsRoute';
import { Home } from './routes/home'
import { useEffect, useRef, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { userRef as userSchema, chatsRef as chatSchema, webRTCContainerRef as webRTCContainerRefSchema, textToSpeechContainerRef as textToSpeechSchema, recogniserStreamObject as speechToTextSchema } from '../src/controllers/userModel.js';
import { countries } from './controllers/allCountries.js';

function App() {


  const socketContainer = useRef({})

  const [user, setUser] = useState(null)

  const userRef = useRef(userSchema)
  const chatRef = useRef(chatSchema)

  const recogniserStreamObjectRef = useRef(speechToTextSchema)
  const textToSpeechContainerRef = useRef(textToSpeechSchema)


  const CountryMap = new Map(
    countries.map((country) => ([country.countryName, country]))
  )

  const chatsDivRef = useRef(null)
  const [refreshUsersFlag, setRefreshUsersFlag] = useState(0)
  const [refreshGlobalUsersFlag, setRefreshGlobalUsersFlag] = useState(0)
  const [refreshChatsFlag, setRefreshChatsFlag] = useState(0)
  const [chatsOverlay, setChatsOverlay] = useState("")
  const [recentUnreadContactCount, setRecentUnreadContactCount] = useState(0)
  const [localuser, setLocaluser] = useState(false)

  const updateViewportVars = () => {
    const vh = window.visualViewport?.height || window.innerHeight;
    const vw = window.visualViewport?.width || window.innerWidth;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
    document.documentElement.style.setProperty('--app-width', `${vw}px`);
  }

  window.addEventListener("resize", updateViewportVars)
  window.addEventListener('visualViewport', updateViewportVars);

  useEffect(() => {
    updateViewportVars()
  }, [])

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL);
  }, [])


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home
          socketContainer={socketContainer}
      
          recogniserStreamObjectRef={recogniserStreamObjectRef}
          textToSpeechContainerRef={textToSpeechContainerRef}
       
          user={user}
          setUser={setUser}
          userRef={userRef}
          setRecentUnreadContactCount={setRecentUnreadContactCount}
          recentUnreadContactCount={recentUnreadContactCount}
          chatRef={chatRef}
          chatsDivRef={chatsDivRef}
          setRefreshUsersFlag={setRefreshUsersFlag}
          setRefreshGlobalUsersFlag={setRefreshGlobalUsersFlag}
          setRefreshChatsFlag={setRefreshChatsFlag}
          setChatsOverlay={setChatsOverlay}
          localuser={localuser}
          setLocaluser={setLocaluser}
 
        />}>
          <Route index element={<AllUsers
            userRef={userRef}
            setRecentUnreadContactCount={setRecentUnreadContactCount}
            socketContainer={socketContainer}
            refreshGlobalUsersFlag={refreshGlobalUsersFlag}
            CountryMap={CountryMap}
          />} />
          <Route path="users" element={
            <AllUsers
              userRef={userRef}
              setRecentUnreadContactCount={setRecentUnreadContactCount}
              socketContainer={socketContainer}
              refreshGlobalUsersFlag={refreshGlobalUsersFlag}
              CountryMap={CountryMap}
            />
          } />
          <Route path="chats" element={
            <ChatsRoute
              chatRef={chatRef}
              chatsDivRef={chatsDivRef}
              socketContainer={socketContainer}
              userRef={userRef}
              refreshChatsFlag={refreshChatsFlag}
              chatsOverlay={chatsOverlay}
              textToSpeechContainerRef={textToSpeechContainerRef}
            />
          } />
          <Route path="mycontacts-and-notifications" element={
            <AllContactsAndNotifications
              userRef={userRef}
              setRecentUnreadContactCount={setRecentUnreadContactCount}
              socketContainer={socketContainer}
              refreshUsersFlag={refreshUsersFlag}
              CountryMap={CountryMap}
            />
          } />
        </Route>
        <Route path="*" element={<p>Not found the page</p>} />
      </Routes>
    </Router>
  )
}

export default App