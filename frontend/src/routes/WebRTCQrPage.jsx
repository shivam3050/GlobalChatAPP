// import {  useRef } from 'react'






// const WebRTCQrPage = (props) => {


//     const canvaContainerRef = useRef(null)
//     const canvaContainerRefTwo = useRef(null)
//     const localChatRef = useRef(null)
//     const localMsgCreateRef = useRef(null)



















//     async function startCaller() {


//         props.peerRef.current = new RTCPeerConnection();

//         props.peerRef.current.onicecandidate = (event) => {
//             if (!event.candidate) {

//             }
//         };

//         props.callerChannelRef.current = props.peerRef.current.createDataChannel("chat");



//         props.peerRef.current.onconnectionstatechange = () => {


//             const state = props.peerRef.current.connectionState;

//             if (state === "connected") {

//                 props.setLocalConnectionStatus(true)


//             }
//             else if (state === "disconnected" || state === "failed" || state === "closed")
//                 props.setLocalConnectionStatus(false);
//         };

//         props.callerChannelRef.current.onmessage = (e) => {
//             appendChatMessage("Anonymous", e.data);
//         };

//         props.callerChannelRef.current.onopen = () => {


//             props.setLocalConnectionStatus(true)


//         };
//         props.callerChannelRef.current.onclose = () => {

//             props.setLocalConnectionStatus(false)

//         };

//         const offer = await props.peerRef.current.createOffer();
//         await props.peerRef.current.setLocalDescription(offer);

//         canvaContainerRef.current.querySelector('input[type="text"]').value = "Code Created Click Copy Button"




//     }




//     async function startReceiver() {



//         let remoteDesc;
//         props.peerRef.current = new RTCPeerConnection();

//         try {

//             remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);   // getting the code from caller

//             await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));

//         } catch (error) {

//             console.error(error)

//             return
//         }


//         props.peerRef.current.onicecandidate = (event) => {
//             if (!event.candidate) {
//                 // updating the canva showing the local description

//             }
//         };

//         props.peerRef.current.onconnectionstatechange = () => {

//             const state = props.peerRef.current.connectionState;

//             if (state === "connected") {
//                 props.setLocalConnectionStatus(true)

//             }
//             else if (state === "disconnected" || state === "failed" || state === "closed")
//                 props.setLocalConnectionStatus(false);
//         };

//         props.peerRef.current.ondatachannel = (event) => {

//             props.receiverChannelRef.current = event.channel;
//             props.receiverChannelRef.current.onmessage = (e) => {
//                 appendChatMessage("Anonymous", e.data);
//             };

//             props.receiverChannelRef.current.onopen = () => {


//                 props.setLocalConnectionStatus(true)


//             };
//             props.receiverChannelRef.current.onclose = () => {

//                 props.setLocalConnectionStatus(false)


//             };
//         }

//         //this is the data / ui updation part
//         // here i have both local description and remote description



//         const answer = await props.peerRef.current.createAnswer();

//         //setting answer of this remote description
//         await props.peerRef.current.setLocalDescription(answer);
//         canvaContainerRef.current.querySelector('input[type="text"]').value = "Answer Created Click Again on Copy to Copy New Code"

//     }








//     async function applyRemoteDescription() {




//         let remoteDesc;
//         try {

//             remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);  // getting the code from receiver which is pasted
//         } catch (error) {
//             console.error("cannot connect apply remote right now")

//             return
//         }
//         await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));


//     }




//     function sendMessage() {

//         const input = localMsgCreateRef.current;
//         const message = input.value.trim();

//         if (message !== '') {
//             if (props.callerChannelRef.current?.readyState === "open") {

//                 props.callerChannelRef.current.send(message);
//                 appendChatMessage("You", message);
//                 input.value = '';
//                 return
//             }
//             else if (props.receiverChannelRef.current?.readyState === "open") {

//                 props.receiverChannelRef.current.send(message);
//                 appendChatMessage("You", message);
//                 input.value = '';
//                 return
//             }
//             else return;


//         }
//     }

//     function appendChatMessage(sender, message) {

//         const chatBox = localChatRef.current;

//         const divField = document.createElement("div")



//         divField.style.alignSelf = (sender === "You") ? ("flex-end") : ("flex-start")

