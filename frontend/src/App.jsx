import './App.css'
import AllContactsAndNotifications from './routes/AllNotification';
import AllUsers from './routes/AllUsers';
import ChatsRoute from './routes/ChatsRoute';
import { Home } from './routes/home'
import { useEffect, useRef, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { userRef as userSchema, chatsRef as chatSchema, webRTCContainerRef as webRTCContainerRefSchema } from '../src/controllers/userModel.js';
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

  const webRTCContainerRef = useRef(webRTCContainerRefSchema)

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

  // webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  //   try {
  //     // Check WebSocket is ready
  //     if (!socketContainer.current || socketContainer.current.readyState !== 1) {
  //       console.error("WebSocket not ready");
  //       return;
  //     }

  //     if (webRTCContainerRef.current.senderPC) {

  //       if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
  //         console.error("sorry a connection already exists, first close that.")
  //         return;
  //       }
  //       try {
  //         webRTCContainerRef.current.senderPC.getSenders().forEach(s => s.track && s.track.stop());
  //         webRTCContainerRef.current.senderPC.close();
  //       } catch (_) { }
  //       webRTCContainerRef.current.senderPC = null;
  //     }

  //     webRTCContainerRef.current.senderPC = new RTCPeerConnection();

  //     webRTCContainerRef.current.senderDC = null;
  //     if (motive === "text") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text")
  //     } else if (motive === "binary") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("binary")
  //     } else if (motive === "json") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("json")
  //     } else if (motive === "mediastream") {

  //       webRTCContainerRef.current.senderStreamsObject = await navigator.mediaDevices.getUserMedia({ video: true });
  //       webRTCContainerRef.current.senderTracksContainerArray = []
  //       webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks()
  //       webRTCContainerRef.current.senderTracksContainerArray.forEach(track => webRTCContainerRef.current.senderPC.addTrack(track, webRTCContainerRef.current.senderStreamsObject))
  //       // webrtcContainer.current.localStream = audioTrack; // currently only one track i am using // storing for reference when time to stop camera
  //       // webrtcContainer.current.aStream = aStream; // currently this the stream , currntly only one stream of video tracks i am using , this stream can contains video + audio two three four tracks , and as well as streams can also be multiple and tracks per stream also be multiple


  //     } else {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text")
  //       console.log("no motive provided for rtc, assuming default text motive and creating data channel")
  //     }

  //     if (!webRTCContainerRef.current.senderDC) {
  //       // pass
  //     } else {


  //       webRTCContainerRef.current.senderPC.ontrack = (event) => {
  //         console.log("a ontrack event fired on sender side")

        
  //           if (webRTCContainerRef.current.streamElementAtSender && webRTCContainerRef.current.streamElementAtSender.parentNode) {
  //             webRTCContainerRef.current.streamElementAtSender.remove()
  //           }
            
  //           webRTCContainerRef.current.streamElementAtSender = document.createElement(event.kind)
  //           console.log("now element to show created")
  //           // webRTCContainerRef.current.streamElementAtSender.srcObject = webRTCContainerRef.current.senderStreamsObject
  //           webRTCContainerRef.current.streamElementAtSender.autoplay = true

  //           webRTCContainerRef.current.streamElementAtSender.style.zIndex = "20";
  //           webRTCContainerRef.current.streamElementAtSender.style.width = "clamp(100px,80%,500px)"





  //           console.log("going to append the element in the chatsdiv")
  //           webRTCContainerRef.current.streamElementParentAtSender = document.getElementById("chats-div") // this may not be active "" THIS IS WHERE VIDEO OR THE ELEMENT TO BE SHOWN""
  //           if (webRTCContainerRef.current.streamElementParentAtSender) {

  //             webRTCContainerRef.current.streamElementParentAtSender.appendChild(webRTCContainerRef.current.streamElementAtSender)

  //           }
          

  //         if (webRTCContainerRef.current.streamElementAtSender) {
  //           webRTCContainerRef.current.streamElementAtSender.srcObject = event.streams[0];
  //           console.log("a coming track added")
  //         }
  //       }



  //       webRTCContainerRef.current.senderDC.onopen = () => {
  //         console.log("Data channel open");
  //         webRTCContainerRef.current.senderDC.send("Hello Sir");

  //       };
  //       webRTCContainerRef.current.senderDC.onmessage = (e) => {
  //         console.log("Message from receiver:", e.data);
  //         alert(e.data)
  //       };

  //       webRTCContainerRef.current.senderDC.onerror = (err) => console.error("Data channel error:", err);

  //     }





  //     webRTCContainerRef.current.senderPC.onicecandidate = (e) => {
  //       if (e.candidate) {
  //         try {
  //           //THIS IS SIGNAL TO WS SERVER
  //           socketContainer.current.send(
  //             JSON.stringify({
  //               type: "query-message",
  //               queryType: "ice",
  //               sender: { username: userRef.current.username, id: userRef.current.id, country: userRef.current.country, customAccessToken: userRef.current.customAccessToken },
  //               receiver: userRef.current.focusedContact,
  //               d: e.candidate
  //             })
  //           );
  //         } catch (err) {
  //           console.error("Failed to send ICE candidate:", err);
  //         }
  //       }
  //     };





  //     // Create and send offer , 
  //     const offer = await webRTCContainerRef.current.senderPC.createOffer();

  //     await webRTCContainerRef.current.senderPC.setLocalDescription(offer);

  //     // Sending via websocket , this will hit server first
  //     //THIS IS SIGNAL TO WS SERVER
  //     socketContainer.current.send(
  //       JSON.stringify({
  //         type: "query-message",
  //         sender: { username: userRef.current.username, id: userRef.current.id, country: userRef.current.country, customAccessToken: userRef.current.customAccessToken },
  //         receiver: userRef.current.focusedContact,
  //         queryType: "offer",
  //         d: offer
  //       })
  //     );

  //     // Cleanup on connection close
  //     webRTCContainerRef.current.senderPC.onconnectionstatechange = () => {

  //       if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
  //         rtcbuttonRef.current.style.backgroundColor = "red";


  //         rtcbuttonRef.current.onclick = (e) => {

  //           e.stopPropagation();

  //           // STOP all sender tracks
  //           if (webRTCContainerRef.current.senderPC) {
  //             webRTCContainerRef.current.senderPC.getSenders().forEach(sender => {
  //               if (sender.track) {
  //                 sender.track.stop();          // HARD stop camera
  //                 webRTCContainerRef.current.senderPC.removeTrack(sender); // DETACH sender
  //               }
  //             });

  //           }
  //           if (webRTCContainerRef.current.streamElementAtSender && webRTCContainerRef.current.streamElementParentAtSender) {

  //             webRTCContainerRef.current.streamElementParentAtSender.removeChild(webRTCContainerRef.current.streamElementAtSender)
  //             console.log("your element removed")

  //           }

  //           // Close track
  //           if (webRTCContainerRef.current.senderTC) { // your side means sender side bcz this is inside onclick
  //             webRTCContainerRef.current.senderTracksContainerArray.forEach(track => { track.stop() })
  //             webRTCContainerRef.current.senderTC.stop();


  //             webRTCContainerRef.current.senderTC = null;
  //             console.log("tc closed")
  //           }

  //           // Close the data channel first
  //           if (webRTCContainerRef.current.senderDC) {
  //             webRTCContainerRef.current.senderDC.close();
  //             console.log("data channel closed")
  //             webRTCContainerRef.current.senderDC = null;
  //           }

  //           // Then close the peer connection
  //           if (webRTCContainerRef.current.senderPC) {
  //             webRTCContainerRef.current.senderPC.close();
  //             console.log("full connection closed")
  //             webRTCContainerRef.current.senderPC = null;
  //           }
  //           webRTCContainerRef.current.senderPC = null;

  //           rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
  //           rtcbuttonRef.current.style.backgroundColor = "transparent";

  //         }
  //       }
  //       // Only cleanup if connection actually failed or closed
  //       if (webRTCContainerRef.current.senderPC && (webRTCContainerRef.current.senderPC.connectionState === "failed" || webRTCContainerRef.current.senderPC.connectionState === "closed")) {

  //         console.log("Connection failed/closed, cleaning up");

  //         // STOP all sender tracks
  //         if (webRTCContainerRef.current.senderPC) {
  //           webRTCContainerRef.current.senderPC.getSenders().forEach(sender => {
  //             if (sender.track) {
  //               sender.track.stop();          // HARD stop camera
  //               webRTCContainerRef.current.senderPC.removeTrack(sender); // DETACH sender
  //             }
  //           });
  //         }


  //         // Close datachannel
  //         if (webRTCContainerRef.current.senderDC) {
  //           webRTCContainerRef.current.senderDC.close();
  //           webRTCContainerRef.current.senderDC = null;
  //         }

  //         // Close peer connection
  //         webRTCContainerRef.current.senderPC.close();
  //         webRTCContainerRef.current.senderPC = null;

  //         if (webRTCContainerRef.current.streamElementAtSender && webRTCContainerRef.current.streamElementAtSender.parentNode) {
  //           webRTCContainerRef.current.streamElementAtSender.remove()
  //         }
  //         webRTCContainerRef.current.streamElementAtSender = null





  //         webRTCContainerRef.current.senderPC = null;

  //         // Reset button
  //         rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
  //         rtcbuttonRef.current.style.backgroundColor = "transparent";
  //       }
  //     };

  //   } catch (err) {
  //     console.error("WebRTC setup failed:", err);

  //   }
  // }
  webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  try {
    // Check WebSocket readiness
    if (!socketContainer.current || socketContainer.current.readyState !== 1) {
      console.error("WebSocket not ready");
      return;
    }

    // Cleanup existing connection if any
    if (webRTCContainerRef.current.senderPC) {
      if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
        console.error("sorry a connection already exists, first close that.");
        return;
      }
      try {
        webRTCContainerRef.current.senderPC.getSenders().forEach(s => s.track && s.track.stop());
        webRTCContainerRef.current.senderPC.close();
      } catch (_) {}
      webRTCContainerRef.current.senderPC = null;
    }

    // Create new RTCPeerConnection
    webRTCContainerRef.current.senderPC = new RTCPeerConnection();
    webRTCContainerRef.current.senderDC = null;

    // Create DataChannel or MediaStream depending on motive
    if (motive === "text") {
      webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
    } else if (motive === "binary") {
      webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("binary");
    } else if (motive === "json") {
      webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("json");
    } else if (motive === "mediastream") {
      // GET local video stream
      webRTCContainerRef.current.senderStreamsObject = await navigator.mediaDevices.getUserMedia({ video: true });
      webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();
      webRTCContainerRef.current.senderTracksContainerArray.forEach(track => {
        webRTCContainerRef.current.senderPC.addTrack(track, webRTCContainerRef.current.senderStreamsObject);
      });
    } else {
      // Default text channel
      webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
      console.log("No motive provided, creating default text DataChannel");
    }

    // RECEIVER TRACK HANDLER: show remote stream on sender side
    webRTCContainerRef.current.senderPC.ontrack = (event) => {
      console.log("ontrack event fired on sender side");

      // Remove old element if exists
      if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
        webRTCContainerRef.current.streamElementAtSender.remove();
      }

      // CREATE new element (CHANGE: always explicit 'video'/'audio', old: document.createElement(event.kind))
      const el = document.createElement(event.track.kind === "video" ? "video" : "audio");
      el.srcObject = event.streams[0]; // CHANGE: assign srcObject BEFORE append
      el.autoplay = true;
      el.controls = true;
      el.muted = event.track.kind === "video"; // CHANGE: mute video for autoplay
      el.style.zIndex = "20";
      el.style.width = "clamp(100px,80%,500px)";

      webRTCContainerRef.current.streamElementAtSender = el;

      // Append to DOM
      const parent = document.getElementById("chats-div");
      webRTCContainerRef.current.streamElementParentAtSender = parent;
      if (parent) parent.appendChild(el);

      console.log("Receiver track added to sender side element");
    };

    // DATA CHANNEL HANDLER
    if (webRTCContainerRef.current.senderDC) {
      webRTCContainerRef.current.senderDC.onopen = () => {
        console.log("Data channel open");
        webRTCContainerRef.current.senderDC.send("Hello Sir");
      };
      webRTCContainerRef.current.senderDC.onmessage = (e) => {
        console.log("Message from receiver:", e.data);
        alert(e.data);
      };
      webRTCContainerRef.current.senderDC.onerror = (err) => console.error("Data channel error:", err);
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
          console.error("Failed to send ICE candidate:", err);
        }
      }
    };

    // CREATE AND SEND OFFER
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
      d: offer
    }));

    // CONNECTION STATE CHANGE HANDLER
    webRTCContainerRef.current.senderPC.onconnectionstatechange = () => {
      const pc = webRTCContainerRef.current.senderPC;

      if (!pc) return;

      // CONNECTED STATE
      if (pc.connectionState === "connected") {
        rtcbuttonRef.current.style.backgroundColor = "red";

        rtcbuttonRef.current.onclick = (e) => {
          e.stopPropagation();

          // STOP local tracks
          pc.getSenders().forEach(sender => {
            if (sender.track) {
              sender.track.stop();
              pc.removeTrack(sender);
            }
          });

          // Remove video element
          if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
            webRTCContainerRef.current.streamElementAtSender.remove();
            webRTCContainerRef.current.streamElementAtSender = null;
          }

          // Close DataChannel
          if (webRTCContainerRef.current.senderDC) {
            webRTCContainerRef.current.senderDC.close();
            webRTCContainerRef.current.senderDC = null;
          }

          // Close PeerConnection
          pc.close();
          webRTCContainerRef.current.senderPC = null;

          rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
          rtcbuttonRef.current.style.backgroundColor = "transparent";
        };
      }

      // FAILED / CLOSED STATE CLEANUP
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        console.log("Connection failed/closed, cleaning up");

        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
            pc.removeTrack(sender);
          }
        });

        if (webRTCContainerRef.current.senderDC) {
          webRTCContainerRef.current.senderDC.close();
          webRTCContainerRef.current.senderDC = null;
        }

        pc.close();
        webRTCContainerRef.current.senderPC = null;

        if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
          webRTCContainerRef.current.streamElementAtSender.remove();
          webRTCContainerRef.current.streamElementAtSender = null;
        }

        rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
        rtcbuttonRef.current.style.backgroundColor = "transparent";
      }
    };

  } catch (err) {
    console.error("WebRTC setup failed:", err);
  }
};


  return (

    <Router>
      <Routes>

        <Route path="/" element={<Home

          socketContainer={socketContainer}

          webRTCContainerRef={webRTCContainerRef}

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
