import { useRef } from 'react'
import { ChatSection } from './chat';
import { socketStore } from '../zustand/socket';
import { userStore } from '../zustand/userStore';
import { chatStore } from '../zustand/chatStore';
import { chatsDivRef, textToSpeechContainerRef } from '../utilitiesCompo/refs.js';


function ChatsRoute() {
    const attachmentFileRef = useRef(null)

    // subscribed: header placeholder and overlay update by themselves, no flags or local copies
    const focusedContact = userStore(s => s.focusedContact)
    const chatsOverlay = chatStore(s => s.chatsOverlay)



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
            {/* chat.jsx still receives these two so it keeps working until it is switched to the same imports */}
            <ChatSection chatsDivRef={chatsDivRef} textToSpeechContainerRef={textToSpeechContainerRef} />
            <form className="formCreateChat" action="" method="post"
                onSubmit={async (e) => {

                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const message = formData.get("message")

                    if (!socketStore.getState().isActive()) {
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

                    const previewInstance = attachmentFileRef.current.previewInstance

                    previewInstance?.remove();

                    if (file) {

                        const chatsDiv = chatsDivRef.current


                        const chatField = document.createElement("div")

                        if (userStore.getState().id !== userStore.getState().focusedContact.id) {
                            chatField.style.alignSelf = "flex-end"
                        }
                        else {
                            chatField.style.alignSelf = "flex-start"
                        }

                        chatField.classList.add("newly-unupdated-chats")

                        const chatTextField = document.createElement("pre")
                        chatTextField.classList.add("isLink")

                        const nameSpan = document.createElement("span")

                        nameSpan.textContent = file.name
                        const breaklineTag = document.createElement("br")
                        const sizeSpan = document.createElement("span")
                        const fileSizeText = (file.size < 1024) ? (Math.trunc(file.size * 100) / 100 + " B") : ((file.size < 1048576) ? (Math.trunc((file.size / 1024) * 100) / 100 + " KB") : (Math.trunc((file.size / 1048576) * 100) / 100 + " MB"));
                        sizeSpan.textContent = fileSizeText
                        chatTextField.append(nameSpan, breaklineTag, sizeSpan)



                        const chatStatusField = document.createElement("div")

                        chatStatusField.textContent = `${localTimeOnly}`

                        chatField.appendChild(chatTextField)

                        chatField.appendChild(chatStatusField)

                        chatField.classList.add("background-gradient-in-chat")

                        chatsDiv.appendChild(chatField)

                        chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

                        const attachmentButton = e.currentTarget.querySelector(".attachment");

                        // I WILL UPLOAD USING HTTP INSTEAD OF SOCKET

                        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload-file`, {
                            method: "POST",
                            headers: {

                                "Content-Type": "application/octet-stream",
                                "X-Filename": file.name,
                                "X-Custom-Access-Token": userStore.getState().customAccessToken,
                                "X-Sender-Id": userStore.getState().id,
                                "X-Receiver-Id": userStore.getState().focusedContact.id,
                                "X-Created-At": timestamp

                            },
                            body: file
                        })

                        console.log(await response.text())

                        // no need to check response here as if success then i will get message via socket

                        const filename = userStore.getState().id + "_" + userStore.getState().focusedContact.id + "_" + timestamp + "_" + file.name;

                        chatStore.getState().filesToBeSent[filename] = file;

                        attachmentFileRef.current.value = "";


                        attachmentButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
    <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
</svg>`;



                        return
                    }

                    if (message.trim() === "") return;

                    const chatsDiv = chatsDivRef.current

                    const chatField = document.createElement("div")

                    if (userStore.getState().id !== userStore.getState().focusedContact.id) {
                        chatField.style.alignSelf = "flex-end"
                    }
                    else {
                        chatField.style.alignSelf = "flex-start"
                    }

                    chatField.classList.add("newly-unupdated-chats")

                    const chatTextField = document.createElement("pre")

                    const chatStatusField = document.createElement("div")

                    chatTextField.textContent = message

                    const speakMessage = document.createElement("span")
                    speakMessage.textContent = "▶"
                    // give a class to it
                    speakMessage.classList.add("hovereffectbtn")
                    speakMessage.classList.add("playAnyMessageBtn")
                    speakMessage.onclick = () => textToSpeechContainerRef.current.forceSpeakFunction(message)

                    chatTextField.appendChild(speakMessage)

                    chatStatusField.textContent = `${localTimeOnly}`

                    chatField.appendChild(chatTextField)

                    chatField.appendChild(chatStatusField)

                    chatField.classList.add("background-gradient-in-chat")

                    chatsDiv.appendChild(chatField)

                    chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })


                    socketStore.getState().socket.send(
                        JSON.stringify(
                            {
                                type: "message",

                                message: message,
                                starAiRecentChatContextStack: (chatStore.getState().starAiRecentChatContextStack),
                                createdAt: timestamp,
                                receiver: userStore.getState().focusedContact,
                                sender: { username: userStore.getState().username, id: userStore.getState().id, country: userStore.getState().country }
                            }
                        )
                    )
                    const textarea = e.target.querySelector('[name="message"]');

                    textarea.value = ""
                    textarea.focus()

                }}>
                <div className='parentOfTextArea'>
                    <textarea

                        spellCheck="false"

                        onFocus={(e) => { enableTextBoxOnBlur(e) }}




                        style={{ resize: "none" }} placeholder={`Send to ${focusedContact.username}...`} name="message" maxLength="50000">

                    </textarea>
                    <button className="attachment" type="button" onClick={(e) => { // this is the file picker trigger button 

                        const previewInstance = attachmentFileRef.current.previewInstance

                        previewInstance?.remove();

                        if (attachmentFileRef.current.files.length > 0) {
                            attachmentFileRef.current.value = ""
                            e.currentTarget.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                                                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/>
                                                        </svg>`

                            return
                        }
                        attachmentFileRef.current.click()


                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-paperclip" viewBox="0 0 16 16">
                            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z" />
                        </svg>
                    </button>

                    <input ref={attachmentFileRef} style={{ display: "none" }} type="file" name="" onChange={(e) => { // this is actually file picker
                        if (e.currentTarget.files.length > 0) {

                            const inputPartDiv = e.currentTarget.parentElement // this is input part i am not selecting it by class name or id so if in future you update any elements then do carefully
                            const previewFloater = document.createElement("span")
                            previewFloater.style.cssText = `
                                display: inline-block;
                                position: absolute;
                                color: red;
                                width: clamp(100px, 50%, 500px);
                                height: calc(1.5*var(--nav-height));
                                border: 1px dotted black;
                                border-radius: 8px;
                                background: color-mix(in srgb, var(--darkest-black-user) 80%, transparent);
                                
                                bottom: calc(0.5*var(--nav-height));
                                left: 0px;
                                z-index: 10;
                                overflow: hidden;
                                word-break: break-all;
                                padding: var(--max-padding);
                                font-style: italic;
                                                            
                            `
                            

                            previewFloater.textContent = e.currentTarget.files[0].name
                            inputPartDiv.appendChild(previewFloater)
                            attachmentFileRef.current.previewInstance = previewFloater

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                        </svg>
                    </button>
                </div>
            </form>



            <div className="chats-overlay"
                style={
                    {
                        display: chatsOverlay ? "flex" : "none",
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