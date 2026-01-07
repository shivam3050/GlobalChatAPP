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

  //in the below i am copying and adding alerts for just errors
  //   webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  //   try {
  //     // Check WebSocket readiness
  //     if (!socketContainer.current || socketContainer.current.readyState !== 1) {
  //       console.error("WebSocket not ready");
  //       alert("WebSocket not ready");
  //       return;
  //     }

  //     // Cleanup existing connection if any
  //     if (webRTCContainerRef.current.senderPC) {
  //       if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
  //         console.error("sorry a connection already exists, first close that.");
  //         alert("A connection already exists, close it first.");
  //         return;
  //       }
  //       try {
  //         webRTCContainerRef.current.senderPC.getSenders().forEach(s => s.track && s.track.stop());
  //         webRTCContainerRef.current.senderPC.close();
  //       } catch (_) {alert("Error closing previous peer connection: ");}
  //       webRTCContainerRef.current.senderPC = null;
  //     }

  //     // Create new RTCPeerConnection
  //     webRTCContainerRef.current.senderPC = new RTCPeerConnection();
  //     webRTCContainerRef.current.senderDC = null;

  //     // Create DataChannel or MediaStream depending on motive
  //     if (motive === "text") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
  //     } else if (motive === "binary") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("binary");
  //     } else if (motive === "json") {
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("json");
  //     } else if (motive === "mediastream") {
  //       // GET local video stream
  //       webRTCContainerRef.current.senderStreamsObject = await navigator.mediaDevices.getUserMedia({ video: true });
  //       webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();
  //       webRTCContainerRef.current.senderTracksContainerArray.forEach(track => {
  //         webRTCContainerRef.current.senderPC.addTrack(track, webRTCContainerRef.current.senderStreamsObject);
  //       });
  //     } else {
  //       // Default text channel
  //       webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
  //       console.log("No motive provided, creating default text DataChannel");
  //     }

  //     // RECEIVER TRACK HANDLER: show remote stream on sender side
  //     webRTCContainerRef.current.senderPC.ontrack = (event) => {
  //       console.log("ontrack event fired on sender side");

  //       // Remove old element if exists
  //       if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
  //         webRTCContainerRef.current.streamElementAtSender.remove();
  //       }

  //       // CREATE new element (CHANGE: always explicit 'video'/'audio', old: document.createElement(event.kind))
  //       const el = document.createElement(event.track.kind === "video" ? "video" : "audio");
  //       el.srcObject = event.streams[0]; // CHANGE: assign srcObject BEFORE append
  //       el.autoplay = true;
  //       el.controls = true;
  //       el.muted = event.track.kind === "video"; // CHANGE: mute video for autoplay
  //       el.style.zIndex = "20";
  //       el.style.width = "clamp(100px,80%,500px)";

  //       webRTCContainerRef.current.streamElementAtSender = el;

  //       // Append to DOM
  //       const parent = document.getElementById("chats-div");
  //       webRTCContainerRef.current.streamElementParentAtSender = parent;
  //       if (parent) parent.appendChild(el);

  //       console.log("Receiver track added to sender side element");
  //     };

  //     // DATA CHANNEL HANDLER
  //     if (webRTCContainerRef.current.senderDC) {
  //       webRTCContainerRef.current.senderDC.onopen = () => {
  //         console.log("Data channel open");
  //         webRTCContainerRef.current.senderDC.send("Hello Sir");
  //       };
  //       webRTCContainerRef.current.senderDC.onmessage = (e) => {
  //         console.log("Message from receiver:", e.data);
  //         alert(e.data);
  //       };
  //       webRTCContainerRef.current.senderDC.onerror = (err) => console.error("Data channel error:", err);
  //     }

  //     // ICE CANDIDATE HANDLER
  //     webRTCContainerRef.current.senderPC.onicecandidate = (e) => {
  //       if (e.candidate) {
  //         try {
  //           socketContainer.current.send(JSON.stringify({
  //             type: "query-message",
  //             queryType: "ice",
  //             sender: {
  //               username: userRef.current.username,
  //               id: userRef.current.id,
  //               country: userRef.current.country,
  //               customAccessToken: userRef.current.customAccessToken
  //             },
  //             receiver: userRef.current.focusedContact,
  //             d: e.candidate
  //           }));
  //         } catch (err) {
  //           console.error("Failed to send ICE candidate:", err);
  //         }
  //       }
  //     };

  //     // CREATE AND SEND OFFER
  //     const offer = await webRTCContainerRef.current.senderPC.createOffer();
  //     await webRTCContainerRef.current.senderPC.setLocalDescription(offer);
  //     socketContainer.current.send(JSON.stringify({
  //       type: "query-message",
  //       sender: {
  //         username: userRef.current.username,
  //         id: userRef.current.id,
  //         country: userRef.current.country,
  //         customAccessToken: userRef.current.customAccessToken
  //       },
  //       receiver: userRef.current.focusedContact,
  //       queryType: "offer",
  //       d: offer
  //     }));

  //     // CONNECTION STATE CHANGE HANDLER
  //     webRTCContainerRef.current.senderPC.onconnectionstatechange = () => {
  //       const pc = webRTCContainerRef.current.senderPC;

  //       if (!pc) return;

  //       // CONNECTED STATE
  //       if (pc.connectionState === "connected") {
  //         rtcbuttonRef.current.style.backgroundColor = "red";

  //         rtcbuttonRef.current.onclick = (e) => {
  //           e.stopPropagation();

  //           // STOP local tracks
  //           pc.getSenders().forEach(sender => {
  //             if (sender.track) {
  //               sender.track.stop();
  //               pc.removeTrack(sender);
  //             }
  //           });

  //           // Remove video element
  //           if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
  //             webRTCContainerRef.current.streamElementAtSender.remove();
  //             webRTCContainerRef.current.streamElementAtSender = null;
  //           }

  //           // Close DataChannel
  //           if (webRTCContainerRef.current.senderDC) {
  //             webRTCContainerRef.current.senderDC.close();
  //             webRTCContainerRef.current.senderDC = null;
  //           }

  //           // Close PeerConnection
  //           pc.close();
  //           webRTCContainerRef.current.senderPC = null;

  //           rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
  //           rtcbuttonRef.current.style.backgroundColor = "transparent";
  //         };
  //       }

  //       // FAILED / CLOSED STATE CLEANUP
  //       if (pc.connectionState === "failed" || pc.connectionState === "closed") {
  //         console.log("Connection failed/closed, cleaning up");

  //         pc.getSenders().forEach(sender => {
  //           if (sender.track) {
  //             sender.track.stop();
  //             pc.removeTrack(sender);
  //           }
  //         });

  //         if (webRTCContainerRef.current.senderDC) {
  //           webRTCContainerRef.current.senderDC.close();
  //           webRTCContainerRef.current.senderDC = null;
  //         }

  //         pc.close();
  //         webRTCContainerRef.current.senderPC = null;

  //         if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
  //           webRTCContainerRef.current.streamElementAtSender.remove();
  //           webRTCContainerRef.current.streamElementAtSender = null;
  //         }

  //         rtcbuttonRef.current.onclick = () => { webRTCContainerRef.current.webRTCStartFunction("mediastream") };
  //         rtcbuttonRef.current.style.backgroundColor = "transparent";
  //       }
  //     };

  //   } catch (err) {
  //     console.error("WebRTC setup failed:", err);
  //   }
  // };
  webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
    try {
      // Check WebSocket readiness
      if (!socketContainer.current || socketContainer.current.readyState !== 1) {
        // alert("WebSocket not ready");
        console.error("WebSocket not ready");
        return;
      }

      // Cleanup existing connection if any
      if (webRTCContainerRef.current.senderPC) {
        if (webRTCContainerRef.current.senderPC.connectionState === "connected") {
          // alert("A connection already exists, close it first.");
          console.error("A connection already exists, close it first.");
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

      // Create DataChannel or MediaStream depending on motive
      if (motive === "text") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
      } else if (motive === "binary") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("binary");
      } else if (motive === "json") {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("json");
      } else if (motive === "mediastream") {
        try {
          webRTCContainerRef.current.senderStreamsObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();
          // webRTCContainerRef.current.senderTracksContainerArray.forEach(track => {
          //   webRTCContainerRef.current.senderPC.addTrack(track, webRTCContainerRef.current.senderStreamsObject);
          // });
          webRTCContainerRef.current.senderPC.addTrack(webRTCContainerRef.current.senderStreamsObject.getVideoTracks()[0], webRTCContainerRef.current.senderStreamsObject) // video track sent
          webRTCContainerRef.current.senderPC.addTrack(webRTCContainerRef.current.senderStreamsObject.getAudioTracks()[0], webRTCContainerRef.current.senderStreamsObject) // audio track sent
        } catch (err) {
          alert("Failed to access camera: " + err.name);
          console.error("Failed to access camera:", err);
          return;
        }
      } else {
        webRTCContainerRef.current.senderDC = webRTCContainerRef.current.senderPC.createDataChannel("text");
        console.log("No motive provided, creating default text DataChannel");
      }

      // RECEIVER TRACK HANDLER
      webRTCContainerRef.current.senderPC.ontrack = (event) => {
        try {

          if (event.track.kind === "audio") {
            return
          }
          if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
            webRTCContainerRef.current.streamElementAtSender.remove();
          }

          const el = document.createElement(event.track.kind === "video" ? "video" : "audio");
          el.srcObject = event.streams[0];
          el.autoplay = true;
          el.controls = true;
          el.muted = event.track.kind === "video";
          el.style.zIndex = "20";
          el.style.borderRadius= "calc(5*var(--med-border-radius))"
    



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


          const startVoiceCaptureForSTT = async () => {

            if (webRTCContainerRef.current.recogniserStreamObject && webRTCContainerRef.current.recogniserStreamObject.recogniser) {
              console.error("a recogniser for stt is already running")
              return false
            }



            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            const recogniser = new SpeechRecognition()

            webRTCContainerRef.current.recogniserStreamObject = { recogniser: recogniser, stoppedByUser: false, finalText: "" }

            recogniser.continuous = true;
            recogniser.interimResults = false;

            recogniser.onresult = (event) => {
              console.log("on result fired")


              const currentFinalPhraseIndex = event.results.length - 1

              console.log(event.results)

              // SpeechRecognitionResultList[
              //     {
              //         transcript: "it is again working",
              //         confidence: 0.8295,
              //         isFinal: true
              //     },
              //     {
              //         transcript: " started",
              //         confidence: 0.8869,
              //         isFinal: true
              //     },
              //     {
              //         transcript: " started",
              //         confidence: 0.8494,
              //         isFinal: true
              //     },
              //     {
              //         transcript: " recognise",
              //         confidence: 0.8359,
              //         isFinal: true
              //     }
              // ]



              // console.log(event.results[0].isFinal)
              // console.log(event.results[0][0].transcript)

              if (event.results[currentFinalPhraseIndex].isFinal) { // this check is for api basis
                webRTCContainerRef.current.recogniserStreamObject.finalText += " " + event.results[currentFinalPhraseIndex][0].transcript;

                console.log("Final captured text :  ", webRTCContainerRef.current.recogniserStreamObject.finalText)

                // if(props.webRTCContainerRef.current.recogniserStreamObject.stoppedByUser){ // user stopped capture button and response came later, this is the condition
                webRTCContainerRef.current.recogniserStreamObject.isARequestMadeBySTT = false
                // } 



              } else {
                console.log("this was not is isFinal, ignore")
                // ignore, due to api basis
              }
            }
            recogniser.onend = () => {
              if (!webRTCContainerRef.current.recogniserStreamObject.stoppedByUser) {

                try {
                  recogniser.start()
                  webRTCContainerRef.current.recogniserStreamObject.isARequestMadeBySTT = true

                } catch (error) {
                  console.log(error)
                }
              }

            }
            recogniser.onerror = (e) => {
              console.error("Error:", e.error);
            };
            recogniser.onabort = (e) => {
              webRTCContainerRef.current.recogniserStreamObject.recogniser.stream.getTracks().forEach(track => track.stop());
              webRTCContainerRef.current.recogniserStreamObject.recogniser.onresult = null
              webRTCContainerRef.current.recogniserStreamObject.recogniser.onend = null
              webRTCContainerRef.current.recogniserStreamObject.recogniser.onerror = null
              webRTCContainerRef.current.recogniserStreamObject.recogniser = null
              webRTCContainerRef.current.recogniserStreamObject.stoppedByUser = true
              webRTCContainerRef.current.recogniserStreamObject = null
            }



            try {
              recogniser.start()
              webRTCContainerRef.current.recogniserStreamObject.isARequestMadeBySTT = true
              return true
            } catch (error) {
              return false
            }


          }
          button.textContent = "Start STT"
          //lets have some css
          // button.style.background = "#16a34a"
          button.classList.add("hovereffectbtn")
          button.classList.add("elementOnwhichStartStopSTT")

          const resumeVoiceCapture = (elementOnwhichIsFlagOCapturing) => {
            if (!webRTCContainerRef.current.recogniserStreamObject?.stoppedByUser) {
              console.error("not stopped by user, so cannot start")
              return
            };
            try {

              const recogniser = webRTCContainerRef.current.recogniserStreamObject?.recogniser
              if (!recogniser) {
                console.error("recogniser already not exists")
                return
              }
              recogniser.start();
              webRTCContainerRef.current.recogniserStreamObject.isARequestMadeBySTT = true
              webRTCContainerRef.current.recogniserStreamObject.stoppedByUser = false

              elementOnwhichIsFlagOCapturing.textContent = "Stop STT"
              // elementOnwhichIsFlagOCapturing.style.backgroundColor = "#16a34a"
              elementOnwhichIsFlagOCapturing.style.boxShadow = "1px 1px 1px 1px green";
              elementOnwhichIsFlagOCapturing.onclick = () => pauseVoiceCapture(elementOnwhichIsFlagOCapturing)

            } catch (error) {
              elementOnwhichIsFlagOCapturing.textContent = "Start STT"
              elementOnwhichIsFlagOCapturing.style.backgroundColor = "#1f2937"
              elementOnwhichIsFlagOCapturing.style.boxShadow = "1px 1px 1px 1px black";
              elementOnwhichIsFlagOCapturing.onclick = () => resumeVoiceCapture(elementOnwhichIsFlagOCapturing)

            }
          }
          const pauseVoiceCapture = async (elementOnwhichIsFlagOCapturing) => {
            const recogniser = webRTCContainerRef.current.recogniserStreamObject?.recogniser
            if (!recogniser) {
              console.error("recogniser already not exists")
              return
            }
            try {
              recogniser.stop()

            } catch (error) {
              console.error(error)
              return
            }

            elementOnwhichIsFlagOCapturing.textContent = "Start STT"
            elementOnwhichIsFlagOCapturing.style.backgroundColor = "#1f2937"
            elementOnwhichIsFlagOCapturing.style.boxShadow = "1px 1px 1px 1px black";
            webRTCContainerRef.current.recogniserStreamObject.stoppedByUser = true

            const scannedText = document.createElement("div")
            // i will add a slight delay

            //polling

            let loopcounter = 0
            while (webRTCContainerRef.current.recogniserStreamObject.isARequestMadeBySTT) { // this condition will break loop if the onresult last response arrived
              if (loopcounter >= 50) { break }; // this is terminating hardly after 5 seconds preventing very long polling

              await new Promise((resolve) => { // this way i am reducing the high cpu usage of while loop, and nothing else the use of promise
                setTimeout(resolve, 100)
                loopcounter++;
              })

            }

            if(webRTCContainerRef.current.recogniserStreamObject.finalText.length!==0){

              scannedText.textContent = webRTCContainerRef.current.recogniserStreamObject.finalText
              parent.appendChild(scannedText) // i am temporary appending in the chatsdiv these messages

            }


            webRTCContainerRef.current.recogniserStreamObject.finalText = "";

            elementOnwhichIsFlagOCapturing.onclick = () => resumeVoiceCapture(elementOnwhichIsFlagOCapturing)

          }

          button.onclick = async (e) => {

            if (await startVoiceCaptureForSTT()) { // this is starting first time



              button.onclick = () => pauseVoiceCapture(button)
              button.textContent = "Stop STT"
              // button.style.backgroundColor = "#16a34a"
              button.style.boxShadow = "1px 1px 1px 1px green";
            } else {
              button.textContent = "Start STT"
              button.style.backgroundColor = "#1f2937"
              button.style.boxShadow = "1px 1px 1px 1px black";
            }




          }




          if (parent) {
            parent.appendChild(videoDivAndSTTBtnContainer)

          };

          console.log("Receiver track added to sender side element");
        } catch (err) {
          // alert("Error handling incoming track: " + err.message);
          console.error("Error handling incoming track:", err);
        }
      };

      // DATA CHANNEL HANDLER
      if (webRTCContainerRef.current.senderDC) {
        webRTCContainerRef.current.senderDC.onopen = () => {
          console.log("Data channel open");
          try { webRTCContainerRef.current.senderDC.send("Hello Sir"); } catch (err) { alert("Failed to send message: " + err.message); }
        };
        webRTCContainerRef.current.senderDC.onmessage = (e) => {
          console.log("Message from receiver:", e.data);
          // alert(e.data);
        };
        webRTCContainerRef.current.senderDC.onerror = (err) => {
          // alert("Data channel error: " + err.message);
          console.error("Data channel error:", err);
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
            console.error("Failed to send ICE candidate:", err);
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
          d: offer
        }));
      } catch (err) {
        // alert("Failed to create/send offer: " + err.message);
        console.error("Failed to create/send offer:", err);
        return;
      }

      // CONNECTION STATE CHANGE HANDLER
      webRTCContainerRef.current.senderPC.onconnectionstatechange = () => {
        const pc = webRTCContainerRef.current.senderPC;
        if (!pc) return;

        const cleanup = () => {
          try {
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
          console.log("Connection failed/closed, cleaning up");
          cleanup();
        }
      };

    } catch (err) {
      // alert("WebRTC setup failed: " + err.message);
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
