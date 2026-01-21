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
  console.log("app route is called")

  const socketContainer = useRef({})


  const rtcbuttonRef = useRef(null)

  const rtcStarterFunction = useRef(null)

  const [user, setUser] = useState(null)


  const userRef = useRef(userSchema)

  const chatRef = useRef(chatSchema)

  const webRTCContainerRef = useRef(webRTCContainerRefSchema)

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


  // for local
  const [localuser, setLocaluser] = useState(false)

  const peerRef = useRef(null);

  const callerChannelRef = useRef(null);

  const receiverChannelRef = useRef(null);























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




  webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  try {
    if (!socketContainer.current || socketContainer.current.readyState !== 1) {
      alert("WebSocket not ready");
      return;
    }

    if (webRTCContainerRef.current.senderPC) {
      if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
        alert("A connection already exists, close it first.");
        return;
      }
      try {
        webRTCContainerRef.current.senderPC.getSenders().forEach(s => s.track && s.track.stop());
        webRTCContainerRef.current.senderPC.close();
      } catch {}
      webRTCContainerRef.current.senderPC = null;
    }

    webRTCContainerRef.current.senderPC = new RTCPeerConnection();
    webRTCContainerRef.current.senderDC = null;

    if (motive === "mediastream") {
      webRTCContainerRef.current.senderStreamsObject =
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const stream = webRTCContainerRef.current.senderStreamsObject;
      stream.getTracks().forEach(t =>
        webRTCContainerRef.current.senderPC.addTrack(t, stream)
      );
    }

    // ✅ FIXED RECEIVER TRACK HANDLER
    webRTCContainerRef.current.senderPC.ontrack = (event) => {
      try {
        const track = event.track;

        // ✅ VIDEO HANDLING (FIX)
        if (track.kind === "video") {
          if (webRTCContainerRef.current.streamElementAtSender) return;

          const video = document.createElement("video");
          video.srcObject = event.streams[0];
          video.autoplay = true;
          video.playsInline = true;
          video.muted = false;
          video.controls = true;
          video.style.zIndex = "20";
          video.style.borderRadius = "calc(5*var(--med-border-radius))";

          video.play().catch(() => {});

          const container = document.createElement("section");
          container.style.width = "clamp(100px,80%,400px)";
          container.appendChild(video);

          const parent = document.getElementById("chats-div");
          if (parent) parent.appendChild(container);

          webRTCContainerRef.current.streamElementAtSender = container;
          return;
        }

        // ✅ AUDIO HANDLING (DO NOT TOUCH VIDEO)
        if (track.kind === "audio") {
          const audio = document.createElement("audio");
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          audio.play().catch(() => {});
          return;
        }

      } catch (err) {
        console.error(err);
      }
    };

    webRTCContainerRef.current.senderPC.onicecandidate = (e) => {
      if (e.candidate) {
        socketContainer.current.send(JSON.stringify({
          type: "query-message",
          queryType: "ice",
          sender: userRef.current,
          receiver: userRef.current.focusedContact,
          d: e.candidate
        }));
      }
    };

    const offer = await webRTCContainerRef.current.senderPC.createOffer();
    await webRTCContainerRef.current.senderPC.setLocalDescription(offer);

    socketContainer.current.send(JSON.stringify({
      type: "query-message",
      queryType: "offer",
      sender: userRef.current,
      receiver: userRef.current.focusedContact,
      d: offer
    }));

  } catch (err) {
    alert("WebRTC setup failed");
    console.error(err);
  }
};




  return (

    <Router>
      <Routes>

        <Route path="/" element={<Home

          socketContainer={socketContainer}

          webRTCContainerRef={webRTCContainerRef}

          recogniserStreamObjectRef={recogniserStreamObjectRef}

          textToSpeechContainerRef={textToSpeechContainerRef}

          rtcbuttonRef={rtcbuttonRef}

          rtcStarterFunction={rtcStarterFunction}

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

          peerRef={peerRef}

          callerChannelRef={callerChannelRef}

          receiverChannelRef={receiverChannelRef}






        />}>
          <Route index element={<AllUsers

            userRef={userRef}

            setRecentUnreadContactCount={setRecentUnreadContactCount}

            socketContainer={socketContainer}

            refreshGlobalUsersFlag={refreshGlobalUsersFlag}

            CountryMap={CountryMap}



          />} />
          <Route

            path="users"

            element={

              <AllUsers

                userRef={userRef}

                setRecentUnreadContactCount={setRecentUnreadContactCount}

                socketContainer={socketContainer}

                refreshGlobalUsersFlag={refreshGlobalUsersFlag}

                CountryMap={CountryMap}
              />

            }
          />
          <Route

            path="chats"

            element={

              <ChatsRoute

                chatRef={chatRef}

                chatsDivRef={chatsDivRef}

                socketContainer={socketContainer}

                userRef={userRef}

                refreshChatsFlag={refreshChatsFlag}

                chatsOverlay={chatsOverlay}

                textToSpeechContainerRef={textToSpeechContainerRef}

              />

            }
          />
          <Route

            path="mycontacts-and-notifications"

            element={

              <AllContactsAndNotifications

                userRef={userRef}

                setRecentUnreadContactCount={setRecentUnreadContactCount}

                socketContainer={socketContainer}

                refreshUsersFlag={refreshUsersFlag}

                CountryMap={CountryMap}


              />

            }
          />


        </Route>

      </Routes>
    </Router>

  )
}

export default App
