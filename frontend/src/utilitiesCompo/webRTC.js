import { userStore } from "../zustand/userStore.jsx";
import { socketStore } from "../zustand/socket.jsx";
import { webRTCContainerRef, textToSpeechContainerRef, rtcbuttonRef } from "./refs.js";


// this is a plain function now, defined once (not re-assigned on every App render)
export const webRTCStartFunction = async (motive = null) => {

    // defined before try so that the catch block can also call it
    const cleanup = async () => {
        // Track cleanup
        textToSpeechContainerRef.current?.cleanUp()

        if (webRTCContainerRef.current.senderTC) {
            webRTCContainerRef.current.senderTC.stop();
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
        const currentPC = webRTCContainerRef.current.senderPC
        if (currentPC) {
            currentPC.getSenders().forEach(sender => { if (sender.track) { sender.track.stop(); currentPC.removeTrack(sender); } });
            currentPC.close();
            webRTCContainerRef.current.senderPC = null;
            console.log("Peer connection closed");
        }

        // Reset button
        if (rtcbuttonRef.current) {
            rtcbuttonRef.current.style.backgroundColor = "transparent";
            rtcbuttonRef.current.onclick = () => {
                webRTCStartFunction("mediastream");
            };
        }

    };

    try {

        if (!socketStore.getState().isActive()) {
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

        // Create new peer connection

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

                            webRTCContainerRef.current.recogniserStreamObjectRef.isARequestMadeBySTT = false



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
                            const me = userStore.getState()

                            socketStore.getState().socket.send(JSON.stringify({
                                type: "message",
                                messageSubType: "triple-text-to-ai",
                                message: webRTCContainerRef.current.recogniserStreamObjectRef.finalText,
                                sender: {
                                    username: me.username,
                                    id: me.id,
                                    country: me.country,
                                    customAccessToken: me.customAccessToken
                                },
                                receiver: me.yourGlobalStarAiReference,

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
        };

        // Handle ICE candidates
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                const me = userStore.getState()

                socketStore.getState().socket.send(JSON.stringify({
                    type: "query-message",
                    queryType: "ice",
                    sender: { username: me.username, id: me.id, country: me.country },
                    receiver: me.focusedContact,
                    d: e.candidate
                }));
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = async () => {

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
            }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const me = userStore.getState()

        socketStore.getState().socket.send(JSON.stringify({
            type: "query-message",
            queryType: "offer",
            sender: { username: me.username, id: me.id, country: me.country },
            receiver: me.focusedContact,
            d: offer
        }));

    } catch (err) {
        alert("WebRTC setup failed: " + err.message);
        console.error(err);
        await cleanup()
    }
};


// kept so any old call like webRTCContainerRef.current.webRTCStartFunction(...) keeps working
webRTCContainerRef.current.webRTCStartFunction = webRTCStartFunction