import React, { useEffect, useRef, useState } from 'react'
import { ChatSection } from './chat';


function ChatsRoute(props) {
    const attachmentFileRef = useRef(null)





    const [selectedReceiver, setSelectedReceiver] = useState("")


    useEffect(() => {
        if (props.userRef.current.focusedContact.username) {

            setSelectedReceiver(props.userRef.current.focusedContact.username)


        }
    }, [props.refreshChatsFlag])



    let scrollHandler = null;
    let lastScrollTop = 0;

    function enableTextBoxOnBlur(e) {
        const inputEl = e.currentTarget;
        lastScrollTop = window.scrollY || document.documentElement.scrollTop;

        scrollHandler = () => {
            const st = window.scrollY || document.documentElement.scrollTop;

            if (st < lastScrollTop) {
                inputEl.blur();

                // ✅ Remove listener immediately after blur
                window.removeEventListener("scroll", scrollHandler);
                scrollHandler = null;
            }

            lastScrollTop = Math.max(st, 0);
        };

        window.addEventListener("scroll", scrollHandler, { passive: true });
    }






    return (
        <aside className="user-vs-chat-container" >
            <ChatSection userRef={props.userRef} chatRef={props.chatRef} socketContainer={props.socketContainer} refreshChatsFlag={props.refreshChatsFlag} chatsDivRef={props.chatsDivRef} />
            <form className="formCreateChat" action="" method="post"
                onSubmit={(e) => {

                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const message = formData.get("message")

                    if (!props.socketContainer.current || props.socketContainer.current.readyState !== 1) {
                        console.error("socket is not ready")
                        return
                    }

                    const date = new Date()
                    const timestamp = date.getTime()




                    const localTimeOnly = date.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    });
                    const file = attachmentFileRef.current.files[0]

                    if (file) {
                        const chatsDiv = props.chatsDivRef.current

                        const chatField = document.createElement("div")

                        if (props.userRef.current.id !== props.userRef.current.focusedContact.id) {
                            chatField.style.alignSelf = "flex-end"
                        }
                        else {
                            chatField.style.alignSelf = "flex-start"
                        }

                        chatField.classList.add("newly-unupdated-chats")

                        const chatTextField = document.createElement("pre")
                        chatTextField.style.textDecoration = "underline";

                        const chatStatusField = document.createElement("div")

                        chatTextField.textContent = `Name: ${file.name} `

                        chatStatusField.textContent = `${localTimeOnly}`

                        chatField.appendChild(chatTextField)

                        chatField.appendChild(chatStatusField)

                        chatField.classList.add("background-gradient-in-chat")

                        chatsDiv.appendChild(chatField)

                        chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })




                        const metadata = {

                            type: "file-meta-data-to-server",
                            createdAt: timestamp,

                            message: { filesize: file.size, filename: file.name },
                            receiver: props.userRef.current.focusedContact,
                            // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country }
                            sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country }
                        };

                        const filename = props.userRef.current.id + "_" + props.userRef.current.focusedContact.id + "_" + timestamp + "_" + file.name;

                        props.chatRef.current.filesToBeSent[filename] = file;
                        console.log("see from send ", filename)


                        // first send metadata
                        props.socketContainer.current.send(JSON.stringify(metadata));

                        attachmentFileRef.current.value = "";
                        const attachmentButton = e.currentTarget.querySelector(".attachment");

                        // Now you can manipulate it, e.g., change innerHTML
                        attachmentButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
    <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
</svg>`;



                        return
                    }

                    if(message.trim()==="") return;

                    const chatsDiv = props.chatsDivRef.current

                    const chatField = document.createElement("div")

                    if (props.userRef.current.id !== props.userRef.current.focusedContact.id) {
                        chatField.style.alignSelf = "flex-end"
                    }
                    else {
                        chatField.style.alignSelf = "flex-start"
                    }

                    chatField.classList.add("newly-unupdated-chats")

                    const chatTextField = document.createElement("pre")

                    const chatStatusField = document.createElement("div")

                    chatTextField.textContent = message

                    chatStatusField.textContent = `${localTimeOnly}`

                    chatField.appendChild(chatTextField)

                    chatField.appendChild(chatStatusField)

                    chatField.classList.add("background-gradient-in-chat")

                    chatsDiv.appendChild(chatField)

                    chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })


                    props.socketContainer.current.send(
                        JSON.stringify(
                            {
                                type: "message",

                                message: message,
                                starAiRecentChatContextStack: (props.chatRef.current?.starAiRecentChatContextStack),
                                createdAt: timestamp,
                                receiver: props.userRef.current.focusedContact,
                                // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country }
                                sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country }
                            }
                        )
                    )
                    const textarea = e.target.querySelector('[name="message"]');

                    textarea.value = ""
                    textarea.focus()

                }}>
                <div>
                    <textarea

                        spellCheck="false"

                        onFocus={(e) => { enableTextBoxOnBlur(e) }}




                        style={{ resize: "none" }} placeholder={`Send to ${selectedReceiver}...`} name="message" maxLength="50000">

                    </textarea>
                    <button className="attachment" type="button" onClick={(e) => {
                        if (attachmentFileRef.current.files.length > 0) {
                            attachmentFileRef.current.value = ""
                            e.currentTarget.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                                                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
                                                        </svg>`

                            return
                        }
                        attachmentFileRef.current.click()


                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                        </svg>
                    </button>
                    <input ref={attachmentFileRef} style={{ display: "none" }} type="file" name="" onChange={(e) => {
                        if (e.currentTarget.files.length > 0) {
                            e.currentTarget.parentElement.querySelector('.attachment').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                                                        </svg>`
                        } else {
                            e.currentTarget.parentElement.querySelector('.attachment').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                                                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
                                                        </svg>`
                        }
                    }} />
                </div>
                <div>
                    <button type="submit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                        </svg>
                    </button>
                </div>
            </form>



            <div className="chats-overlay"
                style={
                    {
                        display: props.chatsOverlay ? "flex" : "none",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "absolute",
                        height: "100%",
                        width: "100%",
                        backgroundColor: "var(--chats-overlay-color)",
                        color: "rgba(255,0,0,0.6)",
                        fontSize: "20px",
                        fontWeight: "bold",
                        textShadow: "2px 2px 2px var(--dark-black)"

                    }
                }
            >
                user is now offline !
            </div>
        </aside>

    )
}

export default ChatsRoute
