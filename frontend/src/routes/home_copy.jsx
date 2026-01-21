
import { aiProfile, countries } from "../controllers/allCountries.js";
import { useState } from "react";

import Loading from "../utilitiesCompo/loading";
import { Outlet, useNavigate } from "react-router-dom";
import { useRef } from "react";

import { startChromeOfflineVoiceRecognition } from "../utilitiesCompo/toolFunctions.js";


export function Home(props) {

    // states to update only ui and none
    const [selectedReceiver, setSelectedReceiver] = useState({ username: "", gender: "", age: null, id: "" })

    const [headerTitle, setHeaderTitle] = useState("Globet")

    const [toggleSelect, setToggleSelect] = useState(false)

    const inboxIconRef = useRef(null)

    const typingFlagRef = useRef({ setTimeoutId: null, element: null })

    const [signInLoadingFlag, setSignInLoadingFlag] = useState(false)

    const [signInErrorLog, setSignInErrorLog] = useState("")








    const navigate = useNavigate()










    const initializeConnection = (
        e,
        socketContainer,
        user,
        setUser,
        userRef,
        chatRef
    ) => {



        e.preventDefault()

        setSignInLoadingFlag(true)


        const formData = new FormData(e.currentTarget);
        const username = formData.get("username")
        // const age = formData.get("age")
        // const gender = formData.get("gender")
        const country = formData.get("country")
        const label = e.currentTarget.lastElementChild;

        //prechecking about correctness of data
        label.style.visibility = "visible"

        for (let i = 0; i < username.length; i++) {

            if (username[i] === ' ') {

                setSignInLoadingFlag(false)
                setSignInErrorLog("no spaces allowed in username")

                return
            }
        }






        try {
            // socketContainer.current = new WebSocket(`${import.meta.env.VITE_BACKEND_WS_URL}/?username=${username}&age=${age}&gender=${gender}&country=${encodeURIComponent(country)}`)
            socketContainer.current = new WebSocket(`${import.meta.env.VITE_BACKEND_WS_URL}/?username=${username}&country=${encodeURIComponent(country)}`)
            socketContainer.current.binaryType = "arraybuffer";
        } catch (error) {

            setSignInLoadingFlag(false)
            setSignInErrorLog("unknown error")
            console.error(error)
            alert("socket is absent in home.jsx")
            return
        }

        socketContainer.current.onopen = () => {

        }

        socketContainer.current.onclose = (event) => {
            console.error(event.reason)
            setSignInLoadingFlag(false)
            setSignInErrorLog(event.reason)
            return
        }
        socketContainer.current.onerror = (event) => {
            console.error(event.reason)
            setSignInLoadingFlag(false)
            setSignInErrorLog(event.reason)
            return
        }

        socketContainer.current.onmessage = async (message) => {

            if (typeof message.data === "string") {

                setSignInLoadingFlag(false)
                setSignInErrorLog("")
                let data = null
                try {
                    data = JSON.parse(message.data)
                } catch (error) {
                    console.error(error)
                    return
                }

                if (data.type === "register") {


                    // set here full screen mode 
                    // const elem = document.documentElement;
                    // if (elem.requestFullscreen) {
                    //     elem.requestFullscreen();
                    // } else if (elem.webkitRequestFullscreen) { // Safari
                    //     elem.webkitRequestFullscreen();
                    // } else if (elem.msRequestFullscreen) { // IE11
                    //     elem.msRequestFullscreen();
                    // }

                    //




                    // here is the structure



                    userRef.current = {

                        username: data.username,

                        // age: data.age,

                        // gender: data.gender,

                        country: data.country,

                        id: data.id,

                        customAccessToken: data.customAccessToken,

                        yourGlobalStarAiReference: (data.availableUsers[0]["username"] === "StarAI") ?
                            {
                                ...data.availableUsers[0],
                                transcriptinput: "",
                                isAiCallingOn: { instance: null, flag: false },
                                textoutput: "",
                                unread: false

                            } : {
                                username: "",
                                id: "",
                                // age: null,
                                // gender: "",
                                country: "",
                                transcriptinput: "",
                                isAiCallingOn: { instance: null, flag: false },
                                textoutput: "",
                                unread: false
                            },

                        availableConnectedUsersUnreadLength: 0,

                        availableUsers: data.availableUsers || [],

                        availableConnectedUsers: []
                    }
                    console.log("first time variable set all users also there ,", data.availableUsers)





                    setUser(data.username)
                    return
                }

                if (data.type === "query-message") {

                    if (data.query === "refresh-all-user") {


                        userRef.current.availableUsers = data.msg || []

                        console.log("from home route ", userRef.current.availableUsers)



                        if (userRef.current.availableUsers) {

                            props.setRefreshGlobalUsersFlag(prev => prev + 1)

                            navigate("/users")

                            setHeaderTitle("Globet")

                        }

                        return
                    }
                    if (data.query === "chat-list-demand") {


                        if (data.sender.id !== userRef.current.id) {
                            //this is not for me  which i have queried when click on a user
                            console.error("query respose is not for me, someone else queried")
                            return
                        }

                        // this is my answer of query





                        if (data.status === "failed") {

                            props.setChatsOverlay(true)

                            userRef.current.focusedContact = {}

                            chatRef.current.sender = data.sender;

                            chatRef.current.receiver = data.receiver;

                            chatRef.current.availableChats = []

                            navigate("/chats")

                            setHeaderTitle("")

                            return
                        }


                        //below is for success

                        // here is the structure

                        props.setChatsOverlay(false)


                        userRef.current.focusedContact = data.receiver

                        setSelectedReceiver(userRef.current.focusedContact)

                        chatRef.current.availableChats = []

                        chatRef.current.sender = data.sender;

                        chatRef.current.receiver = data.receiver;




                        if (data.msg.length) {

                            chatRef.current.availableChats = data.msg

                        }
                        console.log("home but chat part line 285,", chatRef.current.availableChats)




                        setSelectedReceiver(userRef.current.focusedContact)


                        props.setRefreshChatsFlag(prev => prev + 1)

                        navigate("/chats")

                        // userRef.current.availableUsers.unread = false

                        return
                    }

                    if (data.query === "offer") {
                        try {

                            if (props.webRTCContainerRef.current.senderPC) {
                                alert("Sorry, already a connection");
                                return;
                            }
                            alert("a offer came here and new connection from recceiver home.jsx will be set")


                            const pc = new RTCPeerConnection();
                            props.webRTCContainerRef.current.senderPC = pc;


                            let stream = props.webRTCContainerRef.current.senderStreamsObject;

                            if (!stream || !stream.getVideoTracks()[0] || stream.getVideoTracks()[0].readyState !== "live") {
                                try {
                                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                                    props.webRTCContainerRef.current.senderStreamsObject = stream;
                                    alert("Capturing new stream audio and video at receiver");
                                } catch (err) {
                                    alert("Camera capture unavailable at home.jsx at reciver:", err.name);
                                    return; // HARD STOP
                                }
                            } else {
                                alert("using the existing camera stream at camera capture at receiver in home.jsx");
                            }


                            const tracksArray = stream.getTracks();

                            props.webRTCContainerRef.current.senderTracksContainerArray = tracksArray;



                            // pc.addTrack(stream.getVideoTracks()[0], stream) // video
                            // pc.addTrack(stream.getAudioTracks()[0], stream) // audio
                            // alert("added both the tracks from receiver from home.jsx")


                            const videoTrack = props.webRTCContainerRef.current.senderStreamsObject.getVideoTracks()[0];
        const audioTrack = props.webRTCContainerRef.current.senderStreamsObject.getAudioTracks()[0];
        
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
    
        props.webRTCContainerRef.current.senderTracksContainerArray = props.webRTCContainerRef.current.senderStreamsObject.getTracks();
        
        // Step 5: Add tracks to peer connection
        props.webRTCContainerRef.current.senderPC.addTrack(videoTrack, props.webRTCContainerRef.current.senderStreamsObject);
        alert("Video track added to PC");
        
        props.webRTCContainerRef.current.senderPC.addTrack(audioTrack, props.webRTCContainerRef.current.senderStreamsObject);
        alert("Audio track added to PC");

          props.webRTCContainerRef.current.senderTracksContainerArray = props.webRTCContainerRef.current.senderStreamsObject.getTracks();



// ADD TTS TRACK HERE - BEFORE creating answer
alert(" Initializing TTS on receiver side...");
const { success, reused } = await props.textToSpeechContainerRef.current.initAudioCaptureFunction();

if (success) {
    alert("success from home.jsx init audio capture got success")
  const ttsTrack = props.textToSpeechContainerRef.current.outputStream.getAudioTracks()[0];
  if (ttsTrack) {
    pc.addTrack(ttsTrack, props.textToSpeechContainerRef.current.outputStream);
    alert("TTS track added from receiver side");
  } else {
    alert(" TTS track not available on receiver");
  }
} else {
  alert(" TTS initialization failed on receiver");
}





                            pc.ontrack = (event) => {
                                alert("a track came to receiver side")
                                alert("see the tracks kind> ",event.track.kind)
                                if (event.transceiver.mid === "0") {
                                    //video is coming
                                    if (props.webRTCContainerRef.current.streamElementAtReceiver?.parentNode) {
                                        props.webRTCContainerRef.current.streamElementAtReceiver.remove();
                                    }

                                    const el = document.createElement(event.track.kind);
                                    el.style.zIndex = "20";
                                    el.style.width = "100%";
                                    el.style.borderRadius = "calc(5*var(--med-border-radius))"
                                    el.autoplay = true;
                                    el.controls = true;
                                    el.playsInline = true;
                                    el.srcObject = event.streams[0];
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


                                    props.webRTCContainerRef.current.streamElementAtReceiver = videoDivAndSTTBtnContainer;
                                    props.webRTCContainerRef.current.senderTC = event.track;








                                    const parent = document.getElementById("chats-div"); // THIS NEEDS TO BE CHANGED WHERE YOU WANT TO PUT THIS ELEMENT OF RECEIVER SIDE

                                    const startVoiceCaptureForSTT = async () => {

                                        if (props.recogniserStreamObjectRef && props.recogniserStreamObjectRef?.current?.recogniser) {
                                            console.error("a recogniser for stt is already running")
                                            return false
                                        }



                                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

                                        const recogniser = new SpeechRecognition()

                                        props.recogniserStreamObjectRef.current = { recogniser: recogniser, stoppedByUser: false, finalText: "", isARequestMadeBySTT: false }

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
                                                props.recogniserStreamObjectRef.current.finalText += " " + event.results[currentFinalPhraseIndex][0].transcript;

                                                console.log("Final captured text :  ", props.recogniserStreamObjectRef.current.finalText)

                                                // if(props.webRTCContainerRef.current.recogniserStreamObject.stoppedByUser){ // user stopped capture button and response came later, this is the condition
                                                props.recogniserStreamObjectRef.current.isARequestMadeBySTT = false
                                                // } 



                                            } else {
                                                console.log("this was not is isFinal, ignore")
                                                // ignore, due to api basis
                                            }
                                        }
                                        recogniser.onend = () => {
                                            if (!props.recogniserStreamObjectRef.current.stoppedByUser) {

                                                try {
                                                    recogniser.start()
                                                    props.recogniserStreamObjectRef.current.isARequestMadeBySTT = true

                                                } catch (error) {
                                                    console.log(error)
                                                }
                                            }

                                        }
                                        recogniser.onerror = (e) => {
                                            console.error("Error:", e.error);
                                        };
                                        recogniser.onabort = (e) => {
                                            props.recogniserStreamObjectRef.current.recogniser.stream.getTracks().forEach(track => track.stop());
                                            props.recogniserStreamObjectRef.current.recogniser.onresult = null
                                            props.recogniserStreamObjectRef.current.recogniser.onend = null
                                            props.recogniserStreamObjectRef.current.recogniser.onerror = null
                                            props.recogniserStreamObjectRef.current.recogniser = null
                                            props.recogniserStreamObjectRef.current.stoppedByUser = true
                                            props.recogniserStreamObjectRef.current = null
                                        }



                                        try {
                                            recogniser.start()
                                            props.recogniserStreamObjectRef.current.isARequestMadeBySTT = true
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
                                        if (!props.recogniserStreamObjectRef.current?.stoppedByUser) {
                                            console.error("not stopped by user, so cannot start")
                                            return
                                        };
                                        try {

                                            const recogniser = props.recogniserStreamObjectRef.current?.recogniser
                                            if (!recogniser) {
                                                console.error("recogniser already not exists")
                                                return
                                            }
                                            recogniser.start();
                                            props.recogniserStreamObjectRef.current.isARequestMadeBySTT = true
                                            props.recogniserStreamObjectRef.current.stoppedByUser = false

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
                                        const recogniser = props.recogniserStreamObjectRef.current?.recogniser
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
                                        props.recogniserStreamObjectRef.current.stoppedByUser = true

                                        // i will add a slight delay

                                        //polling

                                        let loopcounter = 0
                                        while (props.recogniserStreamObjectRef.current.isARequestMadeBySTT) { // this condition will break loop if the onresult last response arrived
                                            if (loopcounter >= 50) { break }; // this is terminating hardly after 5 seconds preventing very long polling

                                            await new Promise((resolve) => { // this way i am reducing the high cpu usage of while loop, and nothing else the use of promise
                                                setTimeout(resolve, 100)
                                                loopcounter++;
                                            })

                                        }


                                        if (props.recogniserStreamObjectRef.current.finalText.length !== 0) {

                                            //****************** */ OR HERE I HAVE FINALLY THE EXTRACTED TEXT FORM NOW I CAN DO WHATERVER WITH TEXT ***********************

                                            const scannedText = document.createElement("div")
                                            scannedText.textContent = props.recogniserStreamObjectRef.current.finalText
                                            //props.textToSpeechContainerRef.current.forceSpeakFunction(props.recogniserStreamObject.current.finalText)
                                            parent.appendChild(scannedText) // i am temporary appending in the chatsdiv these messages
                                        }

                                        props.recogniserStreamObjectRef.current.finalText = "";

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


                                    props.webRTCContainerRef.current.streamElementParentAtReceiver = parent;

                                    if (parent) {

                                        parent.appendChild(videoDivAndSTTBtnContainer);



                                    };

                           

                                    setTimeout(() => el.play().catch(err => console.error("Playback failed:", err)), 100);

                                    return

                                }
                                if (event.transceiver.mid === "1") {
                                    // first audio main call
                                    return // continue
                                }
                                if (event.transceiver.mid === "2") {
                                    // tts audio
                                    const audio = document.createElement("audio");
                                    audio.autoplay = true;
                                    audio.srcObject = new MediaStream([event.track]);
                                    audio.muted = false;
                                    audio.playsInline = true;

                                    audio.play();
                                    alert("played the small audio successfully at receiver side in home.jsx")
                                    return
                                }
                                return

                            };



                            // Reliable (guaranteed delivery, ordered)
                            // const dataChannel = pc.createDataChannel("myChannel", {
                            //     ordered: true,   // packets arrive in order
                            //     maxRetransmits: null // unlimited retries → fully reliable
                            // });

                            pc.ondatachannel = (event) => {
                                const dc = event.channel;
                                props.webRTCContainerRef.current.senderDC = dc;

                                dc.onopen = () => {
                                    console.log("Data channel open (receiver)");
                                    dc.send("Hello back Sir");
                                };
                                dc.onmessage = e => { console.log("Message from sender:", e.data); alert(e.data); };
                                dc.onerror = err => console.error("DataChannel error:", err);
                            };


                            pc.onicecandidate = (e) => {
                                if (e.candidate) {
                                    try {
                                        props.socketContainer.current.send(JSON.stringify({
                                            type: "query-message",
                                            queryType: "ice",
                                            sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country, customAccessToken: props.userRef.current.customAccessToken },
                                            receiver: props.userRef.current.focusedContact,
                                            d: e.candidate
                                        }));
                                    } catch (err) { console.error("Failed to send ICE candidate:", err); }
                                }
                            };




                            await pc.setRemoteDescription(data.d);
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);



                            props.socketContainer.current.send(JSON.stringify({
                                type: "query-message",
                                sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country, customAccessToken: props.userRef.current.customAccessToken },
                                receiver: props.userRef.current.focusedContact,
                                queryType: "answer",
                                d: answer,

                            }));


                            pc.onconnectionstatechange = () => {
                                const state = pc.connectionState;
                                console.log("Connection state:", state);

                                const cleanup = () => {
                                    // Track cleanup
                                    props.textToSpeechContainerRef.current.cleanUp()

                                    if (props.webRTCContainerRef.current.senderTC) {
                                        props.webRTCContainerRef.current.senderTC.stop();
                                        const el = props.webRTCContainerRef.current.streamElementAtReceiver;
                                        const parent = props.webRTCContainerRef.current.streamElementParentAtReceiver;
                                        if (el && parent && parent.contains(el)) parent.removeChild(el);
                                        props.webRTCContainerRef.current.streamElementAtReceiver = null;
                                        props.webRTCContainerRef.current.senderTC = null;
                                        console.log("Track cleaned up");
                                    }

                                    // Data channel cleanup
                                    if (props.webRTCContainerRef.current.senderDC) {
                                        props.webRTCContainerRef.current.senderDC.close();
                                        props.webRTCContainerRef.current.senderDC = null;
                                        console.log("Data channel closed");
                                    }

                                    // Peer connection cleanup
                                    if (props.webRTCContainerRef.current.senderPC) {
                                        props.webRTCContainerRef.current.senderPC.getSenders().forEach(sender => { if (sender.track) { sender.track.stop(); pc.removeTrack(sender); } });
                                        props.webRTCContainerRef.current.senderPC.close();
                                        props.webRTCContainerRef.current.senderPC = null;
                                        console.log("Peer connection closed");
                                    }

                                    // Reset button
                                    props.rtcbuttonRef.current.style.backgroundColor = "transparent";
                                    props.rtcbuttonRef.current.onclick = () => {
                                        props.webRTCContainerRef.current.webRTCStartFunction("mediastream");
                                    };


                                };

                                if (state === "connected") {
                                    console.log("✅ Peer connection SUCCESS!");
                                    props.rtcbuttonRef.current.style.backgroundColor = "red";

                                    props.rtcbuttonRef.current.onclick = (e) => {
                                        e.stopPropagation();
                                        cleanup();
                                    };
                                }

                                if (state === "failed" || state === "closed") {
                                    console.log("Connection failed/closed");
                                    cleanup();
                                }
                            };

                        } catch (err) {
                            console.error("Receiver WebRTC setup failed:", err);
                        }
                        return;
                    }

                    if (data.query === "ice") {
                        const pc = props.webRTCContainerRef.current.senderPC;

                        if (!pc) {
                            console.error("No peer connection to add ICE candidate to");
                            // alert("No peer connection to add ICE candidate to")
                            return;
                        }

                        try {
                            // Agar remote description nahi hai, ICE candidate ko queue me daal do
                            if (!pc.remoteDescription || !pc.remoteDescription.type) {
                                if (!props.webRTCContainerRef.current.iceQueue) {
                                    props.webRTCContainerRef.current.iceQueue = [];
                                }
                                props.webRTCContainerRef.current.iceQueue.push(data.d);
                                console.log("Remote description not set yet, ICE queued", data.d);
                                //  alert("Remote description not set yet, ICE queued")
                            } else {
                                await pc.addIceCandidate(new RTCIceCandidate(data.d));
                                console.log("ICE candidate added successfully:", data.d);

                            }
                        } catch (err) {
                            console.error("Failed to add ICE candidate:", err);
                            // alert("Failed to add ICE candidate:")
                        }
                        return;
                    }


                    if (data.query === "answer") {
                        const pc = props.webRTCContainerRef.current.senderPC;

                        if (!pc) {
                            console.error("Cannot set remote description: peer connection missing");
                            // alert("Cannot set remote description: peer connection missing")
                            return;
                        }

                        try {
                            await pc.setRemoteDescription(new RTCSessionDescription(data.d));
                            console.log("Remote description (answer) applied");



                            // Agar ICE candidates queue me hain, ab unhe add karo
                            if (props.webRTCContainerRef.current.iceQueue?.length) {
                                for (const ice of props.webRTCContainerRef.current.iceQueue) {
                                    try {
                                        await pc.addIceCandidate(new RTCIceCandidate(ice));
                                        console.log("Queued ICE candidate added:", ice);
                                    } catch (e) {
                                        console.error("Failed to add queued ICE:", e);
                                        // alert("Failed to add queued ICE:")
                                    }
                                }
                                // Clear queue
                                props.webRTCContainerRef.current.iceQueue = [];
                            }
                        } catch (err) {
                            console.error("Failed to set remote description (answer):", err);
                            // alert("Failed to set remote description (answer):")
                        }
                        return;
                    }


                    // if (data.query === "ice") {



                    //     if (!props.webRTCContainerRef.current.senderPC) {
                    //         console.error("No peer connection to add ICE candidate to");
                    //         return;
                    //     }

                    //     try {
                    //         console.log("came in try case")
                    //         console.log("consoling data.d in query ice, ", data.d)
                    //         await props.webRTCContainerRef.current.senderPC.addIceCandidate(new RTCIceCandidate(data.d));
                    //         console.log("ICE candidate added successfully");
                    //     } catch (err) {
                    //         console.error("Failed to add ICE candidate:", err);
                    //     }
                    //     return
                    // }
                    // if (data.query === "answer") {

                    //     if (!props.webRTCContainerRef.current.senderPC) {
                    //         console.error("cannot continue in this answer query.")
                    //         return

                    //     };

                    //     // Set the remote description so WebRTC can finalize the connection
                    //     props.webRTCContainerRef.current.senderPC.setRemoteDescription(new RTCSessionDescription(data.d))
                    //         .then(() => {
                    //             console.log("Remote description (answer) applied, connection should complete");
                    //         })
                    //         .catch(err => console.error("Failed to set remote description:", err));

                    //     return
                    // }
                    console.error("invalid query but valid type in the respnse")
                    // alert("invalid query but valid type in the respnse")
                    return
                }

                if (data.type === "message") {





                    if (data.sender.id === userRef.current.id) {
                        // this means i sent a message and its response came to me
                        // i wil only check file conditions which i send to someone as its reponces will come from server only to me 
                        // no need to check logs of sending file any where other than this scope


                        // i can add messageSubType
                        // and this needs to be checked first
                        if (data.messageSubType === "triple-text-from-ai") {
                            if (data.status === "failed") {
                                return console.log("failed msg with type message submsgtype triple text from ai", data.msg)
                            }
                            // whether initialised the tts audio stream or not
                            const { success, reused } = await props.textToSpeechContainerRef.current.initAudioCaptureFunction(); // dont fear about init, if it already exists, it will not reinite it will just use the same
                            if (success) {
                                console.log("message came and int function returned success whwen i was trying send its audio")
                                // const ttsTrack = textToSpeechContainerRef.current.outputStream.getAudioTracks()[0];

                                props.textToSpeechContainerRef.current.forceSpeakWithCaptureAndStream(data.msg)
                                return
                            } else {
                                console.log("message came but init fucntion did not retrurn success so i cannot send audio")
                            }

                            //props.textToSpeechContainerRef.current.forceSpeakWithCaptureAndStream(data.msg)




                            return
                        }

                        if (data.status === "failed") {


                            // below is failed for text msg

                            console.error("your msg has been failed", data.msg)

                            const chatsDiv = props.chatsDivRef.current


                            const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                            for (let i = 0; i < pendinGlobetFields.length; i++) {

                                pendinGlobetFields[i].children[1].textContent = `❌`

                                pendinGlobetFields[i].classList.remove("newly-unupdated-chats")
                            }

                            return
                        }







                        // this part is now for success normal messages

                        // checks if receiver already in my contacts or not
                        if (!(userRef.current.availableConnectedUsers.some((obj) => (obj.id === data.receiver.id)))) {

                            // this is means not present


                            userRef.current.availableConnectedUsers.push(
                                {

                                    username: data.receiver.username,
                                    // age: data.receiver.age,
                                    // gender: data.receiver.gender,
                                    country: data.receiver.country,
                                    id: data.receiver.id,
                                    unread: false

                                }
                            )

                        }



                        const chatsDiv = props.chatsDivRef.current


                        const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                        for (let i = 0; i < pendinGlobetFields.length; i++) {

                            const date = new Date(Number(data.createdAt))

                            const createdAt = date.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            });


                            pendinGlobetFields[i].children[1].textContent = `✔ ${createdAt}`

                            pendinGlobetFields[i].classList.remove("newly-unupdated-chats")

                        }





                        return
                    }

                    if (data.sender.id === userRef.current.focusedContact?.id) {

                        // ai is the sender , must listen 
                        //calling
                        if (data.status === "calling" && props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag) {
                            //play instantly
                            // filter little bit

                            let filteredText = "";

                            for (let line of data.msg.split("\n")) {



                                if (line.length === 0) continue; //ignore

                                if (line.startsWith("‹‹Context››")) {

                                    const userPart = line.split('userRequest:')[1].split('modelResponse:')[0].trim();
                                    const modelPart = line.split('modelResponse:')[1].trim();

                                } else {
                                    filteredText += line;
                                }
                            }

                            // await speakWithChromeOfflineSynthesizer(filteredText)
                            props.textToSpeechContainerRef.current.forceSpeakFunction(filteredText.replace(/\*/g, '').trim())
                            // speaking call again listening function

                            await startChromeOfflineVoiceRecognition(props.userRef)

                            return // just play the part and do nothing for status = calling response
                        }
                        // THIS IS THE PART WHERE RECEIVER IS FOCUSED AND MSG CAME FROM HIM
                        //failed
                        if (data.status === "failed") {
                            console.error("recieved failed msg by a sender to me")
                            return
                        }

                        //typing
                        if (data.status === "typing" && data.sender.username === "StarAI") {


                            const chatsDiv = props.chatsDivRef.current

                            if (typingFlagRef.current.element) {

                                clearTimeout(typingFlagRef.current.setTimeoutId)


                                typingFlagRef.current.setTimeoutId = setTimeout(() => {

                                    if (typingFlagRef.current.element && chatsDiv.contains(typingFlagRef.current.element)) {
                                        chatsDiv.removeChild(typingFlagRef.current.element)
                                    }

                                }, 10000)

                                return

                            }

                            const chatField = document.createElement("div")



                            typingFlagRef.current.element = chatField

                            const chatTextField = document.createElement("pre")

                            chatTextField.classList.add("bouncing-last-three-dots-animation")

                            chatTextField.style.display = "flex"



                            for (let i = 0; i < 3; i++) {
                                const dot = document.createElement("div");
                                dot.textContent = "·";
                                chatTextField.appendChild(dot);
                            }



                            const chatStatusField = document.createElement("div")



                            chatField.appendChild(chatTextField)

                            chatField.appendChild(chatStatusField)


                            chatsDiv.appendChild(chatField)

                            chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

                            typingFlagRef.current.setTimeoutId = setTimeout(() => {

                                if (typingFlagRef.current.element) {
                                    chatsDiv.removeChild(typingFlagRef.current.element)
                                }

                            }, 10000)

                            return
                        }
                        //typing
                        if (data.status === "typing" && data.sender.username !== "StarAI") {

                            // later on i will update this
                            return

                        }




                        //NOW this actual msg came success
                        // from here no typing only actual msg parts starts



                        // actaul msg from starAi
                        if (data.sender.username === "StarAI") {
                            // removing typing flag if any came then.
                            const chatsDiv = props.chatsDivRef.current

                            if (typingFlagRef.current.element && chatsDiv.contains(typingFlagRef.current.element)) {

                                clearTimeout(typingFlagRef.current.setTimeoutId)
                                chatsDiv.removeChild(typingFlagRef.current.element)
                                typingFlagRef.current.element = null
                                typingFlagRef.current.setTimeoutId


                            }











                            const date = new Date(Number(data.createdAt))

                            const createdAt = date.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            });




                            // NEW CONCEPT

                            const chatField = document.createElement("div")
                            chatField.style.alignSelf = "flex-start"
                            chatField.style.maxWidth = "90%"
                            const chatTextField = document.createElement("pre")

                            chatTextField.style.display = "flex"
                            chatTextField.style.flexDirection = "column"
                            chatTextField.style.rowGap = "0"



                            let startCode = false


                            let i = 0
                            for (let line of data.msg.split("\n")) {



                                if (line.length === 0) continue; //ignore

                                if (line.startsWith("‹‹Context››")) {

                                    const userPart = line.split('userRequest:')[1].split('modelResponse:')[0].trim();
                                    const modelPart = line.split('modelResponse:')[1].trim();


                                    props.chatRef.current?.starAiRecentChatContextStack.push(
                                        {
                                            "role": "user",
                                            "parts": [{ "text": userPart }]
                                        }
                                    )
                                    props.chatRef.current?.starAiRecentChatContextStack.push(
                                        {
                                            "role": "model",
                                            "parts": [{ "text": modelPart }]
                                        }
                                    )
                                    continue;
                                }



                                if (startCode === false && line.startsWith("```")) {// code start now
                                    const strong = document.createElement("legend")




                                    const onClick = (count) => {


                                        let text = ""
                                        for (let code of chatTextField.querySelectorAll(`.codeLine${count}`)) {
                                            text += code.textContent + "\n"

                                        }
                                        window.navigator.clipboard.writeText(text)



                                    }


                                    strong.textContent = "Copy" // line.slice(3)

                                    strong.classList.add("codeLine")
                                    strong.classList.add("copylegend")

                                    strong.style.marginTop = "var(--max-padding)"
                                    strong.style.paddingBottom = "var(--max-padding)"
                                    strong.style.borderTopLeftRadius = "10px"
                                    strong.style.borderTopRightRadius = "10px"
                                    strong.style.color = "white"
                                    strong.display = "inline"
                                    const count = i
                                    strong.onclick = () => onClick(count)
                                    chatTextField.appendChild(strong)


                                    startCode = true
                                    continue
                                }

                                if (startCode && line.startsWith("```") && line.length === 3) {// code end here

                                    startCode = false
                                    i++
                                    continue
                                }
                                if (startCode) { // code still , this will go in code part
                                    const codeLine = document.createElement("div")
                                    codeLine.classList.add("codeLine")
                                    codeLine.classList.add(`codeLine${i}`)
                                    let indexOfComment = line.indexOf("//")
                                    let comment = ""
                                    if (indexOfComment !== -1) {
                                        comment = line.slice(indexOfComment)
                                        line = line.slice(0, indexOfComment)
                                    }
                                    codeLine.textContent = line
                                    chatTextField.appendChild(codeLine)

                                    continue
                                }

                                if (line.length === 1 && startCode === false) { // one char only

                                    const strong = document.createElement("strong")
                                    strong.textContent = line
                                    chatTextField.appendChild(strong)
                                    continue
                                }

                                if (!startCode && line.slice(0, 3) === line.slice(-2) && line.indexOf("**") !== -1) {
                                    const strong = document.createElement("strong")
                                    strong.textContent = line
                                    chatTextField.appendChild(strong)
                                    continue
                                }

                                if (!startCode) {

                                    const div = document.createElement("div")
                                    div.textContent = line
                                    chatTextField.appendChild(div)
                                    continue
                                }









                            }

                            chatField.appendChild(chatTextField)

                            const chatStatusField = document.createElement("div")
                            chatStatusField.textContent = createdAt
                            chatStatusField.style.marginTop = "var(--max-margin)"
                            chatField.appendChild(chatStatusField)


                            chatsDiv.appendChild(chatField)

                            chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

                            //NEW CONCEPT END







                            return
                        }


                        //actual msg from focused otther than ai



                        const chatsDiv = props.chatsDivRef.current
                        const date = new Date(Number(data.createdAt))

                        const createdAt = date.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        });

                        //this is normal text msg
                        const chatField = document.createElement("div")
                        chatField.style.alignSelf = "flex-start"
                        chatField.style.maxWidth = "80%"
                        const chatTextField = document.createElement("pre")

                        chatTextField.style.display = "flex"
                        chatTextField.style.flexDirection = "column"
                        chatTextField.style.rowGap = "0"
                        chatTextField.textContent = data.msg


                        const speakMessage = document.createElement("span")
                        speakMessage.textContent = "⏵"
                        // give a class to it
                        speakMessage.classList.add("hovereffectbtn")
                        speakMessage.classList.add("playAnyMessageBtn")
                        speakMessage.onclick = () => props.textToSpeechContainerRef.current.forceSpeakFunction(data.msg)

                        chatTextField.appendChild(speakMessage)


                        chatField.appendChild(chatTextField)


                        const chatStatusField = document.createElement("div")
                        chatStatusField.textContent = createdAt
                        chatStatusField.style.marginTop = "var(--max-margin)"

                        chatField.appendChild(chatStatusField)



                        chatsDiv.appendChild(chatField)

                        chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })






                    }


                    if (data.receiver && data.sender.id !== userRef.current.focusedContact?.id) {


                        // ai is the sender , must listen 
                        if (data.status === "calling" && props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag) {
                            //play instantly
                            // filter little bit

                            try {

                                let filteredText = "";
                                console.log(data.msg)

                                for (let line of data.msg.split("\n")) {



                                    if (line.length === 0) continue; //ignore

                                    if (line.startsWith("‹‹Context››")) {

                                        const userPart = line.split('userRequest:')[1].split('modelResponse:')[0].trim();
                                        const modelPart = line.split('modelResponse:')[1].trim();

                                        props.chatRef.current?.starAiRecentVoiceContextStack.push(
                                            {
                                                "role": "user",
                                                "parts": [{ "text": userPart }]
                                            }
                                        )
                                        props.chatRef.current?.starAiRecentVoiceContextStack.push(
                                            {
                                                "role": "model",
                                                "parts": [{ "text": modelPart }]
                                            }
                                        )

                                    } else {
                                        filteredText += line;
                                    }
                                }
                                // console.log(filteredText)


                                await props.textToSpeechContainerRef.current.forceSpeakFunction(filteredText)

                                // speaking call again listening function

                                if (props.webRTCContainerRef.current.recogniserStreamObjectRef && webRTCContainerRef.current.recogniserStreamObjectRef.recogniser) {
                                    console.error("a recogniser for stt is already running")
                                    return
                                }
                              

                                const ok = await startChromeOfflineVoiceRecognition(props.userRef)

                                if (!ok) {
                                   
                                    return console.error("no text to send")
                                }




                            } catch (error) {
                                return console.error(error)
                            }


                            //sending to again ai
                            if (!props.socketContainer.current || props.socketContainer.current.readyState !== 1) {
                                console.error("socket is not ready")
                                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = false;
                                // buttonEl.style.backgroundColor = "transparent"
                                return
                            }



                            props.socketContainer.current.send(JSON.stringify({
                                type: "message",
                                status: "calling",
                                starAiRecentVoiceContextStack: (props.chatRef.current?.starAiRecentVoiceContextStack),
                                message: props.userRef.current.yourGlobalStarAiReference.transcriptinput,

                                receiver: props.userRef.current.yourGlobalStarAiReference,
                                // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country }
                                sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country }


                            }))


                            return // just play the part and do nothing for status = calling response
                        }



                        // THIS IS THE CONDITION WHERE RECEIVER IS NOT FOCUSED BUT MESSAGE CAME FROM HIM


                        if (data.status === "failed" || data.status === "calling" || data.status === "typing") {
                            console.error("this is failed message by any random or known user who is unfocused or this error you may see when not focused and status == calling")
                            // this error you may see when not focused and status == calling
                            return
                        }



                        // checks if receiver already in my contacts or not

                        let searchFound = false

                        for (let i = 0; i < userRef.current.availableConnectedUsers.length; i++) {

                            if (userRef.current.availableConnectedUsers[i].id === data.sender.id) {
                                // this condition shows random sender is in your recent contacts already
                                userRef.current.availableConnectedUsers[i].unread = true
                                searchFound = true
                                props.setRefreshUsersFlag((prev) => (prev + 1))

                                userRef.current.availableConnectedUsersUnreadLength += 1

                                props.setRecentUnreadContactCount(userRef.current.availableConnectedUsersUnreadLength)

                                break
                            }

                        }

                        if (!searchFound) {

                            // this is means this user is not present in available contacts



                            userRef.current.availableConnectedUsers.push(

                                {

                                    username: data.sender.username,
                                    // age: data.sender.age,
                                    // gender: data.sender.gender,
                                    country: data.sender.country,
                                    id: data.sender.id,
                                    unread: true

                                }
                            )

                            userRef.current.availableConnectedUsersUnreadLength += 1

                            props.setRecentUnreadContactCount(userRef.current.availableConnectedUsersUnreadLength)


                            props.setRefreshUsersFlag((prev) => (prev + 1))




                        }














                        // if (!inboxIconRef.current.classList.contains("svg-container-inbox-icon")) {


                        //     inboxIconRef.current.classList.add("svg-container-inbox-icon")


                        // }
                        return
                    }




                    return
                }


                if (data.type === "file-completed-response-from-server") { // this is saying file is received completely
                    if (data.sender.id === userRef.current.id) {
                        // you was the sender yourself
                        if (data.status === "failed") {// this is failed for file upload
                            console.error("meta data not found in server", data.msg)

                            const chatsDiv = props.chatsDivRef.current


                            const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                            for (let i = 0; i < pendinGlobetFields.length; i++) {

                                pendinGlobetFields[i].children[1].textContent = `❌`

                                pendinGlobetFields[i].classList.remove("newly-unupdated-chats")
                            }
                            // alert("file not uploaded");
                            console.error("file not uploaded")
                            return;
                        }

                        // this is telling file successfully uploaded
                        console.log("File upload fully completed!");

                        // alert("File upload fully completed!")
                        console.log("File uploaded successfully")
                        props.chatRef.current.filesToBeSent[data.fileMetaDataInfo.upcomingFilename] = null;

                        const chatsDiv = props.chatsDivRef.current


                        const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                        for (let i = 0; i < pendinGlobetFields.length; i++) {

                            const date = new Date(Number(data.createdAt))


                            const createdAt = date.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            });


                            // pendinGlobetFields[i].children[0].classList.add("isLink")

                            pendinGlobetFields[i].onclick = async () => {

                                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-file`, {
                                    method: "POST",
                                    headers: {


                                        "X-Modified-Filename": data.fileMetaDataInfo.upcomingFilename,
                                        "X-Custom-Access-Token": props.userRef.current.customAccessToken,
                                        "X-Sender-Id": props.userRef.current.id,
                                        "X-Receiver-Id": userRef.current.focusedContact.id,
                                        "X-Created-At": createdAt

                                    }
                                })

                                if (!response.ok) {
                                    const msg = await response.text();
                                    console.log(msg)
                                    return
                                }

                                try {
                                    // Ask user where to save file
                                    const handle = await window.showSaveFilePicker({
                                        suggestedName: data.fileMetaDataInfo.upcomingFilename
                                        //types: [{ description: 'ZIP files', accept: { 'application/zip': ['.zip'] } }]
                                    });

                                    const writable = await handle.createWritable();

                                    const reader = response.body.getReader();



                                    while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;
                                        await writable.write(value);
                                    }

                                    await writable.close();
                                    alert("Download complete!");
                                } catch (err) {
                                    console.error("Download failed:", err);
                                    alert("Download failed: " + err.message);
                                }
                                return



                                // if (props.socketContainer.current.isStillDownloading) {
                                //     console.error("wait a file is already downloading")
                                //     return
                                // }
                                // props.socketContainer.current.send(JSON.stringify(
                                //     {
                                //         type: "download-file-request-from-client",
                                //         sender: data.sender,
                                //         receiver: data.receiver,
                                //         fileMetaDataInfo: data.fileMetaDataInfo
                                //     }
                                // ))
                            }





                            pendinGlobetFields[i].children[1].textContent = `✔ ${createdAt}`

                            pendinGlobetFields[i].classList.remove("newly-unupdated-chats")

                        }

                        // this is finally exiting and your file is uploded

                        return

                    }
                    if (data.sender.id === userRef.current.focusedContact?.id) {
                        if (data.status === "failed") {// this is failed for file upload
                            console.error("the impossible case happening , as there is no protocol which tell you that unsuccessfull file is received", data.msg)

                            const chatsDiv = props.chatsDivRef.current


                            const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                            for (let i = 0; i < pendinGlobetFields.length; i++) {

                                pendinGlobetFields[i].children[1].textContent = `❌`

                                pendinGlobetFields[i].classList.remove("newly-unupdated-chats")
                            }
                            // alert("file not uploaded");
                            console.log("file not uploaded")
                            return;
                        }

                        // this is telling file successfully uploaded
                        console.log("you got a file link from a sender");

                        const chatsDiv = props.chatsDivRef.current
                        const date = new Date(Number(data.createdAt))

                        const createdAt = date.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        });


                        const chatField = document.createElement("div")
                        chatField.style.alignSelf = "flex-start"
                        chatField.style.maxWidth = "80%"
                        const chatTextField = document.createElement("pre")

                        chatTextField.style.display = "flex"
                        chatTextField.style.flexDirection = "column"
                        chatTextField.style.rowGap = "0"
                        const nameSpan = document.createElement("span")

                        // sender.id + "_" + receiver.id + "_" + data.createdAt + "_" + upcomingFilename;
                        function nthIndex(str, char, n) {
                            let i = -1;
                            while (n-- && i++ < str.length) {
                                i = str.indexOf(char, i);
                                if (i === -1) break;
                            }
                            return i;
                        }
                        const idx = nthIndex(data.upcomingFilename, "_", 3);
                        const shortName = data.upcomingFilename.slice(idx + 1);

                        nameSpan.textContent = shortName;


                        const breaklineTag = document.createElement("br")
                        const sizeSpan = document.createElement("span")
                        const fileSizeText = (data.fileSize < 1024) ? (Math.trunc(data.fileSize * 100) / 100 + " B") : ((data.fileSize < 1048576) ? (Math.trunc((data.fileSize / 1024) * 100) / 100 + " KB") : (Math.trunc((data.fileSize / 1048576) * 100) / 100 + " MB"));
                        sizeSpan.textContent = fileSizeText
                        chatTextField.append(nameSpan, breaklineTag, sizeSpan)

                        // chatTextField.textContent = data.fileMetaDataInfo.upcomingFilename

                        chatTextField.classList.add("isLink")
                        // chatTextField.onclick = () => {
                        //     props.socketContainer.current.send(JSON.stringify(
                        //         {
                        //             type: "download-file-request-from-client",
                        //             sender: data.sender,
                        //             receiver: data.receiver,
                        //             fileMetaDataInfo: data.fileMetaDataInfo
                        //         }
                        //     ))
                        // }

                        chatTextField.onclick = async () => {

                            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-file`, {
                                method: "POST",
                                headers: {


                                    "X-Modified-Filename": data.upcomingFilename,
                                    "X-Custom-Access-Token": props.userRef.current.customAccessToken,
                                    "X-Sender-Id": props.userRef.current.id,
                                    "X-Receiver-Id": userRef.current.focusedContact.id,
                                    "X-Created-At": createdAt

                                }
                            })

                            if (!response.ok) {
                                const msg = await response.text();
                                console.log(msg)
                                return
                            }

                            try {
                                // Ask user where to save file
                                const handle = await window.showSaveFilePicker({
                                    suggestedName: shortName
                                    //types: [{ description: 'ZIP files', accept: { 'application/zip': ['.zip'] } }]
                                });

                                const writable = await handle.createWritable();

                                const reader = response.body.getReader();



                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    await writable.write(value);
                                }

                                await writable.close();
                                alert("Download complete!");
                            } catch (err) {
                                console.error("Download failed:", err);
                                alert("Download failed: " + err.message);
                            }
                            return



                            // if (props.socketContainer.current.isStillDownloading) {
                            //     console.error("wait a file is already downloading")
                            //     return
                            // }
                            // props.socketContainer.current.send(JSON.stringify(
                            //     {
                            //         type: "download-file-request-from-client",
                            //         sender: data.sender,
                            //         receiver: data.receiver,
                            //         fileMetaDataInfo: data.fileMetaDataInfo
                            //     }
                            // ))
                        }


                        chatField.appendChild(chatTextField)

                        const chatStatusField = document.createElement("div")
                        chatStatusField.textContent = createdAt
                        chatStatusField.style.marginTop = "var(--max-margin)"
                        chatField.appendChild(chatStatusField)


                        chatsDiv.appendChild(chatField)

                        chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })




                        // this is finally exiting

                        return
                    }
                    if (data.receiver && data.sender.id !== userRef.current.focusedContact?.id) {


                        // THIS IS THE CONDITION WHERE RECEIVER IS NOT FOCUSED BUT MESSAGE CAME FROM HIM


                        if (data.status === "failed") {
                            console.error("impossible case is happening again, no protocol was there which send failed file link to receiver")
                            return
                        }



                        // checks if receiver already in my contacts or not

                        let searchFound = false

                        for (let i = 0; i < userRef.current.availableConnectedUsers.length; i++) {

                            if (userRef.current.availableConnectedUsers[i].id === data.sender.id) {
                                // this condition shows random sender is in your recent contacts already
                                userRef.current.availableConnectedUsers[i].unread = true
                                searchFound = true
                                props.setRefreshUsersFlag((prev) => (prev + 1))

                                userRef.current.availableConnectedUsersUnreadLength += 1

                                props.setRecentUnreadContactCount(userRef.current.availableConnectedUsersUnreadLength)

                                break
                            }

                        }

                        if (!searchFound) {

                            // this is means this user is not present in available contacts



                            userRef.current.availableConnectedUsers.push(

                                {

                                    username: data.sender.username,
                                    // age: data.sender.age,
                                    // gender: data.sender.gender,
                                    country: data.sender.country,
                                    id: data.sender.id,
                                    unread: true

                                }
                            )

                            userRef.current.availableConnectedUsersUnreadLength += 1

                            props.setRecentUnreadContactCount(userRef.current.availableConnectedUsersUnreadLength)


                            props.setRefreshUsersFlag((prev) => (prev + 1))




                        }














                        // if (!inboxIconRef.current.classList.contains("svg-container-inbox-icon")) {


                        //     inboxIconRef.current.classList.add("svg-container-inbox-icon")


                        // }
                        return
                    }


                    return;




                }
                if (data.type === "download-file-response-from-server") {
                    if (data.status === "failed") {
                        console.error("cannot download the file", data.msg)
                        return
                    }



                    props.socketContainer.current.isStillDownloading = true
                    props.socketContainer.current.downloadChunks = [];
                    props.socketContainer.current.downloadBytesReceived = 0;
                    props.socketContainer.current.downloadTotalBytes = data.fileMetaDataInfo.fileSize;
                    props.socketContainer.current.downloadFilename = data.fileMetaDataInfo.filename;
                    console.log("filename ", data.fileMetaDataInfo.filename)
                    console.log("filesize ", data.fileMetaDataInfo.fileSize)



                    return
                }



                console.error("invalid data type in response")
                return
            }
            else {
                if (props.socketContainer.current.downloadChunks !== undefined) {
                    const chunk = new Uint8Array(message.data);
                    props.socketContainer.current.downloadChunks.push(chunk);
                    props.socketContainer.current.downloadBytesReceived += chunk.byteLength;

                    // Check if download is complete
                    if (props.socketContainer.current.downloadBytesReceived >= props.socketContainer.current.downloadTotalBytes) {
                        // Combine all chunks into a blob
                        const blob = new Blob(props.socketContainer.current.downloadChunks);
                        const downloadUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = downloadUrl;
                        a.download = props.socketContainer.current.downloadFilename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        // Clean up after a delay to ensure download starts
                        setTimeout(() => {
                            URL.revokeObjectURL(downloadUrl);
                        }, 100);

                        // Clean up
                        props.socketContainer.current.isStillDownloading = false
                        props.socketContainer.current.downloadChunks = undefined;
                        props.socketContainer.current.downloadBytesReceived = 0;
                        props.socketContainer.current.downloadTotalBytes = 0;
                        props.socketContainer.current.downloadFilename = null;
                        console.log("Download completed successfully");
                    }
                }
                return
            }

        }
    }












    const controlUserCallback = async (e) => {







        if (e.currentTarget.getAttribute("value") === "close") {
            setToggleSelect(false)
            return
        }
        if (e.currentTarget.getAttribute("value") === "refresh") {
            setToggleSelect(false)


            if (!props.socketContainer.current || props.socketContainer.current.readyState !== 1) {

                console.error("socket is not ready")


                return
            }

            props.socketContainer.current.send(
                JSON.stringify(
                    {
                        type: "query-message",
                        queryType: "refresh-all-user",
                        sender: { username: props.userRef.current.username, id: props.userRef.current.id }
                    }
                )
            )



            return
        }
        if (e.currentTarget.getAttribute("value") === "logout") {
            setToggleSelect(false)


            if (!props.socketContainer || props.socketContainer.current.readyState !== 1) {
                window.location.href = '/';
                return
            }
            props.socketContainer.current.close()

            props.socketContainer.current.onmessage = null;
            props.socketContainer.current.onerror = null;
            props.socketContainer.current.onclose = null;
            props.socketContainer.current.onopen = null;
            props.socketContainer.current = null;

            props.userRef.current = null;
            props.chatRef.current = null;
            props.setUser("")

            // window.location.href = '/';
            navigate("/")



            // here exit full screen 

            // if (document.exitFullscreen) {
            //     document.exitFullscreen();
            // } else if (document.webkitExitFullscreen) { // Safari
            //     document.webkitExitFullscreen();
            // } else if (document.msExitFullscreen) { // IE11
            //     document.msExitFullscreen();
            // }
            //




            return
        }
        if (e.currentTarget.getAttribute("value") === "callai") {

            const buttonEl = e.currentTarget;


            //cleared/stoped any initaily speaking text
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel()
                return
            }





            if (props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag) { // checking whether ai already listening and if the stoping it
                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.instance?.stop()
                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }

            try {

                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = true;
                buttonEl.style.backgroundColor = "red"
                const ok = await startChromeOfflineVoiceRecognition(props.userRef)
                if(!ok){
                    // buttonEl.style.backgroundColor = "transparent"
                    return console.error("no text detected.")
                }
                //props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.instance = await startChromeOfflineVoiceRecognition(props.userRef)
               

            } catch (error) {
                console.error("transripter is not working right now", error)
                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }

            if (!props.socketContainer.current || props.socketContainer.current.readyState !== 1) {
                console.error("socket is not ready")
                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }



            props.socketContainer.current.send(JSON.stringify({
                type: "message",
                status: "calling",
                message: props.userRef.current.yourGlobalStarAiReference.transcriptinput,

                receiver: props.userRef.current.yourGlobalStarAiReference,
                // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country }
                sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country }


            }))




            return
        }

        return

    }


    // let lastScrollY = window.scrollY;

    // window.addEventListener("scroll", () => {
    //   const currentScrollY = window.scrollY;

    //   if (currentScrollY < lastScrollY) {
    //     console.log("scrolled up");
    //   }

    //   lastScrollY = currentScrollY;
    // });


    return (

        props.user ? (
            <div className="home dashboard" >

                <header className=" header"

                >
                    {/* above is the black header */}
                    <div
                        style={{ visibility: (selectedReceiver.username || headerTitle !== "Globet") ? "visible" : "hidden", backgroundColor: "transparent" }}
                        onClick={
                            () => {

                                setSelectedReceiver({ username: "", gender: "" });

                                if (props.chatRef.current.availableChats) { props.chatRef.current.availableChats = [] }

                                if (props.chatRef.current.receiver) {
                                    props.chatRef.current.receiver = {
                                        username: "",
                                        id: "",
                                        // age: null,
                                        // gender: "",
                                        country: ""
                                    }
                                    props.userRef.current.focusedContact = {

                                        username: "",
                                        id: "",
                                        // age: null,
                                        // gender: "",
                                        country: ""

                                    }
                                }

                                navigate("/users")


                                setHeaderTitle("Globet")
                            }
                        }
                        className="button">
                        {/* this is the back button */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                        </svg>
                    </div>

                    {/* below div is profile photo and username of header */}

                    <div
                        className="profile-photo-and-username-in-header" style={{
                            fontFamily: "cursive",
                            color: "var(--professional-blue)",
                            fontWeight: "bold",
                            // fontSize: "18px",
                            // textDecoration: "underline",
                            textShadow: "1px 1px 1px var(--dark-black)"
                        }}

                    >
                        <div className="profile-photo-in-header" style={{
                            display: selectedReceiver.username ? "flex" : "none",
                            // backgroundImage: `url(${selectedReceiver.gender === "male" ? "male_small.png" : "female_small.png"})`
                            // backgroundImage: 'url("default_user_photo.png")'
                            backgroundImage: (selectedReceiver.country === "nocountry") ? (`url(${aiProfile.profileImage})`) : 'url("default_user_photo.png")'

                        }}>

                        </div>
                        <i className={selectedReceiver.username ? "selected-username-holder" : ""}>{selectedReceiver.username || headerTitle}</i></div>


                    {/* below div is the div to recent contacts */}
                    <div
                        className={props.recentUnreadContactCount ? "svg-container-inbox-icon hovereffectbtn" : "inbox hovereffectbtn"}
                        data-recent-contact-unread-count={props.recentUnreadContactCount}
                        ref={inboxIconRef}

                        onClick={
                            (e) => {

                                // setSelectedReceiver({ username: "", gender: "", age: null, id: "" });
                                setSelectedReceiver({ username: "", id: "" });

                                // if (props.chatRef.current && props.chatRef.current.availableChats) {
                                props.userRef.current.focusedContact = {}
                                props.chatRef.current.availableChats = []
                                // }

                                navigate("/mycontacts-and-notifications")
                                props.setRefreshGlobalUsersFlag((prev) => (prev + 1))
                                setHeaderTitle("Recent Connections")



                            }
                        }
                    >
                        {/* this is div to recent contact */}

                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class="" fill="none">

                            <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0002 6.66667C22.0002 5.19391 20.8062 4 19.3335 4H1.79015C1.01286 4 0.540213 4.86348 0.940127 5.53L3.00016 9V17.3333C3.00016 18.8061 4.19406 20 5.66682 20H19.3335C20.8062 20 22.0002 18.8061 22.0002 17.3333V6.66667ZM7.00016 10C7.00016 9.44772 7.44787 9 8.00016 9H17.0002C17.5524 9 18.0002 9.44772 18.0002 10C18.0002 10.5523 17.5524 11 17.0002 11H8.00016C7.44787 11 7.00016 10.5523 7.00016 10ZM8.00016 13C7.44787 13 7.00016 13.4477 7.00016 14C7.00016 14.5523 7.44787 15 8.00016 15H14.0002C14.5524 15 15.0002 14.5523 15.0002 14C15.0002 13.4477 14.5524 13 14.0002 13H8.00016Z" fill="currentColor"></path>
                        </svg>

                    </div>





                    {/* section below is menu bar , is face any css issue then check one app.css */}

                    <section


                        onClick={
                            () => {

                                setToggleSelect(true)

                            }
                        }
                        id="controls"
                        className="button hovereffectbtn"
                        style={{ display: selectedReceiver.username ? "none" : "flex" }}

                    >
                        <div>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class="" fill="none">

                                <path d="M12 20C11.45 20 10.9792 19.8042 10.5875 19.4125C10.1958 19.0208 10 18.55 10 18C10 17.45 10.1958 16.9792 10.5875 16.5875C10.9792 16.1958 11.45 16 12 16C12.55 16 13.0208 16.1958 13.4125 16.5875C13.8042 16.9792 14 17.45 14 18C14 18.55 13.8042 19.0208 13.4125 19.4125C13.0208 19.8042 12.55 20 12 20ZM12 14C11.45 14 10.9792 13.8042 10.5875 13.4125C10.1958 13.0208 10 12.55 10 12C10 11.45 10.1958 10.9792 10.5875 10.5875C10.9792 10.1958 11.45 10 12 10C12.55 10 13.0208 10.1958 13.4125 10.5875C13.8042 10.9792 14 11.45 14 12C14 12.55 13.8042 13.0208 13.4125 13.4125C13.0208 13.8042 12.55 14 12 14ZM12 8C11.45 8 10.9792 7.80417 10.5875 7.4125C10.1958 7.02083 10 6.55 10 6C10 5.45 10.1958 4.97917 10.5875 4.5875C10.9792 4.19583 11.45 4 12 4C12.55 4 13.0208 4.19583 13.4125 4.5875C13.8042 4.97917 14 5.45 14 6C14 6.55 13.8042 7.02083 13.4125 7.4125C13.0208 7.80417 12.55 8 12 8Z" fill="currentColor"></path>
                            </svg>
                        </div>


                        <aside style={{
                            right: toggleSelect ? "calc(var(--max-padding))" : "calc(-2 * var(--toggle-select-width))",


                        }}>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                </svg>
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="callai">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-openai" viewBox="0 0 16 16">
                                    <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z" />
                                </svg>
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="username"
                                style={{
                                    fontFamily: "cursive",
                                    color: "var(--professional-blue)",
                                    fontWeight: "bold",
                                    fontSize: "18px",
                                    textDecoration: "underline",

                                }}
                            ><i className="selected-username-holder-noborder">{props.userRef.current.username}</i></button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="refresh" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
                                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                                    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
                                </svg>Sync
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="logout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px', color: "red" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-left" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z" />
                                    <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
                                </svg> Logout
                            </button>
                        </aside>


                    </section>



                    {/* below is call button for rtc */}

                    <section
                        className="button hovereffectbtn" ref={props.rtcbuttonRef}
                        style={{ display: selectedReceiver.username ? "flex" : "none" }}
                        onClick={() => { props.webRTCContainerRef.current.webRTCStartFunction("mediastream") }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-telephone-plus-fill" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877zM12.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H13v1.5a.5.5 0 0 1-1 0V4h-1.5a.5.5 0 0 1 0-1H12V1.5a.5.5 0 0 1 .5-.5" />
                        </svg>


                    </section>

                </header>




                <Outlet />






                <section className="dashboard-overlay"
                    style={
                        {
                            display: toggleSelect ? "block" : "none"
                        }
                    }
                    onClick={() => {
                        setToggleSelect(false)
                    }}>

                </section>
            </div>


        ) : (



            <div className="home container-sign-in">


                <section className="signin-box">
                    <label >Register & Go!</label>
                    <form id="register-form" autoComplete="off" action="" className="inputs" onSubmit={(e) => {

                        initializeConnection(
                            e,
                            props.socketContainer,
                            props.user,
                            props.setUser,
                            props.userRef,
                            props.chatRef
                        )

                    }}>

                        <fieldset>

                            <legend>Username</legend>
                            <input required type="text" name="username" value={"" + Math.floor(Math.random() * 101)} />

                        </fieldset>

                        {/* <fieldset>

                            <input required spellCheck={false} type="number" name="age" />

                            <legend>Age</legend>

                        </fieldset> */}

                        {/* <section>

                            <fieldset onClick={(e) => (e.currentTarget.children[0].click())}>

                                <input required type="radio" name="gender" value="female" />

                                <legend>Female</legend>


                            </fieldset>
                            <fieldset onClick={(e) => (e.currentTarget.children[0].click())}>

                                <input required type="radio" name="gender" value="male" />

                                <legend>Male</legend>

                            </fieldset>

                        </section> */}

                        <section className="selectbar-container" >
                            <fieldset >

                                <legend>Country</legend>
                                <select className="country-selector-signin" name="country" defaultValue="United States">
                                    <option style={{ visibility: "hidden" }} value="">{"▼"}</option>

                                    {countries.map((country, index) => (
                                        <option
                                            key={index} value={country.countryName}>
                                            {country.countryName}
                                        </option>
                                    ))}

                                </select>


                            </fieldset>
                        </section>


                        <input type="submit" spellCheck={false} name="submitbtn" value="Go" style={{ backgroundColor: "green" }} />

                        <label
                            style={
                                {
                                    visibility: "hidden"
                                }
                            }>

                            {signInLoadingFlag ? (<Loading size="20px" />) : (signInErrorLog)}


                        </label>





                    </form>

                </section>


                <div className="container-sign-in-overlay">

                    <section></section>
                    <section></section>
                    <section></section>
                    <section></section>
                    <section></section>


                </div>
            </div>




        )




    );
}