//         if (sender === "You") divField.classList.add("background-gradient-in-chat")

//         const divB = document.createElement("div")
//         divB.textContent = `${sender}:`

//         const divP = document.createElement("pre")
//         divP.textContent = `${message}`

//         divField.appendChild(divP)
//         divField.appendChild(divB)

//         chatBox.appendChild(divField)

//         // chatBox.scrollTop = chatBox.scrollHeight;

//         chatBox.scrollTo({
//             top: chatBox.scrollHeight,
//             behavior: "smooth"
//         });
//     }




//     return (
//         <div className='web-rtc-page home dashboard'>
//             <div className="header">

//                 <h2 style={{ display: props.localConnectionStatus ? "flex" : "none", justifyContent: "center", visibility: "visible" }}>connected</h2>

//                 <button style={{ display: "flex", justifyContent: "center", maxWidth: "340px", fontSize: "16px", visibility: props.localConnectionStatus ? "hidden" : "visible", backgroundColor:"var(--professional-blue)" }} onClick={startCaller}>
//                     1. Create Offer</button>

//                 <button
//                     style={{ backgroundColor: "red", textShadow: "0px 0px 10px white", position: "relative", borderRadius: "50%", maxWidth: "50px", width: "50px", height: "50px", display: "flex", justifyContent: "center", alignItems: "center", top: "0" }}
//                     onClick={() => {

//                         // const formData = new FormData(document.getElementById("register-form"));
//                         // const username = formData.get("username")
//                         props.setLocaluser(prev => !prev)
//                     }}
//                 >
//                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
//                         <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
//                     </svg>
//                 </button>

//             </div>

//             <div className="user-vs-chat-container-like">

//                 {props.localConnectionStatus ? (
//                     // first like chat section
//                     <div className="user-vs-chat-container" style={{ height: "100%" }}>

//                         <div style={{ display: "flex", flexDirection: "column" }} id="chat" ref={localChatRef}>



//                         </div>

//                         <div>
//                             <div>

//                                 <textarea ref={localMsgCreateRef} placeholder="Type message..." ></textarea>
//                             </div>
//                             <div>

//                                 <button onClick={sendMessage}>
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16">
//                                         <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </div>

//                     </div>
//                 ) : (
//                     <div className="user-vs-chat-container-like-with-qr-part" style={{ height: "100%" }}>

//                         {/* this the where qr area will be shown */}

//                         <fieldset ref={canvaContainerRef} style={{ minHeight: "max-content", position: "relative" }}>

//                             <legend>Status:</legend>
//                             {/* this is for copying the part which first time offer */}
//                             <legend style={{ position: "relative", float: "right", cursor: "pointer" }}
//                                 onClick={() => {
//                                     console.log(JSON.stringify(props.peerRef.current.localDescription))
//                                     window.navigator.clipboard.writeText(JSON.stringify(props.peerRef.current.localDescription))
//                                 }}>Copy Code</legend>



//                             <input type='text' style={{ minHeight: "max-content", minWidth: "315px", display: "inline-block", textShadow: "0 0 5px rgba(0,0,0,0.1)" }} id="localDesc" readOnly placeholder='Click on create offer first...' />




//                         </fieldset>

//                         <fieldset ref={canvaContainerRefTwo} style={{ minHeight: "max-content" }}>

//                             <legend>Paste Remote Description:</legend>
//                             {/* ths is for copying the code which is created after starting receiver */}
//                             {/* <legend style={{ position: "relative", float: "right", cursor: "pointer", transition: "transform 0.1s ease" }}
//                                 onClick={(e) => {
//                                     console.log(JSON.stringify(props.peerRef.current.localDescription))
//                                     window.navigator.clipboard.writeText(JSON.stringify(props.peerRef.current.localDescription))
//                                     e.currentTarget.style.transform = "scale(0.95)";
//                                     setTimeout(()=>{
//                                         e.currentTarget.style.transform = "scale(1)";
//                                     },2000)
//                                 }}>Copy Code</legend> */}





//                             <textarea style={{ minHeight: "max-content", minWidth: "315px", resize: "none", textShadow: "0px 0px 1px black", fontFamily: "monospace", }} spellCheck={false} className='code-description' placeholder='Paste code from other Device here & click consume...'></textarea>


