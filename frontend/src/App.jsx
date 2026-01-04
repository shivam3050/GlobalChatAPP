import './App.css'
import AllContactsAndNotifications from './routes/AllNotification';
import AllUsers from './routes/AllUsers';
import ChatsRoute from './routes/ChatsRoute';
import { Home } from './routes/home'
import { useEffect, useRef, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { userRef as userSchema, chatsRef as chatSchema } from '../src/controllers/userModel.js';
import { countries } from './controllers/allCountries.js';










function App() {
  console.log("app route is called")

  const socketContainer = useRef({})

  const webrtcContainer = useRef({})

  const rtcbuttonRef = useRef(null)

  const rtcStarterFunction = useRef(null)

  const [user, setUser] = useState(null)


  const userRef = useRef(userSchema)

  const chatRef = useRef(chatSchema)

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

  rtcStarterFunction.current = async () => {
    try {
      // Check WebSocket is ready
      if (!socketContainer.current || socketContainer.current.readyState !== 1) {
        console.error("WebSocket not ready");
        return;
      }

      const pc = new RTCPeerConnection();
      webrtcContainer.current.pc = pc;
      const dc = pc.createDataChannel("text");
      webrtcContainer.current.dc = dc;

      webrtcContainer.current.dc.onopen = () => {
        console.log("Data channel open");
        webrtcContainer.current.dc.send("Hello Sir");
        rtcbuttonRef.current.style.backgroundColor = "red";
        rtcbuttonRef.current.onclick = (e) => {
          e.stopPropagation();
          // Close the data channel first
          if (webrtcContainer.current.dc) {
            webrtcContainer.current.dc.close();
            console.log("data channel closed")
            webrtcContainer.current.dc = null;
          }

          // Then close the peer connection
          if (webrtcContainer.current.pc) {
            webrtcContainer.current.pc.close();
            console.log("full connection closed")
            webrtcContainer.current.pc = null;
          }
          rtcbuttonRef.current.onclick = rtcStarterFunction;
          rtcbuttonRef.current.style.backgroundColor = "transparent";

        }
      };
      webrtcContainer.current.dc.onmessage = (e) => {
        console.log("Message from receiver:", e.data);
        alert(e.data)
      };

      dc.onerror = (err) => console.error("Data channel error:", err);




      pc.onicecandidate = (e) => {
        if (e.candidate) {
          try {
            //THIS IS SIGNAL TO WS SERVER
            socketContainer.current.send(
              JSON.stringify({
                type: "query-message",
                queryType: "ice",
                sender: { username: userRef.current.username, id: userRef.current.id, country: userRef.current.country, customAccessToken: userRef.current.customAccessToken },
                receiver: userRef.current.focusedContact,
                d: e.candidate
              })
            );
          } catch (err) {
            console.error("Failed to send ICE candidate:", err);
          }
        }
      };





      // Create and send offer , 
      const offer = await webrtcContainer.current.pc.createOffer();

      await webrtcContainer.current.pc.setLocalDescription(offer);

      // Sending via websocket , this will hit server first
      //THIS IS SIGNAL TO WS SERVER
      socketContainer.current.send(
        JSON.stringify({
          type: "query-message",
          sender: { username: userRef.current.username, id: userRef.current.id, country: userRef.current.country, customAccessToken: userRef.current.customAccessToken },
          receiver: userRef.current.focusedContact,
          queryType: "offer",
          d: offer
        })
      );

      // Cleanup on connection close
      webrtcContainer.current.pc.onconnectionstatechange = () => {
        // Only cleanup if connection actually failed or closed
      if (webrtcContainer.current.pc && 
          (webrtcContainer.current.pc.connectionState === "failed" ||
           webrtcContainer.current.pc.connectionState === "closed")) {
        
        console.log("Connection failed/closed, cleaning up");
        
        // Close datachannel
        if (webrtcContainer.current.dc) {
          webrtcContainer.current.dc.close();
          webrtcContainer.current.dc = null;
        }
        
        // Close peer connection
        webrtcContainer.current.pc.close();
        webrtcContainer.current.pc = null;
        
        // Reset button
        rtcbuttonRef.current.style.backgroundColor = "transparent";
        rtcbuttonRef.current.onclick = rtcStarterFunction.current;
      }
      };

    } catch (err) {
      console.error("WebRTC setup failed:", err);
      
    }
  }

  return (

    <Router>
      <Routes>

        <Route path="/" element={<Home

          socketContainer={socketContainer}

          webrtcContainer={webrtcContainer}

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
