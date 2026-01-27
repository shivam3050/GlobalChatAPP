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


  webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {

    try {
      const cleanup = async () => {
          // Track cleanup
           textToSpeechContainerRef.current?.cleanUp()

          if (webRTCContainerRef.current.senderTC) {
            webRTCContainerRef.current.senderTC.stop();
            // const el = props.webRTCContainerRef.current.streamElementAtReceiver;
            // const parent = props.webRTCContainerRef.current.streamElementParentAtReceiver;
            // if (el && parent && parent.contains(el)) parent.removeChild(el);
            // webRTCContainerRef.current.streamElementAtReceiver = null;
            webRTCContainerRef.current.senderTC = null;
            console.log("Track cleaned up");
          }
          const el = webRTCContainerRef.current.streamElementAtSender;
            const parent = webRTCContainerRef.current.streamElementParentAtSender;
            if (el && parent && parent.contains(el)) parent.removeChild(el);
            webRTCContainerRef.current.streamElementAtSender = null;

          // Data channel cleanup
          if (webRTCContainerRef.current.senderDC) {
            webRTCContainerRef.current.senderDC.close();
            webRTCContainerRef.current.senderDC = null;
            console.log("Data channel closed");
          }

          // Peer connection cleanup
          if (webRTCContainerRef.current.senderPC) {
            webRTCContainerRef.current.senderPC.getSenders().forEach(sender => { if (sender.track) { sender.track.stop(); pc.removeTrack(sender); } });
            webRTCContainerRef.current.senderPC.close();
            webRTCContainerRef.current.senderPC = null;
            console.log("Peer connection closed");
          }

          // Reset button
          rtcbuttonRef.current.style.backgroundColor = "transparent";
          rtcbuttonRef.current.onclick = () => {
            webRTCContainerRef.current.webRTCStartFunction("mediastream");
          };


        };

      if (!socketContainer.current || socketContainer.current.readyState !== 1) {
        alert("WebSocket not ready");
        return;
      }

      // Close existing connection if any
      if (webRTCContainerRef.current.senderPC) {
        if (webRTCContainerRef.current.senderPC.connectionState === "connected") {


          alert("A connection already exists, close it first.");
          return

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

      webRTCContainerRef.current.senderPC = new RTCPeerConnection();
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
          const { success, reused } = await textToSpeechContainerRef.current.initAudioCaptureFunction()
          if (success) {
            try {
              const ttsStream = textToSpeechContainerRef.current.outputStream
              const ttsTrack = ttsStream.getTracks()[0]
              pc.addTrack(ttsTrack, ttsStream)
            } catch (error) {
              console.error("the new error is here")
            }
            // ab later tum speak krwa dena ye on ho chuka hai, forceSpeakWithCaptureAndStream isko call krna hai  bas
          }
        } catch (err) {
          alert("Camera/microphone access denied: " + err.message);
          await cleanup()
          webRTCContainerRef.current.senderPC = null;
          return;
        }
      }

      // Track which streams have been processed
      if (!webRTCContainerRef.current.processedStreams) {
        webRTCContainerRef.current.processedStreams = new Set();
      }

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log("Track received:", event.track.kind);
        const stream = event.streams[0];
        const streamId = stream.id;

        // Check if stream has video track
        const hasVideo = stream.getVideoTracks().length > 0;

        if (event.track.kind === "video") {

          if (webRTCContainerRef.current.streamElementAtSender?.parentNode) {
            webRTCContainerRef.current.streamElementAtSender.remove();
          }

          const el = document.createElement(event.track.kind === "video" ? "video" : "audio");
          el.srcObject = event.streams[0];
          el.autoplay = true;
          el.controls = true;
          el.muted = event.track.kind === "video";
          el.style.zIndex = "20";
          el.style.borderRadius = "calc(5*var(--med-border-radius))"
          el.muted = true;
          el.playsInline = true;
          el.autoplay = true;




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

            if (webRTCContainerRef.current.recogniserStreamObjectRef && webRTCContainerRef.current.recogniserStreamObjectRef.recogniser) {
              alert("a recogniser for stt is already running")
              return false
            }
            alert("recogniser is starting to capture voice")



            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            const recogniser = new SpeechRecognition()

            webRTCContainerRef.current.recogniserStreamObjectRef = { recogniser: recogniser, stoppedByUser: false, finalText: "" }

            recogniser.continuous = true;
            recogniser.interimResults = false;

            recogniser.onresult = (event) => {
              console.log("on result fired")


              const currentFinalPhraseIndex = event.results.length - 1

              console.log(event.results)


              if (event.results[currentFinalPhraseIndex].isFinal) { // this check is for api basis
                webRTCContainerRef.current.recogniserStreamObjectRef.finalText += " " + event.results[currentFinalPhraseIndex][0].transcript;

                console.log("Final captured text :  ", webRTCContainerRef.current.recogniserStreamObjectRef.finalText)

                // if(props.webRTCContainerRef.current.recogniserStreamObject.stoppedByUser){ // user stopped capture button and response came later, this is the condition
                webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT = false
                // } 



              } else {
                console.log("this was not is isFinal, ignore")
                // ignore, due to api basis
              }
            }
            recogniser.onend = () => {
              if (!webRTCContainerRef.current.recogniserStreamObjectRef.stoppedByUser) {

                try {
                  recogniser.start()
                  webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT = true

                } catch (error) {
                  console.log(error)
                }
              }

            }
            recogniser.onerror = (e) => {
              console.error("Error:", e.error);
            };
            recogniser.onabort = (e) => {
              webRTCContainerRef.current.recogniserStreamObjectRef.recogniser.stream.getTracks().forEach(track => track.stop());
              webRTCContainerRef.current.recogniserStreamObjectRef.recogniser.onresult = null
              webRTCContainerRef.current.recogniserStreamObjectRef.recogniser.onend = null
              webRTCContainerRef.current.recogniserStreamObjectRef.recogniser.onerror = null
              webRTCContainerRef.current.recogniserStreamObjectRef.recogniser = null
              webRTCContainerRef.current.recogniserStreamObjectRef.stoppedByUser = true
              webRTCContainerRef.current.recogniserStreamObjectRef = null
            }



            try {
              recogniser.start()
              webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT = true
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
            if (!webRTCContainerRef.current.recogniserStreamObjectRef?.stoppedByUser) {
              console.error("not stopped by user, so cannot start")
              return
            };
            try {

              const recogniser = webRTCContainerRef.current.recogniserStreamObjectRef?.recogniser
              if (!recogniser) {
                console.error("recogniser already not exists")
                return
              }
              recogniser.start();
              webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT = true
              webRTCContainerRef.current.recogniserStreamObjectRef.stoppedByUser = false

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
            const recogniser = webRTCContainerRef.current.recogniserStreamObjectRef?.recogniser
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
            webRTCContainerRef.current.recogniserStreamObjectRef.stoppedByUser = true

            const scannedText = document.createElement("div")
            // i will add a slight delay

            //polling

            let loopcounter = 0
            while (webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT) { // this condition will break loop if the onresult last response arrived
              if (loopcounter >= 50) { break }; // this is terminating hardly after 5 seconds preventing very long polling

              await new Promise((resolve) => { // this way i am reducing the high cpu usage of while loop, and nothing else the use of promise
                setTimeout(resolve, 100)
                loopcounter++;
              })

            }

            if (webRTCContainerRef.current.recogniserStreamObjectRef.finalText.length !== 0) {

              //****************** */ OR HERE I HAVE FINALLY THE EXTRACTED TEXT FORM NOW I CAN DO WHATERVER WITH TEXT ***********************
              // i will send to star ai

              try {
                socketContainer.current.send(JSON.stringify({
                  type: "message",
                  messageSubType: "triple-text-to-ai",
                  message: webRTCContainerRef.current.recogniserStreamObjectRef.finalText,
                  sender: {
                    username: userRef.current.username,
                    id: userRef.current.id,
                    country: userRef.current.country,
                    customAccessToken: userRef.current.customAccessToken
                  },
                  receiver: userRef.current.yourGlobalStarAiReference,

                }));
              } catch (err) {

                console.error("cannot send this triple message", err);
              }


              scannedText.textContent = webRTCContainerRef.current.recogniserStreamObjectRef.finalText
              parent.appendChild(scannedText) // i am temporary appending in the chatsdiv these messages


            }


            webRTCContainerRef.current.recogniserStreamObjectRef.finalText = "";

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

          alert("Receiver track added to sender side element");
          return
          // Prevent duplicate video elements
          // if (webRTCContainerRef.current.streamElementAtSender) {
          //   return;
          // }

          // const video = document.createElement("video");
          // video.srcObject = stream; // Entire stream (includes both video and audio)
          // video.autoplay = true;
          // video.playsInline = true;
          // video.muted = false;
          // video.controls = false;
          // video.style.width = "100%";
          // video.style.borderRadius = "calc(5*var(--med-border-radius))";

          // // Play video with error handling
          // video.play().catch(e => {
          //   console.error("Video play error:", e);
          //   video.onclick = () => video.play();
          // });

          // const container = document.createElement("section");
          // container.style.width = "clamp(100px, 80%, 400px)";
          // container.style.position = "relative";

          // // Add close button
          // const closeBtn = document.createElement("button");
          // closeBtn.textContent = "✖";
          // closeBtn.style.position = "absolute";
          // closeBtn.style.top = "10px";
          // closeBtn.style.right = "10px";
          // closeBtn.style.zIndex = "30";
          // closeBtn.style.backgroundColor = "red";
          // closeBtn.style.color = "white";
          // closeBtn.style.border = "none";
          // closeBtn.style.borderRadius = "50%";
          // closeBtn.style.width = "30px";
          // closeBtn.style.height = "30px";
          // closeBtn.style.cursor = "pointer";
          // closeBtn.onclick = () => {
          //   if (webRTCContainerRef.current.senderPC) {
          //     webRTCContainerRef.current.senderPC.close();
          //     webRTCContainerRef.current.senderPC = null;
          //   }
          //   if (webRTCContainerRef.current.senderStreamsObject) {
          //     webRTCContainerRef.current.senderStreamsObject.getTracks().forEach(t => t.stop());
          //   }
          //   container.remove();
          //   webRTCContainerRef.current.streamElementAtSender = null;
          // };

          // container.appendChild(video);
          // container.appendChild(closeBtn);

          // const parent = document.getElementById("chats-div");
          // if (parent) {
          //   parent.appendChild(container);
          //   parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
          // }

          // webRTCContainerRef.current.streamElementAtSender = container;

          // // Mark this stream as processed (so we don't create separate audio element)
          // webRTCContainerRef.current.processedStreams.add(streamId);
        }

        // Only create separate audio element if:
        // 1. It's an audio track AND
        // 2. The stream has NO video track (standalone audio) AND
        // 3. We haven't already processed this stream
        // if (event.track.kind === "audio" &&
        //   !hasVideo &&
        //   !webRTCContainerRef.current.processedStreams.has(streamId)) {

        //   console.log("Creating standalone audio element");
        //   const audio = document.createElement("audio");
        //   audio.srcObject = stream;
        //   audio.autoplay = true;
        //   audio.play().catch(e => console.error("Audio play error:", e));

        //   // Mark as processed
        //   webRTCContainerRef.current.processedStreams.add(streamId);
        // }
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
      pc.onconnectionstatechange = async  () => {

        console.log("Connection state:", pc.connectionState);

        if (pc.connectionState === "connected") {
          console.log("WebRTC connected!");
          rtcbuttonRef.current.style.backgroundColor = "red";

          rtcbuttonRef.current.onclick = async (e) => {
            e.stopPropagation();
            await cleanup();
          };

        }

        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          await cleanup();
          // if (webRTCContainerRef.current.streamElementAtSender) {
          //   webRTCContainerRef.current.streamElementAtSender.remove();
          //   webRTCContainerRef.current.streamElementAtSender = null;
          // }
          // if (webRTCContainerRef.current.senderStreamsObject) {
          //   webRTCContainerRef.current.senderStreamsObject.getTracks().forEach(t => t.stop());
          // }
          
          // webRTCContainerRef.current.senderPC = null;
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
      await cleanup()
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