//                             <section style={{ display: "flex", columnGap: "var(--max-margin)", justifyContent: "center" }}>
//                                 <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={startReceiver}>
//                                     2. Consume Offer</button>
//                                 <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={applyRemoteDescription}>3. Finalize Connection</button>

//                             </section>




//                         </fieldset>





//                         {/* <h4>Paste Remote Description:</h4>
//                         <textarea className='code-description' id="remoteDesc"></textarea>
//                         <button onClick={applyRemoteDescription}>Set Remote Description</button> */}

//                     </div>
//                 )}



//             </div>




//         </div>
//     )
// }

// export default WebRTCQrPage



































import { useRef } from 'react'

const WebRTCQrPage = (props) => {

    const canvaContainerRef = useRef(null)
    const canvaContainerRefTwo = useRef(null)
    const localChatRef = useRef(null)
    const localMsgCreateRef = useRef(null)

    async function startCaller() {
        props.peerRef.current = new RTCPeerConnection();

        props.peerRef.current.onicecandidate = (event) => {
            if (!event.candidate) {
            }
        };

        props.callerChannelRef.current = props.peerRef.current.createDataChannel("chat");

        props.peerRef.current.onconnectionstatechange = () => {
            const state = props.peerRef.current.connectionState;
            if (state === "connected") {
                props.setLocalConnectionStatus(true)
            } else if (state === "disconnected" || state === "failed" || state === "closed") {
                props.setLocalConnectionStatus(false);
            }
        };

        props.callerChannelRef.current.onmessage = (e) => {
            appendChatMessage("Anonymous", e.data);
        };

        props.callerChannelRef.current.onopen = () => {
            props.setLocalConnectionStatus(true)
        };

        props.callerChannelRef.current.onclose = () => {
            props.setLocalConnectionStatus(false)
        };

        const offer = await props.peerRef.current.createOffer();
        await props.peerRef.current.setLocalDescription(offer);

        // canvaContainerRef.current.querySelector('input[type="text"]').value = "Code Created Click Copy Button"
        canvaContainerRef.current.querySelector('input[type="text"]').value = JSON.stringify(offer)
    }

    async function startReceiver() {
        let remoteDesc;
        props.peerRef.current = new RTCPeerConnection();

        try {
            remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);
            remoteDesc.candidate = filterCandidate(remoteDesc.candidate);
            await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));
        } catch (error) {
            console.error(error)
            return
        }

        props.peerRef.current.onicecandidate = (event) => {
            if (!event.candidate) {
            }
        };

        props.peerRef.current.onconnectionstatechange = () => {
            const state = props.peerRef.current.connectionState;
            if (state === "connected") {
                props.setLocalConnectionStatus(true)
            } else if (state === "disconnected" || state === "failed" || state === "closed") {
                props.setLocalConnectionStatus(false);
            }
        };

        props.peerRef.current.ondatachannel = (event) => {
            props.receiverChannelRef.current = event.channel;
            props.receiverChannelRef.current.onmessage = (e) => {
                appendChatMessage("Anonymous", e.data);
            };
            props.receiverChannelRef.current.onopen = () => {
                props.setLocalConnectionStatus(true)
            };
            props.receiverChannelRef.current.onclose = () => {
                props.setLocalConnectionStatus(false)
            };
        }

        const answer = await props.peerRef.current.createAnswer();
        await props.peerRef.current.setLocalDescription(answer);
        // canvaContainerRef.current.querySelector('input[type="text"]').value = "Answer Created Click Again on Copy to Copy New Code"
        canvaContainerRef.current.querySelector('input[type="text"]').value = JSON.stringify(answer)
    }

    async function applyRemoteDescription() {
        let remoteDesc;
        try {
            remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);
        } catch (error) {
            console.error("Invalid JSON");
            return;
        }

        if (!props.peerRef.current || !props.peerRef.current.signalingState) {
            console.error("Peer not initialized");
            return;
        }

        if (remoteDesc?.type === "answer" && props.peerRef.current.signalingState === "have-local-offer") {
            remoteDesc.candidate = filterCandidate(remoteDesc.candidate);
            await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));
        } else {
            console.error("Invalid state or wrong SDP type:", remoteDesc.type, props.peerRef.current.signalingState);
        }
    }

    function filterCandidate(candidateString) {
        if (!candidateString) return candidateString;
        const candidates = candidateString.split('\n');
        return candidates.filter(line => !line.includes('.local')).join('\n');
    }

    function sendMessage() {
        const input = localMsgCreateRef.current;
        const message = input.value.trim();
        if (message !== '') {
            if (props.callerChannelRef.current?.readyState === "open") {
                props.callerChannelRef.current.send(message);
                appendChatMessage("You", message);
                input.value = '';
                return;
            } else if (props.receiverChannelRef.current?.readyState === "open") {
                props.receiverChannelRef.current.send(message);
                appendChatMessage("You", message);
                input.value = '';
                return;
            } else return;
        }
    }

    function appendChatMessage(sender, message) {
        const chatBox = localChatRef.current;
        const divField = document.createElement("div")
        divField.style.alignSelf = (sender === "You") ? ("flex-end") : ("flex-start")
        if (sender === "You") divField.classList.add("background-gradient-in-chat")
        const divB = document.createElement("div")
        divB.textContent = `${sender}:`
        const divP = document.createElement("pre")
        divP.textContent = `${message}`
        divField.appendChild(divP)
        divField.appendChild(divB)
        chatBox.appendChild(divField)
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
    }

    return (
        <div className='web-rtc-page home dashboard'>
            <div className="header">
                <h2 style={{ display: props.localConnectionStatus ? "flex" : "none", justifyContent: "center", visibility: "visible" }}>connected</h2>
                <button
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        maxWidth: "340px",
                        fontSize: "16px",
                        visibility: props.localConnectionStatus ? "hidden" : "visible",
                        backgroundColor: "var(--professional-blue)"
                    }}
                    onClick={startCaller}>
                    1. Create Offer
                </button>

                <button
                    style={{
                        backgroundColor: "red",
                        textShadow: "0px 0px 10px white",
                        position: "relative",
                        borderRadius: "50%",
                        maxWidth: "50px",
                        width: "50px",
                        height: "50px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        top: "0"
                    }}
                    onClick={() => {
                        props.setLocaluser(prev => !prev)
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                    </svg>
                </button>
            </div>

            <div className="user-vs-chat-container-like">

                {props.localConnectionStatus ? (
                    <div className="user-vs-chat-container" style={{ height: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column" }} id="chat" ref={localChatRef}></div>

                        <div>
                            <div>
                                <textarea ref={localMsgCreateRef} placeholder="Type message..." ></textarea>
                            </div>
                            <div>
                                <button onClick={sendMessage}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="user-vs-chat-container-like-with-qr-part" style={{ height: "100%" }}>
                        <fieldset ref={canvaContainerRef} style={{ minHeight: "max-content", position: "relative" }}>
                            <legend>Status:</legend>
                            <legend style={{ position: "relative", float: "right", cursor: "pointer" }}
                                onClick={() => {
                                    window.navigator.clipboard.writeText(JSON.stringify(props.peerRef.current.localDescription))
                                }}>Copy Code</legend>
                            <input type='text' style={{ minHeight: "max-content", minWidth: "315px", display: "inline-block", textShadow: "0 0 5px rgba(0,0,0,0.1)" }} id="localDesc" readOnly placeholder='Click on create offer first...' />
                        </fieldset>

                        <fieldset ref={canvaContainerRefTwo} style={{ minHeight: "max-content" }}>
                            <legend>Paste Remote Description:</legend>
                            <textarea style={{ minHeight: "max-content", minWidth: "315px", resize: "none", textShadow: "0px 0px 1px black", fontFamily: "monospace", }} spellCheck={false} className='code-description' placeholder='Paste code from other Device here & click consume...'></textarea>

                            <section style={{ display: "flex", columnGap: "var(--max-margin)", justifyContent: "center" }}>
                                <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={startReceiver}>
                                    2. Consume Offer
                                </button>
                                <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={applyRemoteDescription}>
                                    3. Finalize Connection
                                </button>
                            </section>
                        </fieldset>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WebRTCQrPage
