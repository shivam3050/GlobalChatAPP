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
      // Check WebSocket readiness
      if (!socketContainer.current || socketContainer.current.readyState !== 1) {
        // alert("WebSocket not ready");
        alert("WebSocket not ready");
        return;
      }

      // Cleanup existing connection if any
      if (webRTCContainerRef.current.senderPC) {
        if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
          // alert("A connection already exists, close it first.");
          alert("A connection already exists, close it first.");
          return;
        }
        try {
          webRTCContainerRef.current.senderPC.getSenders().forEach(s => s.track && s.track.stop());
          webRTCContainerRef.current.senderPC.close();
        } catch (err) {
          // alert("Error closing previous peer connection: " + err.message);
          console.error("Error closing previous peer connection:", err);
        }
        webRTCContainerRef.current.senderPC = null;
      }

      // Create new RTCPeerConnection
      webRTCContainerRef.current.senderPC = new RTCPeerConnection();
      webRTCContainerRef.current.senderDC = null;
      alert("webrtc new connecion is starting sfrom here")

      // Create DataChannel or MediaStream depending on motive
      if (motive === "text") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
      } else if (motive === "binary") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("binary");
      } else if (motive === "json") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("json");
      } else if (motive === "mediastream") {
        alert("webrtc media stream motive chosen")
        try {
          webRTCContainerRef.current.senderStreamsObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

          // Step 2: Get tracks
        const videoTrack = webRTCContainerRef.current.senderStreamsObject.getVideoTracks()[0];
        const audioTrack = webRTCContainerRef.current.senderStreamsObject.getAudioTracks()[0];
        
        if (!videoTrack || !audioTrack) {
            throw new Error("Tracks missing from stream");
        }
        
        // Step 3: WAIT for tracks to be ready (instead of throwing error)
        alert(`Waiting for tracks... Video: ${videoTrack.readyState}, Audio: ${audioTrack.readyState}`);
        
        // Wait for video track to be live
        if (videoTrack.readyState !== "live") {
            await new Promise((resolve) => {
                if (videoTrack.readyState === "live") {
                    resolve();
                } else {
                    videoTrack.onunmute = () => {
                        if (videoTrack.readyState === "live") {
                            resolve();
                        }
                    };
                    // Fallback: max 3 seconds wait
                    setTimeout(resolve, 3000);
                }
            });
        }
        
        // Wait for audio track to be live
        if (audioTrack.readyState !== "live") {
            await new Promise((resolve) => {
                if (audioTrack.readyState === "live") {
                    resolve();
                } else {
                    audioTrack.onunmute = () => {
                        if (audioTrack.readyState === "live") {
                            resolve();
                        }
                    };
                    // Fallback: max 3 seconds wait
                    setTimeout(resolve, 3000);
                }
            });
        }
        
        alert(`Tracks ready now! Video: ${videoTrack.readyState}, Audio: ${audioTrack.readyState}`);
        
        // Step 4: Store stream
    
        webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();
        
        // Step 5: Add tracks to peer connection
        webRTCContainerRef.current.senderPC.addTrack(videoTrack, webRTCContainerRef.current.senderStreamsObject);
        alert("Video track added to PC");
        
        webRTCContainerRef.current.senderPC.addTrack(audioTrack, webRTCContainerRef.current.senderStreamsObject);
        alert("Audio track added to PC");

          webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();

         


        } catch (err) {
          alert("Some error in setting media stream(in app.jsx): " + err.name);
          console.error("Some error in setting media stream:", err);
          return;
        }
      } else {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
        alert("No motive provided, creating default text DataChannel");
      }

      // RECEIVER TRACK HANDLER
      webRTCContainerRef.current.senderPC.ontrack = (event) => {
        try {
          alert("a track came from receiver now see this in app.jsx kind> ",event.track.kind)

          if (event.transceiver.mid === "0") {
            // video
            if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
              webRTCContainerRef.current.streamElementAtSender.remove();
            }

            const el = document.createElement(event.track.kind === "video" ? "video" : "audio");
            el.srcObject = event.streams[0];
            
            el.controls = true;
           
            el.style.zIndex = "20";
            el.style.borderRadius = "calc(5*var(--med-border-radius))"
            el.muted = true;
            el.playsInline = true;
           




            const videoDivAndSTTBtnContainer = document.createElement("section")
            videoDivAndSTTBtnContainer.style.width = "clamp(100px,80%,400px)";
            videoDivAndSTTBtnContainer.style.boxShadow = "1px 1px 2px 1px black";
            videoDivAndSTTBtnContainer.style.border = "1px solid black";
            // lets create a voice capturer for speech to text
            const button = document.createElement("button")
            videoDivAndSTTBtnContainer.appendChild(el) // this is the video element
            videoDivAndSTTBtnContainer.appendChild(button) // this is stt button



            webRTCContainerRef.current.streamElementAtSender = videoDivAndSTTBtnContainer

            const parent = document.getElementById("chats-div"); // THIS NEEDS TO BE CHANGED WHERE YOU WANT TO PUT THIS ELEMENT IN SENDER SIDE

            webRTCContainerRef.current.streamElementParentAtSender = parent;


          




            if (parent) {
              parent.appendChild(videoDivAndSTTBtnContainer)

            };

            alert("Receiver track added to sender side element");
            return
          }

          if(event.transceiver.mid === "1") {
            // call audio // continue
            
            return
          }
    
         
          return

        } catch (err) {
          // alert("Error handling incoming track: " + err.message);
          alert("Error handling incoming track:", err);
        }
      };

      // DATA CHANNEL HANDLER
      if (webRTCContainerRef.current.senderDC) {
        webRTCContainerRef.current.senderDC.onopen = () => {
          alert("Data channel open");
          try { webRTCContainerRef.current.senderDC.send("Hello Sir"); } catch (err) { alert("Failed to send message: " + err.message); }
        };
        webRTCContainerRef.current.senderDC.onmessage = (e) => {
          alert("Message from receiver:", e.data);
          // alert(e.data);
        };
        webRTCContainerRef.current.senderDC.onerror = (err) => {
          // alert("Data channel error: " + err.message);
          alert("Data channel error:", err);
        };
      }

      // ICE CANDIDATE HANDLER
      webRTCContainerRef.current.senderPC.onicecandidate = (e) => {
        if (e.candidate) {
          try {
            socketContainer.current.send(JSON.stringify({
              type: "query-message",
              queryType: "ice",
              sender: {
                username: userRef.current.username,
                id: userRef.current.id,
                country: userRef.current.country,
                customAccessToken: userRef.current.customAccessToken
              },
              receiver: userRef.current.focusedContact,
              d: e.candidate
            }));
          } catch (err) {
            // alert("Failed to send ICE candidate: " + err.message);
            alert("Failed to send ICE candidate:", err);
          }
        }
      };

      // CREATE AND SEND OFFER
      try {
       
    
        const offer = await webRTCContainerRef.current.senderPC.createOffer();
        await webRTCContainerRef.current.senderPC.setLocalDescription(offer);
        socketContainer.current.send(JSON.stringify({
          type: "query-message",
          sender: {
            username: userRef.current.username,
            id: userRef.current.id,
            country: userRef.current.country,
            customAccessToken: userRef.current.customAccessToken
          },
          receiver: userRef.current.focusedContact,
          queryType: "offer",
          d: offer,
   
        }));
      } catch (err) {
        // alert("Failed to create/send offer: " + err.message);
        alert("Failed to create/send offer:", err);
        return;
      }

      // CONNECTION STATE CHANGE HANDLER
      webRTCContainerRef.current.senderPC.onconnectionstatechange = () => {
        const pc = webRTCContainerRef.current.senderPC;
        if (!pc) return;

        const cleanup = () => {
          try {
            // Stop any TTS audio playing

            textToSpeechContainerRef.current.cleanUp()

            pc.getSenders().forEach(sender => { if (sender.track) { sender.track.stop(); pc.removeTrack(sender); } });
            if (webRTCContainerRef.current.streamElementAtSender?.parentNode) { webRTCContainerRef.current.streamElementAtSender.remove(); webRTCContainerRef.current.streamElementAtSender = null; }
            if (webRTCContainerRef.current.senderDC) { webRTCContainerRef.current.senderDC.close(); webRTCContainerRef.current.senderDC = null; }
            pc.close();
            webRTCContainerRef.current.senderPC = null;
            rtcbuttonRef.current.style.backgroundColor = "transparent";
            rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream"); };
          } catch (err) { console.error("Cleanup failed:", err); }
        };

        if (pc.connectionState === "connected") {
          rtcbuttonRef.current.style.backgroundColor = "red";
          rtcbuttonRef.current.onclick = (e) => { e.stopPropagation(); cleanup(); };
        }
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          // alert("Connection failed/closed");
          alert("Connection failed/closed, cleaning up");
          cleanup();
        }
      };

    } catch (err) {
      // alert("WebRTC setup failed: " + err.message);
      alert("WebRTC setup failed:", err);
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
