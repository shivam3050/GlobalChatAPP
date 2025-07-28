import React, { useEffect, useState } from 'react'
import { ChatSection } from './chat';


function ChatsRoute(props) {


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
            <ChatSection userRef={props.userRef} chatRef={props.chatRef} refreshChatsFlag={props.refreshChatsFlag} chatsDivRef={props.chatsDivRef} />
            <form className="formCreateChat" action="" method="post"
                onSubmit={(e) => {

                    e.preventDefault();
                    const formData = new FormData(e.target);
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
                                createdAt: timestamp,
                                receiver: props.userRef.current.focusedContact,
                                // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country }
                                sender: { username: props.userRef.current.username, id: props.userRef.current.id,  country: props.userRef.current.country }
                            }
                        )
                    )
                    const textarea = e.target.querySelector('[name="message"]');

                    textarea.value = ""
                    textarea.focus()

                }}>
                <div>
                    <textarea required

                        spellCheck="false"

                        onFocus={(e) => { enableTextBoxOnBlur(e) }}


                        style={{ resize: "none" }} placeholder={`Send to ${selectedReceiver}...`} name="message" maxLength="500">

                    </textarea>
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
