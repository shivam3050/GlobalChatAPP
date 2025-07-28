import { useEffect, useRef, useState } from 'react'






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


            }
            else if (state === "disconnected" || state === "failed" || state === "closed")
                props.setLocalConnectionStatus(false);
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

        canvaContainerRef.current.querySelector('input[type="text"]').value = "Code Created Click Copy Button"




    }




    async function startReceiver() {



        let remoteDesc;
        props.peerRef.current = new RTCPeerConnection();

        try {

            remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);   // getting the code from caller

            await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        } catch (error) {

            console.error(error)

            return
        }


        props.peerRef.current.onicecandidate = (event) => {
            if (!event.candidate) {
                // updating the canva showing the local description

            }
        };

        props.peerRef.current.onconnectionstatechange = () => {

            const state = props.peerRef.current.connectionState;

            if (state === "connected") {
                props.setLocalConnectionStatus(true)

            }
            else if (state === "disconnected" || state === "failed" || state === "closed")
                props.setLocalConnectionStatus(false);
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

        //this is the data / ui updation part
        // here i have both local description and remote description



        const answer = await props.peerRef.current.createAnswer();

        //setting answer of this remote description
        await props.peerRef.current.setLocalDescription(answer);
        canvaContainerRef.current.querySelector('input[type="text"]').value = "Answer Created Click Again on Copy to Copy New Code"

    }








    async function applyRemoteDescription() {




        let remoteDesc;
        try {

            remoteDesc = JSON.parse(canvaContainerRefTwo.current.querySelector("textarea").value);  // getting the code from receiver which is pasted
        } catch (error) {
            console.error("cannot connect apply remote right now")

            return
        }
        await props.peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteDesc));


    }




    function sendMessage() {

        const input = localMsgCreateRef.current;
        const message = input.value.trim();

        if (message !== '') {
            if (props.callerChannelRef.current?.readyState === "open") {

                props.callerChannelRef.current.send(message);
                appendChatMessage("You", message);
                input.value = '';
                return
            }
            else if (props.receiverChannelRef.current?.readyState === "open") {

                props.receiverChannelRef.current.send(message);
                appendChatMessage("You", message);
                input.value = '';
                return
            }
            else return;


        }
    }

    function appendChatMessage(sender, message) {

        const chatBox = localChatRef.current;

        const divField = document.createElement("div")

        const divB = document.createElement("div")
        divB.textContent = `${sender}:`

        const divP = document.createElement("pre")
        divP.textContent = `${message}`

        divField.appendChild(divP)
        divField.appendChild(divB)

        chatBox.appendChild(divField)

        chatBox.scrollTop = chatBox.scrollHeight;
    }




    return (
        <div className='web-rtc-page home dashboard'>
            <div className="header">

                <h2 style={{ display: props.localConnectionStatus ? "flex" : "none", justifyContent: "center", visibility: "visible" }}>connected</h2>

                <button style={{ display: "flex", justifyContent: "center", maxWidth: "340px", fontSize: "16px", visibility: props.localConnectionStatus ? "hidden" : "visible" }} onClick={startCaller}>
                    1. Create Offer</button>
            
                <button
                    style={{ backgroundColor: "var(--professional-blue)", textShadow: "0px 0px 10px white", position: "relative", borderRadius: "50%", maxWidth: "50px",width: "50px", height: "50px", display: "flex", justifyContent: "center", alignItems: "center", top: "0", transform: "translateX(-50%)" }}
                    onClick={() => {

                        // const formData = new FormData(document.getElementById("register-form"));
                        // const username = formData.get("username")
                        props.setLocaluser(prev => !prev)
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-phone-flip" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11 1H5a1 1 0 0 0-1 1v6a.5.5 0 0 1-1 0V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a.5.5 0 0 1-1 0V2a1 1 0 0 0-1-1m1 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a.5.5 0 0 0-1 0v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a.5.5 0 0 0-1 0zM1.713 7.954a.5.5 0 1 0-.419-.908c-.347.16-.654.348-.882.57C.184 7.842 0 8.139 0 8.5c0 .546.408.94.823 1.201.44.278 1.043.51 1.745.696C3.978 10.773 5.898 11 8 11q.148 0 .294-.002l-1.148 1.148a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708l1.145 1.144L8 10c-2.04 0-3.87-.221-5.174-.569-.656-.175-1.151-.374-1.47-.575C1.012 8.639 1 8.506 1 8.5c0-.003 0-.059.112-.17.115-.112.31-.242.6-.376Zm12.993-.908a.5.5 0 0 0-.419.908c.292.134.486.264.6.377.113.11.113.166.113.169s0 .065-.13.187c-.132.122-.352.26-.677.4-.645.28-1.596.523-2.763.687a.5.5 0 0 0 .14.99c1.212-.17 2.26-.43 3.02-.758.38-.164.713-.357.96-.587.246-.229.45-.537.45-.919 0-.362-.184-.66-.412-.883s-.535-.411-.882-.571M7.5 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z" />
                    </svg>
                </button>

            </div>

            <div className="user-vs-chat-container-like">

                {props.localConnectionStatus ? (
                    // first like chat section
                    <div className="user-vs-chat-container" style={{ height: "100%" }}>

                        <div id="chat" ref={localChatRef}>



                        </div>

                        <div>
                            <div>

                                <input ref={localMsgCreateRef} type="text" placeholder="Type message..." />
                            </div>
                            <div>

                                <button onClick={sendMessage}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16">
                                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="user-vs-chat-container-like-with-qr-part" style={{ height: "100%" }}>

                        {/* this the where qr area will be shown */}

                        <fieldset ref={canvaContainerRef} style={{ minHeight: "max-content", position: "relative" }}>

                            <legend>Status:</legend>
                            {/* this is for copying the part which first time offer */}
                            <legend style={{ position: "relative", float: "right", cursor: "pointer" }}
                                onClick={() => {
                                    console.log(JSON.stringify(props.peerRef.current.localDescription))
                                    window.navigator.clipboard.writeText(JSON.stringify(props.peerRef.current.localDescription))
                                }}>Copy Code</legend>



                            <input type='text' style={{ minHeight: "max-content", minWidth: "315px", display: "inline-block", textShadow: "0 0 5px rgba(0,0,0,0.1)" }} id="localDesc" readOnly placeholder='Click on create offer first...' />




                        </fieldset>

                        <fieldset ref={canvaContainerRefTwo} style={{ minHeight: "max-content" }}>

                            <legend>Paste Remote Description:</legend>
                            {/* ths is for copying the code which is created after starting receiver */}
                            {/* <legend style={{ position: "relative", float: "right", cursor: "pointer", transition: "transform 0.1s ease" }}
                                onClick={(e) => {
                                    console.log(JSON.stringify(props.peerRef.current.localDescription))
                                    window.navigator.clipboard.writeText(JSON.stringify(props.peerRef.current.localDescription))
                                    e.currentTarget.style.transform = "scale(0.95)";
                                    setTimeout(()=>{
                                        e.currentTarget.style.transform = "scale(1)";
                                    },2000)
                                }}>Copy Code</legend> */}





                            <textarea style={{ minHeight: "max-content", minWidth: "315px", resize: "none", textShadow: "0px 0px 1px black", fontFamily: "monospace", }} spellCheck={false} className='code-description' placeholder='Paste code from other Device here & click consume...'></textarea>


                            <section style={{ display: "flex", columnGap: "var(--max-margin)", justifyContent: "center" }}>
                                <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={startReceiver}>
                                    2. Consume Offer</button>
                                <button style={{ display: "flex", height: "100%", paddingBlock: "var(--max-padding)", justifyContent: "center", visibility: props.localConnectionStatus ? "hidden" : "visible", cursor: "pointer" }} onClick={applyRemoteDescription}>3. Finalize Connection</button>

                            </section>




                        </fieldset>





                        {/* <h4>Paste Remote Description:</h4>
                        <textarea className='code-description' id="remoteDesc"></textarea>
                        <button onClick={applyRemoteDescription}>Set Remote Description</button> */}

                    </div>
                )}



            </div>




        </div>
    )
}

export default WebRTCQrPage
