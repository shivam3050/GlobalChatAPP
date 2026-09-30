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
  console.log("app route is called - GROUP CALL ENABLED")

  const socketContainer = useRef({})
  // const rtcbuttonRef = useRef(null)
  // const rtcStarterFunction = useRef(null)
  const [user, setUser] = useState(null)

  const userRef = useRef(userSchema)
  const chatRef = useRef(chatSchema)
  // const webRTCContainerRef = useRef(webRTCContainerRefSchema)
  const recogniserStreamObjectRef = useRef(speechToTextSchema)
  const textToSpeechContainerRef = useRef(textToSpeechSchema)

  // // GROUP CALL STATE - Enhanced for 3 participants (2 humans + 1 AI)
  // const groupCallStateRef = useRef({
  //   roomId: null,
  //   isActive: false,
  //   participants: new Map(), // userId -> RTCPeerConnection
  //   localStream: null,
  //   remoteStreams: new Map(), // userId -> MediaStream
  //   aiAgent: null, // Special handling for AI participant
  //   maxParticipants: 3
  // });

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
  // const peerRef = useRef(null);
  // const callerChannelRef = useRef(null);
  // const receiverChannelRef = useRef(null);

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

  // ==================== GROUP CALL FUNCTIONS (3 PARTICIPANTS) ====================

  // Create group call room
  // const createGroupCall = async () => {
  //   if (groupCallStateRef.current.isActive) {
  //     alert("Already in a call");
  //     return;
  //   }

  //   const roomId = `room_${Date.now()}_${userRef.current.id}`;
  //   groupCallStateRef.current.roomId = roomId;
  //   groupCallStateRef.current.isActive = true;

  //   socketContainer.current.send(JSON.stringify({
  //     type: "create-group-call",
  //     roomId: roomId,
  //     creator: userRef.current
  //   }));

  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  //       audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  //     });

  //     groupCallStateRef.current.localStream = stream;

  //     // Initialize TTS for AI responses in group call
  //     const { success } = await textToSpeechContainerRef.current.initAudioCaptureFunction();
  //     if (success) {
  //       const ttsStream = textToSpeechContainerRef.current.outputStream;
  //       const ttsTrack = ttsStream.getTracks()[0];
  //       stream.addTrack(ttsTrack);
  //     }

  //     displayLocalVideo(stream);
  //   } catch (err) {
  //     alert("Camera/microphone access denied: " + err.message);
  //     groupCallStateRef.current.isActive = false;
  //   }
  // };

  // Join existing group call
  // const joinGroupCall = async (roomId, participants = []) => {
  //   if (groupCallStateRef.current.isActive) {
  //     alert("Already in a call");
  //     return;
  //   }

  //   if (participants.length >= groupCallStateRef.current.maxParticipants) {
  //     alert("Room is full (maximum 3 participants)");
  //     return;
  //   }

  //   groupCallStateRef.current.roomId = roomId;
  //   groupCallStateRef.current.isActive = true;

  //   socketContainer.current.send(JSON.stringify({
  //     type: "join-group-call",
  //     roomId: roomId,
  //     participant: userRef.current
  //   }));

  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  //       audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  //     });

  //     groupCallStateRef.current.localStream = stream;

  //     const { success } = await textToSpeechContainerRef.current.initAudioCaptureFunction();
  //     if (success) {
  //       const ttsStream = textToSpeechContainerRef.current.outputStream;
  //       const ttsTrack = ttsStream.getTracks()[0];
  //       stream.addTrack(ttsTrack);
  //     }

  //     displayLocalVideo(stream);

  //     // Create peer connections for existing participants
  //     for (const participant of participants) {
  //       if (participant.id !== userRef.current.id) {
  //         await createPeerConnection(participant);
  //       }
  //     }
  //   } catch (err) {
  //     alert("Camera/microphone access denied: " + err.message);
  //     groupCallStateRef.current.isActive = false;
  //   }
  // };

  // Create peer connection for a participant
  // const createPeerConnection = async (participant) => {
  //   const pc = new RTCPeerConnection({
  //     iceServers: [
  //       { urls: 'stun:stun.l.google.com:19302' },
  //       { urls: 'stun:stun1.l.google.com:19302' }
  //     ]
  //   });

  //   // Add local tracks to peer connection
  //   groupCallStateRef.current.localStream.getTracks().forEach(track => {
  //     pc.addTrack(track, groupCallStateRef.current.localStream);
  //   });

  //   // Handle incoming remote tracks
  //   pc.ontrack = (event) => {
  //     console.log(`Track received from ${participant.username}:`, event.track.kind);
  //     const stream = event.streams[0];
  //     groupCallStateRef.current.remoteStreams.set(participant.id, stream);
  //     displayRemoteVideo(stream, participant);
  //   };

  //   // Handle ICE candidates
  //   pc.onicecandidate = (e) => {
  //     if (e.candidate) {
  //       socketContainer.current.send(JSON.stringify({
  //         type: "group-call-webrtc-signal",
  //         roomId: groupCallStateRef.current.roomId,
  //         signalType: "ice",
  //         targetUserId: participant.id,
  //         sender: userRef.current,
  //         candidate: e.candidate
  //       }));
  //     }
  //   };

  //   // Handle connection state changes
  //   pc.onconnectionstatechange = () => {
  //     console.log(`Connection to ${participant.username}:`, pc.connectionState);
      
  //     if (pc.connectionState === "connected") {
  //       console.log(`✅ Connected to ${participant.username}`);
  //     }
      
  //     if (pc.connectionState === "failed" || pc.connectionState === "closed") {
  //       groupCallStateRef.current.participants.delete(participant.id);
  //       removeRemoteVideo(participant.id);
  //     }
  //   };

  //   groupCallStateRef.current.participants.set(participant.id, pc);

  //   // Create and send offer
  //   const offer = await pc.createOffer();
  //   await pc.setLocalDescription(offer);

  //   socketContainer.current.send(JSON.stringify({
  //     type: "group-call-webrtc-signal",
  //     roomId: groupCallStateRef.current.roomId,
  //     signalType: "offer",
  //     targetUserId: participant.id,
  //     sender: userRef.current,
  //     offer: offer
  //   }));

  //   return pc;
  // };

  // Handle WebRTC signaling for group calls
  // const handleGroupCallSignal = async (data) => {
  //   const { signalType, sender, offer, answer, candidate } = data;

  //   if (signalType === "offer") {
  //     // Received offer from another participant
  //     const pc = new RTCPeerConnection({
  //       iceServers: [
  //         { urls: 'stun:stun.l.google.com:19302' },
  //         { urls: 'stun:stun1.l.google.com:19302' }
  //       ]
  //     });

  //     // Add local tracks
  //     groupCallStateRef.current.localStream.getTracks().forEach(track => {
  //       pc.addTrack(track, groupCallStateRef.current.localStream);
  //     });

  //     // Handle incoming tracks
  //     pc.ontrack = (event) => {
  //       console.log(`Track received from ${sender.username}:`, event.track.kind);
  //       const stream = event.streams[0];
  //       groupCallStateRef.current.remoteStreams.set(sender.id, stream);
  //       displayRemoteVideo(stream, sender);
  //     };

  //     // Handle ICE candidates
  //     pc.onicecandidate = (e) => {
  //       if (e.candidate) {
  //         socketContainer.current.send(JSON.stringify({
  //           type: "group-call-webrtc-signal",
  //           roomId: groupCallStateRef.current.roomId,
  //           signalType: "ice",
  //           targetUserId: sender.id,
  //           sender: userRef.current,
  //           candidate: e.candidate
  //         }));
  //       }
  //     };

  //     pc.onconnectionstatechange = () => {
  //       if (pc.connectionState === "failed" || pc.connectionState === "closed") {
  //         groupCallStateRef.current.participants.delete(sender.id);
  //         removeRemoteVideo(sender.id);
  //       }
  //     };

  //     groupCallStateRef.current.participants.set(sender.id, pc);

  //     // Set remote description and create answer
  //     await pc.setRemoteDescription(new RTCSessionDescription(offer));
  //     const answerSdp = await pc.createAnswer();
  //     await pc.setLocalDescription(answerSdp);

  //     // Send answer back
  //     socketContainer.current.send(JSON.stringify({
  //       type: "group-call-webrtc-signal",
  //       roomId: groupCallStateRef.current.roomId,
  //       signalType: "answer",
  //       targetUserId: sender.id,
  //       sender: userRef.current,
  //       answer: answerSdp
  //     }));

  //   } else if (signalType === "answer") {
  //     // Received answer to our offer
  //     const pc = groupCallStateRef.current.participants.get(sender.id);
  //     if (pc) {
  //       await pc.setRemoteDescription(new RTCSessionDescription(answer));
  //     }

  //   } else if (signalType === "ice") {
  //     // Received ICE candidate
  //     const pc = groupCallStateRef.current.participants.get(sender.id);
  //     if (pc) {
  //       try {
  //         await pc.addIceCandidate(new RTCIceCandidate(candidate));
  //       } catch (e) {
  //         console.error("Error adding ICE candidate:", e);
  //       }
  //     }
  //   }
  // };

  // // Display local video in group call
  // const displayLocalVideo = (stream) => {
  //   const parent = document.getElementById("chats-div");
  //   if (!parent) return;

  //   const existing = document.getElementById("local-video-container");
  //   if (existing) existing.remove();

  //   const container = document.createElement("div");
  //   container.id = "local-video-container";
  //   container.style.cssText = `
  //     position: relative;
  //     width: clamp(150px, 32%, 350px);
  //     aspect-ratio: 16/9;
  //     border-radius: calc(3*var(--med-border-radius));
  //     overflow: hidden;
  //     box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
  //     margin: 10px;
  //     border: 2px solid #4CAF50;
  //   `;

  //   const video = document.createElement("video");
  //   video.srcObject = stream;
  //   video.autoplay = true;
  //   video.muted = true;
  //   video.playsInline = true;
  //   video.style.width = "100%";
  //   video.style.height = "100%";
  //   video.style.objectFit = "cover";

  //   const label = document.createElement("div");
  //   label.textContent = "You";
  //   label.style.cssText = `
  //     position: absolute;
  //     bottom: 10px;
  //     left: 10px;
  //     background: rgba(76, 175, 80, 0.9);
  //     color: white;
  //     padding: 5px 12px;
  //     border-radius: 5px;
  //     font-size: 13px;
  //     font-weight: bold;
  //   `;

  //   const leaveButton = document.createElement("button");
  //   leaveButton.textContent = "Leave";
  //   leaveButton.style.cssText = `
  //     position: absolute;
  //     top: 10px;
  //     right: 10px;
  //     padding: 5px 12px;
  //     background: rgba(244, 67, 54, 0.9);
  //     color: white;
  //     border: none;
  //     border-radius: 5px;
  //     cursor: pointer;
  //     font-weight: bold;
  //   `;
  //   leaveButton.onclick = leaveGroupCall;

  //   container.appendChild(video);
  //   container.appendChild(label);
  //   container.appendChild(leaveButton);
  //   parent.appendChild(container);
  // };

  // Display remote video in group call
  // const displayRemoteVideo = (stream, participant) => {
  //   const parent = document.getElementById("chats-div");
  //   if (!parent) return;

  //   const existingId = `remote-video-${participant.id}`;
  //   const existing = document.getElementById(existingId);
  //   if (existing) existing.remove();

  //   const container = document.createElement("div");
  //   container.id = existingId;
  //   const isAI = participant.username === "StarAI";
  //   container.style.cssText = `
  //     position: relative;
  //     width: clamp(150px, 32%, 350px);
  //     aspect-ratio: 16/9;
  //     border-radius: calc(3*var(--med-border-radius));
  //     overflow: hidden;
  //     box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
  //     margin: 10px;
  //     border: 2px solid ${isAI ? '#FF9800' : '#2196F3'};
  //   `;

  //   const video = document.createElement("video");
  //   video.srcObject = stream;
  //   video.autoplay = true;
  //   video.playsInline = true;
  //   video.style.width = "100%";
  //   video.style.height = "100%";
  //   video.style.objectFit = "cover";

  //   const label = document.createElement("div");
  //   label.textContent = participant.username;
  //   label.style.cssText = `
  //     position: absolute;
  //     bottom: 10px;
  //     left: 10px;
  //     background: ${isAI ? 'rgba(255, 152, 0, 0.9)' : 'rgba(33, 150, 243, 0.9)'};
  //     color: white;
  //     padding: 5px 12px;
  //     border-radius: 5px;
  //     font-size: 13px;
  //     font-weight: bold;
  //   `;

  //   // Add STT control for AI participant
  //   if (isAI) {
  //     const sttButton = document.createElement("button");
  //     sttButton.textContent = "🎤 Start STT";
  //     sttButton.style.cssText = `
  //       position: absolute;
  //       top: 10px;
  //       right: 10px;
  //       padding: 6px 12px;
  //       background: rgba(76, 175, 80, 0.9);
  //       color: white;
  //       border: none;
  //       border-radius: 5px;
  //       cursor: pointer;
  //       font-weight: bold;
  //       font-size: 12px;
  //     `;
      
  //     let isCapturing = false;
  //     sttButton.onclick = async () => {
  //       if (!isCapturing) {
  //         const success = await startSTTForAI();
  //         if (success) {
  //           sttButton.textContent = "🛑 Stop STT";
  //           sttButton.style.background = "rgba(244, 67, 54, 0.9)";
  //           isCapturing = true;
  //         }
  //       } else {
  //         await stopSTTForAI();
  //         sttButton.textContent = "🎤 Start STT";
  //         sttButton.style.background = "rgba(76, 175, 80, 0.9)";
  //         isCapturing = false;
  //       }
  //     };
      
  //     container.appendChild(sttButton);

  //     // Add AI indicator badge
  //     const aiBadge = document.createElement("div");
  //     aiBadge.textContent = "🤖 AI";
  //     aiBadge.style.cssText = `
  //       position: absolute;
  //       top: 10px;
  //       left: 10px;
  //       background: rgba(255, 152, 0, 0.9);
  //       color: white;
  //       padding: 4px 10px;
  //       border-radius: 5px;
  //       font-size: 11px;
  //       font-weight: bold;
  //     `;
  //     container.appendChild(aiBadge);
  //   }

  //   container.appendChild(video);
  //   container.appendChild(label);
  //   parent.appendChild(container);
  // };

  // Remove remote video element
  // const removeRemoteVideo = (participantId) => {
  //   const video = document.getElementById(`remote-video-${participantId}`);
  //   if (video) video.remove();
  // };

  // Start Speech-to-Text for AI interaction
  // const startSTTForAI = async () => {
  //   if (recogniserStreamObjectRef.current?.recogniser) {
  //     console.error("STT already running");
  //     return false;
  //   }

  //   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  //   if (!SpeechRecognition) {
  //     alert("Speech recognition not supported in this browser");
  //     return false;
  //   }

  //   const recogniser = new SpeechRecognition();

  //   recogniserStreamObjectRef.current = {
  //     recogniser: recogniser,
  //     stoppedByUser: false,
  //     finalText: "",
  //     isARequestMadeBySTT: false
  //   };

  //   recogniser.continuous = true;
  //   recogniser.interimResults = false;

  //   recogniser.onresult = (event) => {
  //     const currentFinalPhraseIndex = event.results.length - 1;
      
  //     if (event.results[currentFinalPhraseIndex].isFinal) {
  //       const transcript = event.results[currentFinalPhraseIndex][0].transcript;
  //       recogniserStreamObjectRef.current.finalText += " " + transcript;

  //       console.log("Sending to AI in group call:", transcript);

  //       // Send transcribed speech to AI in group call
  //       socketContainer.current.send(JSON.stringify({
  //         type: "group-call-speech-input",
  //         roomId: groupCallStateRef.current.roomId,
  //         transcript: transcript,
  //         sender: userRef.current
  //       }));

  //       recogniserStreamObjectRef.current.isARequestMadeBySTT = false;
  //     }
  //   };

  //   recogniser.onend = () => {
  //     if (!recogniserStreamObjectRef.current.stoppedByUser) {
  //       try {
  //         recogniser.start();
  //         recogniserStreamObjectRef.current.isARequestMadeBySTT = true;
  //       } catch (error) {
  //         console.log("STT restart error:", error);
  //       }
  //     }
  //   };

  //   recogniser.onerror = (e) => {
  //     console.error("STT Error:", e.error);
  //   };

  //   try {
  //     recogniser.start();
  //     recogniserStreamObjectRef.current.isARequestMadeBySTT = true;
  //     return true;
  //   } catch (error) {
  //     console.error("Failed to start STT:", error);
  //     return false;
  //   }
  // };

  // Stop Speech-to-Text
  // const stopSTTForAI = async () => {
  //   const recogniser = recogniserStreamObjectRef.current?.recogniser;
  //   if (!recogniser) return;

  //   try {
  //     recogniser.stop();
  //     recogniserStreamObjectRef.current.stoppedByUser = true;

  //     // Wait for final response with timeout
  //     let loopCounter = 0;
  //     while (recogniserStreamObjectRef.current?.isARequestMadeBySTT) {
  //       if (loopCounter >= 50) break; // 5 second timeout
  //       await new Promise(resolve => setTimeout(resolve, 100));
  //       loopCounter++;
  //     }

  //     recogniserStreamObjectRef.current = null;
  //   } catch (error) {
  //     console.error("Error stopping STT:", error);
  //   }
  // };

  // Leave group call and cleanup
  // const leaveGroupCall = async () => {
  //   if (!groupCallStateRef.current.isActive) return;

  //   console.log("Leaving group call...");

  //   // Close all peer connections
  //   groupCallStateRef.current.participants.forEach(pc => {
  //     pc.close();
  //   });
  //   groupCallStateRef.current.participants.clear();

  //   // Stop local stream
  //   if (groupCallStateRef.current.localStream) {
  //     groupCallStateRef.current.localStream.getTracks().forEach(track => track.stop());
  //     groupCallStateRef.current.localStream = null;
  //   }

  //   // Remove all video elements
  //   document.getElementById("local-video-container")?.remove();
  //   groupCallStateRef.current.remoteStreams.forEach((stream, id) => {
  //     removeRemoteVideo(id);
  //   });
  //   groupCallStateRef.current.remoteStreams.clear();

  //   // Stop STT if active
  //   await stopSTTForAI();

  //   // Notify server
  //   socketContainer.current.send(JSON.stringify({
  //     type: "leave-group-call",
  //     roomId: groupCallStateRef.current.roomId,
  //     participant: userRef.current
  //   }));

  //   groupCallStateRef.current.roomId = null;
  //   groupCallStateRef.current.isActive = false;
  //   groupCallStateRef.current.aiAgent = null;

  //   alert("Left group call");
  // };

  // ==================== STANDARD 1-on-1 WebRTC ====================

  // webRTCContainerRef.current.webRTCStartFunction = async (motive = null) => {
  //   try {
  //     const cleanup = async () => {
  //       textToSpeechContainerRef.current?.cleanUp()

  //       if (webRTCContainerRef.current.senderTC) {
  //         webRTCContainerRef.current.senderTC.stop();
  //         webRTCContainerRef.current.senderTC = null;
  //       }
        
  //       const el = webRTCContainerRef.current.streamElementAtSender;
  //       const parent = webRTCContainerRef.current.streamElementParentAtSender;
  //       if (el && parent && parent.contains(el)) parent.removeChild(el);
  //       webRTCContainerRef.current.streamElementAtSender = null;

  //       if (webRTCContainerRef.current.senderDC) {
  //         webRTCContainerRef.current.senderDC.close();
  //         webRTCContainerRef.current.senderDC = null;
  //       }

  //       if (webRTCContainerRef.current.senderPC) {
  //         webRTCContainerRef.current.senderPC.getSenders().forEach(sender => {
  //           if (sender.track) sender.track.stop();
  //         });
  //         webRTCContainerRef.current.senderPC.close();
  //         webRTCContainerRef.current.senderPC = null;
  //       }

  //       rtcbuttonRef.current.style.backgroundColor = "transparent";
  //       rtcbuttonRef.current.onclick = () => {
  //         webRTCContainerRef.current.webRTCStartFunction("mediastream");
  //       };
  //     };

  //     if (!socketContainer.current || socketContainer.current.readyState !== 1) {
  //       alert("WebSocket not ready");
  //       return;
  //     }

  //     if (webRTCContainerRef.current.senderPC?.connectionState === "connected") {
  //       alert("A connection already exists");
  //       return;
  //     }

  //     webRTCContainerRef.current.senderPC = new RTCPeerConnection();
  //     const pc = webRTCContainerRef.current.senderPC;

  //     if (motive === "mediastream") {
  //       try {
  //         const stream = await navigator.mediaDevices.getUserMedia({
  //           video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  //           audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  //         });

  //         webRTCContainerRef.current.senderStreamsObject = stream;

  //         stream.getTracks().forEach(track => pc.addTrack(track, stream));
          
  //         const { success } = await textToSpeechContainerRef.current.initAudioCaptureFunction();
  //         if (success) {
  //           const ttsTrack = textToSpeechContainerRef.current.outputStream.getTracks()[0];
  //           pc.addTrack(ttsTrack, textToSpeechContainerRef.current.outputStream);
  //         }
  //       } catch (err) {
  //         alert("Media access denied: " + err.message);
  //         await cleanup();
  //         return;
  //       }
  //     }

  //     pc.ontrack = (event) => {
  //       if (event.track.kind === "video") {
  //         const el = document.createElement("video");
  //         el.srcObject = event.streams[0];
  //         el.autoplay = true;
  //         el.controls = true;
  //         el.muted = true;
  //         el.style.width = "100%";

  //         const parent = document.getElementById("chats-div");
  //         if (parent) parent.appendChild(el);

  //         webRTCContainerRef.current.streamElementAtSender = el;
  //       }
  //     };

  //     pc.onicecandidate = (e) => {
  //       if (e.candidate) {
  //         socketContainer.current.send(JSON.stringify({
  //           type: "query-message",
  //           queryType: "ice",
  //           sender: userRef.current,
  //           receiver: userRef.current.focusedContact,
  //           d: e.candidate
  //         }));
  //       }
  //     };

  //     pc.onconnectionstatechange = async () => {
  //       if (pc.connectionState === "connected") {
  //         rtcbuttonRef.current.style.backgroundColor = "red";
  //         rtcbuttonRef.current.onclick = async (e) => {
  //           e.stopPropagation();
  //           await cleanup();
  //         };
  //       }

  //       if (pc.connectionState === "failed" || pc.connectionState === "closed") {
  //         await cleanup();
  //       }
  //     };

  //     const offer = await pc.createOffer();
  //     await pc.setLocalDescription(offer);

  //     socketContainer.current.send(JSON.stringify({
  //       type: "query-message",
  //       queryType: "offer",
  //       sender: userRef.current,
  //       receiver: userRef.current.focusedContact,
  //       d: offer
  //     }));

  //   } catch (err) {
  //     console.error("WebRTC error:", err);
  //   }
  // };

  // // Expose group call functions to components
  // webRTCContainerRef.current.createGroupCall = createGroupCall;
  // webRTCContainerRef.current.joinGroupCall = joinGroupCall;
  // webRTCContainerRef.current.leaveGroupCall = leaveGroupCall;
  // webRTCContainerRef.current.handleGroupCallSignal = handleGroupCallSignal;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home
          socketContainer={socketContainer}
          // webRTCContainerRef={webRTCContainerRef}
          recogniserStreamObjectRef={recogniserStreamObjectRef}
          textToSpeechContainerRef={textToSpeechContainerRef}
          // rtcbuttonRef={rtcbuttonRef}
          // rtcStarterFunction={rtcStarterFunction}
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
          // peerRef={peerRef}
          // callerChannelRef={callerChannelRef}
          // receiverChannelRef={receiverChannelRef}
          // groupCallStateRef={groupCallStateRef}
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
      </Routes>
    </Router>
  )
}

export default App