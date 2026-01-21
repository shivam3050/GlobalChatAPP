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



// ==================== IN App.jsx ====================

// Replace the webRTCStartFunction in App.jsx with this:
webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  try {
    if (!socketContainer.current || socketContainer.current.readyState !== 1) {
      alert("WebSocket not ready");
      return;
    }

    // Close existing connection if any
    if (webRTCContainerRef.current.senderPC) {
      if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
        alert("A connection already exists, close it first.");
        return;
      }
      try {
        webRTCContainerRef.current.senderPC.getSenders().forEach(s => {
          if (s.track) s.track.stop();
        });
        webRTCContainerRef.current.senderPC.close();
      } catch (e) {
        console.error("Error closing previous connection:", e);
      }
      webRTCContainerRef.current.senderPC = null;
    }

    // Clean up old video elements
    if (webRTCContainerRef.current.streamElementAtSender) {
      webRTCContainerRef.current.streamElementAtSender.remove();
      webRTCContainerRef.current.streamElementAtSender = null;
    }

    // Stop old streams
    if (webRTCContainerRef.current.senderStreamsObject) {
      webRTCContainerRef.current.senderStreamsObject.getTracks().forEach(t => t.stop());
    }

    // Create new peer connection with STUN servers for better NAT traversal
    webRTCContainerRef.current.senderPC = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    const pc = webRTCContainerRef.current.senderPC;

    // Get media stream if needed
    if (motive === "mediastream") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        webRTCContainerRef.current.senderStreamsObject = stream;

        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      } catch (err) {
        alert("Camera/microphone access denied: " + err.message);
        pc.close();
        webRTCContainerRef.current.senderPC = null;
        return;
      }
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("Track received:", event.track.kind);

      if (event.track.kind === "video") {
        // Prevent duplicate video elements
        if (webRTCContainerRef.current.streamElementAtSender) {
          return;
        }

        const video = document.createElement("video");
        video.srcObject = event.streams[0];
        video.autoplay = true;
        video.playsInline = true;
        video.muted = false;
        video.controls = false;
        video.style.width = "100%";
        video.style.borderRadius = "calc(5*var(--med-border-radius))";

        // Play video with error handling
        video.play().catch(e => {
          console.error("Video play error:", e);
          // Retry on user interaction
          video.onclick = () => video.play();
        });

        const container = document.createElement("section");
        container.style.width = "clamp(100px, 80%, 400px)";
        container.style.position = "relative";
        
        // Add close button
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✖";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "10px";
        closeBtn.style.zIndex = "30";
        closeBtn.style.backgroundColor = "red";
        closeBtn.style.color = "white";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "50%";
        closeBtn.style.width = "30px";
        closeBtn.style.height = "30px";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = () => {
          if (webRTCContainerRef.current.senderPC) {
            webRTCContainerRef.current.senderPC.close();
            webRTCContainerRef.current.senderPC = null;
          }
          if (webRTCContainerRef.current.senderStreamsObject) {
            webRTCContainerRef.current.senderStreamsObject.getTracks().forEach(t => t.stop());
          }
          container.remove();
          webRTCContainerRef.current.streamElementAtSender = null;
        };

        container.appendChild(video);
        container.appendChild(closeBtn);

        const parent = document.getElementById("chats-div");
        if (parent) {
          parent.appendChild(container);
          parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
        }

        webRTCContainerRef.current.streamElementAtSender = container;
      }

      if (event.track.kind === "audio") {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.play().catch(e => console.error("Audio play error:", e));
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (e) => {
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

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      
      if (pc.connectionState === "connected") {
        console.log("WebRTC connected!");
      }

      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        if (webRTCContainerRef.current.streamElementAtSender) {
          webRTCContainerRef.current.streamElementAtSender.remove();
          webRTCContainerRef.current.streamElementAtSender = null;
        }
        if (webRTCContainerRef.current.senderStreamsObject) {
          webRTCContainerRef.current.senderStreamsObject.getTracks().forEach(t => t.stop());
        }
        pc.close();
        webRTCContainerRef.current.senderPC = null;
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketContainer.current.send(JSON.stringify({
      type: "query-message",
      queryType: "offer",
      sender: userRef.current,
      receiver: userRef.current.focusedContact,
      d: offer
    }));

  } catch (err) {
    alert("WebRTC setup failed: " + err.message);
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
