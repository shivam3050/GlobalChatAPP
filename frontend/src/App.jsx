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
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
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
        webRTCContainerRef.current.senderStreamsObject = stream;
        webRTCContainerRef.current.senderTracksContainerArray = stream.getTracks();
        
        // Step 5: Add tracks to peer connection
        webRTCContainerRef.current.senderPC.addTrack(videoTrack, stream);
        alert("Video track added to PC");
        
        webRTCContainerRef.current.senderPC.addTrack(audioTrack, stream);
        alert("Audio track added to PC");

          webRTCContainerRef.current.senderTracksContainerArray = webRTCContainerRef.current.senderStreamsObject.getTracks();

          // webRTCContainerRef.current.senderPC.addTrack(webRTCContainerRef.current.senderStreamsObject.getVideoTracks()[0], webRTCContainerRef.current.senderStreamsObject) // video track sent
          // webRTCContainerRef.current.senderPC.addTrack(webRTCContainerRef.current.senderStreamsObject.getAudioTracks()[0], webRTCContainerRef.current.senderStreamsObject) // audio track sent

          // below is the tts track initialised
          const { success, reused } = await textToSpeechContainerRef.current.initAudioCaptureFunction(); // dont fear about init, if it already exists, it will not reinite it will just use the same
          // by the way here always initilise part will go 

          if (success) {
            const ttsTrack = await textToSpeechContainerRef.current.outputStream.getAudioTracks()[0];
            webRTCContainerRef.current.senderPC.addTrack(ttsTrack, textToSpeechContainerRef.current.outputStream)
            alert("webrtc tts track in succes in app.jsx")
          } else {
            alert("tts track is not addedd in app .jsx")
          }


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
          }

          if(event.transceiver.mid === "1") {
            // call audio // continue
            
            return
          }
    
          if (event.transceiver.mid === "2") {
            //start playing the small audio
            // const ttsAudioEl = new Audio();
            // ttsAudioEl.srcObject = event.streams[0];
            // ttsAudioEl.autoplay = true;
            // ttsAudioEl.play().catch(err => console.error("TTS play failed:", err));
            const audio = document.createElement("audio");
            audio.autoplay = true;
            audio.srcObject = new MediaStream([event.track]);
            audio.muted = false;
            audio.playsInline = true;

            audio.play();
            alert("played the small audio successfully")
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
        // below is the tts track initialised
        const { success, reused } = await textToSpeechContainerRef.current.initAudioCaptureFunction(); // dont fear about init, if it already exists, it will not reinite it will just use the same
        // by the way here always initilise part will go 
    
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
