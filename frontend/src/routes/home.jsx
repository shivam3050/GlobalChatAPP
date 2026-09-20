import { aiProfile, countries } from "../controllers/allCountries.js";
import { useState } from "react";

import Loading from "../utilitiesCompo/loading";
import { Outlet, useNavigate } from "react-router-dom";
import { useRef } from "react";

import { startChromeOfflineVoiceRecognition } from "../utilitiesCompo/toolFunctions.js";
import { socketStore } from "../zustand/socket.jsx";
import { userStore } from "../zustand/userStore.jsx";
import { chatStore } from "../zustand/chatStore.jsx";
import { chatsDivRef, rtcbuttonRef, webRTCContainerRef, textToSpeechContainerRef } from "../utilitiesCompo/refs.js";
import { webRTCStartFunction } from "../utilitiesCompo/webRTC.js";


export function Home(props) {

    // ---------- zustand subscriptions (these re-render Home when the value changes) ----------
    const id = userStore(s => s.id)
    const username = userStore(s => s.username)
    const focusedContact = userStore(s => s.focusedContact)
    const unreadCount = userStore(s => s.unreadCount)


    // states to update only ui and none
    const [headerTitle, setHeaderTitle] = useState("Globet")

    const [toggleSelect, setToggleSelect] = useState(false)

    const inboxIconRef = useRef(null)

    const typingFlagRef = useRef({ setTimeoutId: null, element: null })

    const [signInLoadingFlag, setSignInLoadingFlag] = useState(false)

    const [signInErrorLog, setSignInErrorLog] = useState("")



    const navigate = useNavigate();


    const initializeConnection = (
        e
    ) => {


        e.preventDefault()

        setSignInLoadingFlag(true)


        const formData = new FormData(e.currentTarget);
        const username = formData.get("username")
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

        userStore.setState({ username: username, country: country })

        if (socketStore.getState().isActive()) {
            console.log("socket is already active")
            setSignInLoadingFlag(false)
            return;
        }

        if (!socketStore.getState().initSocket()) {
            console.log("cannot init socket");
            setSignInLoadingFlag(false)
            setSignInErrorLog("unknown error")
            return;
        }

        const socket = socketStore.getState().socket;

        socket.onclose = (event) => {
            console.error(event.reason)
            setSignInLoadingFlag(false)
            setSignInErrorLog(event.reason)
        };

        socket.onerror = (event) => {
            console.error(event.reason)
            setSignInLoadingFlag(false)
            setSignInErrorLog(event.reason)
        };

        socket.onopen = () => {
            console.log("Socket connected successfully");
        };
        socket.onmessage = async (message) => {

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

                    userStore.setState({

                        username: data.username,

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
                                country: "",
                                transcriptinput: "",
                                isAiCallingOn: { instance: null, flag: false },
                                textoutput: "",
                                unread: false
                            },

                        unreadCount: 0,

                        availableUsers: data.availableUsers || [],

                        availableConnectedUsers: {}
                    })
                    console.log("first time variable set all users also there ,", data.availableUsers)

                    return
                }

                if (data.type === "query-message") {

                    if (data.query === "refresh-all-user") {


                        userStore.setState({ availableUsers: data.msg || [] })

                        navigate("/users")

                        setHeaderTitle("Globet")

                        return
                    }
                    if (data.query === "chat-list-demand") {

                        if (data.sender.id !== userStore.getState().id) {
                            //this is not for me  which i have queried when click on a user
                            console.error("query respose is not for me, someone else queried")
                            return
                        }

                        // this is my answer of query

                        if (data.status === "failed") {

                            chatStore.getState().setChatsOverlay(true)

                            userStore.getState().setFocusedContact(data.receiver)

                            chatStore.getState().openChat(data.sender, data.receiver, [])

                            navigate("/chats")

                            setHeaderTitle("")

                            return
                        }

                        chatStore.getState().setChatsOverlay(false)

                        userStore.getState().setFocusedContact(data.receiver)

                        // contact opened, so its unread badge is cleared
                        userStore.getState().markRead(data.receiver.id)

                        chatStore.getState().openChat(data.sender, data.receiver, (data.msg && data.msg.length) ? data.msg : [])

                        navigate("/chats")
                        return
                    }
                }
                if (data.type === "message") {

                    if (data.sender.id === userStore.getState().id) {
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
                            const { success, reused } = await textToSpeechContainerRef.current.initAudioCaptureFunction(); // dont fear about init, if it already exists, it will not reinite it will just use the same
                            if (success) {
                                console.log("message came and int function returned success whwen i was trying send its audio")
                                // const ttsTrack = textToSpeechContainerRef.current.outputStream.getAudioTracks()[0];

                                textToSpeechContainerRef.current.forceSpeakWithCaptureAndStream(data.msg)
                                return
                            } else {
                                console.log("message came but init fucntion did not retrurn success so i cannot send audio")
                            }

                            //textToSpeechContainerRef.current.forceSpeakWithCaptureAndStream(data.msg)



                            return
                        }

                        if (data.status === "failed") {


                            // below is failed for text msg

                            console.error("your msg has been failed", data.msg)

                            const chatsDiv = chatsDivRef.current


                            const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                            for (let i = 0; i < pendinGlobetFields.length; i++) {

                                pendinGlobetFields[i].children[1].textContent = `❌`

                                pendinGlobetFields[i].classList.remove("newly-unupdated-chats")
                            }

                            return
                        }



                        // this part is now for success normal messages

                        // adds receiver in my contacts if not already there (does nothing if present)
                        userStore.getState().addContact(data.receiver)



                        const chatsDiv = chatsDivRef.current


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

                    if (data.sender.id === userStore.getState().focusedContact.id) {

                        // ai is the sender , must listen 
                        //calling
                        if (data.status === "calling" && userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag) {
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
                            textToSpeechContainerRef.current.forceSpeakFunction(filteredText.replace(/\*/g, '').trim())
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


                            const chatsDiv = chatsDivRef.current

                            if (typingFlagRef.current.element) {

                                clearTimeout(typingFlagRef.current.setTimeoutId)


                                typingFlagRef.current.setTimeoutId = setTimeout(() => {

                                    if (typingFlagRef.current.element && chatsDiv.contains(typingFlagRef.current.element)) {
                                        chatsDiv.removeChild(typingFlagRef.current.element)
                                    }
                                    typingFlagRef.current.element = null

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

                                if (typingFlagRef.current.element && chatsDiv.contains(typingFlagRef.current.element)) {
                                    chatsDiv.removeChild(typingFlagRef.current.element)
                                }
                                typingFlagRef.current.element = null

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
                            const chatsDiv = chatsDivRef.current

                            if (typingFlagRef.current.element && chatsDiv.contains(typingFlagRef.current.element)) {

                                clearTimeout(typingFlagRef.current.setTimeoutId)
                                chatsDiv.removeChild(typingFlagRef.current.element)
                                typingFlagRef.current.element = null
                                typingFlagRef.current.setTimeoutId = null


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


                                    chatStore.getState().starAiRecentChatContextStack.push(
                                        {
                                            "role": "user",
                                            "parts": [{ "text": userPart }]
                                        }
                                    )
                                    chatStore.getState().starAiRecentChatContextStack.push(
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
                                    strong.style.display = "inline"
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
                                    // full line is kept (comments and urls are no longer cut)
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

                                if (!startCode && line.length > 4 && line.slice(0, 2) === "**" && line.slice(-2) === "**") {
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


                        const chatsDiv = chatsDivRef.current
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
                        speakMessage.onclick = () => textToSpeechContainerRef.current.forceSpeakFunction(data.msg)

                        chatTextField.appendChild(speakMessage)


                        chatField.appendChild(chatTextField)


                        const chatStatusField = document.createElement("div")
                        chatStatusField.textContent = createdAt
                        chatStatusField.style.marginTop = "var(--max-margin)"

                        chatField.appendChild(chatStatusField)



                        chatsDiv.appendChild(chatField)

                        chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

                        return

                    }


                    if (data.sender.id !== userStore.getState().focusedContact.id) {


                        // ai is the sender , must listen 
                        if (data.status === "calling" && userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag) {
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

                                        chatStore.getState().starAiRecentVoiceContextStack.push(
                                            {
                                                "role": "user",
                                                "parts": [{ "text": userPart }]
                                            }
                                        )
                                        chatStore.getState().starAiRecentVoiceContextStack.push(
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


                                await textToSpeechContainerRef.current.forceSpeakFunction(filteredText)

                                // speaking call again listening function

                                if (webRTCContainerRef.current.recogniserStreamObjectRef && webRTCContainerRef.current.recogniserStreamObjectRef.recogniser) {
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
                            if (!socketStore.getState().isActive()) {
                                console.error("socket is not ready")
                                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag = false;
                                // buttonEl.style.backgroundColor = "transparent"
                                return
                            }



                            socketStore.getState().socket.send(JSON.stringify({
                                type: "message",
                                status: "calling",
                                starAiRecentVoiceContextStack: (chatStore.getState().starAiRecentVoiceContextStack),
                                message: userStore.getState().yourGlobalStarAiReference.transcriptinput,

                                receiver: userStore.getState().yourGlobalStarAiReference,
                                sender: { username: userStore.getState().username, id: userStore.getState().id, country: userStore.getState().country }


                            }))


                            return // just play the part and do nothing for status = calling response
                        }



                        // THIS IS THE CONDITION WHERE RECEIVER IS NOT FOCUSED BUT MESSAGE CAME FROM HIM


                        if (data.status === "failed" || data.status === "calling" || data.status === "typing") {
                            console.error("this is failed message by any random or known user who is unfocused or this error you may see when not focused and status == calling")
                            // this error you may see when not focused and status == calling
                            return
                        }


                        // adds sender in contacts if absent, marks unread, and bumps unreadCount only if it was not already unread. O(1)
                        userStore.getState().markUnread(data.sender)

                        return
                    }




                    return
                }


                if (data.type === "file-completed-response-from-server") { // this is saying file is received completely
                    if (data.sender.id === userStore.getState().id) {
                        // you was the sender yourself
                        if (data.status === "failed") {// this is failed for file upload
                            console.error("meta data not found in server", data.msg)

                            const chatsDiv = chatsDivRef.current


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
                        chatStore.getState().filesToBeSent[data.fileMetaDataInfo.upcomingFilename] = null;

                        const chatsDiv = chatsDivRef.current


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
                                        "X-Custom-Access-Token": userStore.getState().customAccessToken,
                                        "X-Sender-Id": userStore.getState().id,
                                        "X-Receiver-Id": userStore.getState().focusedContact.id,
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
                            }





                            pendinGlobetFields[i].children[1].textContent = `✔ ${createdAt}`

                            pendinGlobetFields[i].classList.remove("newly-unupdated-chats")

                        }

                        // this is finally exiting and your file is uploded

                        return

                    }
                    if (data.sender.id === userStore.getState().focusedContact.id) {
                        if (data.status === "failed") {// this is failed for file upload
                            console.error("the impossible case happening , as there is no protocol which tell you that unsuccessfull file is received", data.msg)

                            const chatsDiv = chatsDivRef.current


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

                        const chatsDiv = chatsDivRef.current
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

                        chatTextField.classList.add("isLink")

                        chatTextField.onclick = async () => {

                            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-file`, {
                                method: "POST",
                                headers: {


                                    "X-Modified-Filename": data.upcomingFilename,
                                    "X-Custom-Access-Token": userStore.getState().customAccessToken,
                                    "X-Sender-Id": userStore.getState().id,
                                    "X-Receiver-Id": userStore.getState().focusedContact.id,
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
                    if (data.sender && data.sender.id !== userStore.getState().focusedContact.id) {


                        // THIS IS THE CONDITION WHERE RECEIVER IS NOT FOCUSED BUT MESSAGE CAME FROM HIM


                        if (data.status === "failed") {
                            console.error("impossible case is happening again, no protocol was there which send failed file link to receiver")
                            return
                        }

                        // same O(1) helper as text messages
                        userStore.getState().markUnread(data.sender)

                        return
                    }

                    return
                }
                if (data.type === "download-file-response-from-server") {
                    if (data.status === "failed") {
                        console.error("cannot download the file", data.msg)
                        return
                    }

                    socketStore.isStillDownloading = true
                    socketStore.downloadChunks = [];
                    socketStore.downloadBytesReceived = 0;
                    socketStore.downloadTotalBytes = data.fileMetaDataInfo.fileSize;
                    socketStore.downloadFilename = data.fileMetaDataInfo.filename;
                    console.log("filename ", data.fileMetaDataInfo.filename)
                    console.log("filesize ", data.fileMetaDataInfo.fileSize)



                    return
                }

                // reached only for a string message with an unknown data.type
                console.error("invalid data type in response")
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


            if (!socketStore.getState().isActive()) {

                console.error("socket is not ready")

                return
            }

            socketStore.getState().socket.send(
                JSON.stringify(
                    {
                        type: "query-message",
                        queryType: "refresh-all-user",
                        sender: { username: userStore.getState().username, id: userStore.getState().id }
                    }
                )
            )



            return
        }
        if (e.currentTarget.getAttribute("value") === "logout") {
            setToggleSelect(false)


            if (!socketStore.getState().isActive()) {
                window.location.href = '/';
                return
            }
            const ws = socketStore.getState().socket
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.onopen = null;
            ws.close()
            socketStore.setState({ socket: null })

            userStore.getState().reset()
            chatStore.getState().clearChat()

            setHeaderTitle("Globet")

            navigate("/")

            return
        }
        if (e.currentTarget.getAttribute("value") === "callai") {

            const buttonEl = e.currentTarget;


            //cleared/stoped any initaily speaking text
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel()
                return
            }





            if (userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag) { // checking whether ai already listening and if the stoping it
                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.instance?.stop()
                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }

            try {

                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag = true;
                buttonEl.style.backgroundColor = "red"
                const ok = await startChromeOfflineVoiceRecognition(props.userRef)
                if (!ok) {
                    // buttonEl.style.backgroundColor = "transparent"
                    return console.error("no text detected.")
                }


            } catch (error) {
                console.error("transripter is not working right now", error)
                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }

            if (!socketStore.getState().socket || socketStore.getState().socket.readyState !== 1) {
                console.error("socket is not ready")
                userStore.getState().yourGlobalStarAiReference.isAiCallingOn.flag = false;
                buttonEl.style.backgroundColor = "transparent"
                return
            }



            socketStore.getState().socket.send(JSON.stringify({
                type: "message",
                status: "calling",
                message: userStore.getState().yourGlobalStarAiReference.transcriptinput,

                receiver: userStore.getState().yourGlobalStarAiReference,
                sender: { username: userStore.getState().username, id: userStore.getState().id, country: userStore.getState().country }


            }))




            return
        }

        return

    }


    return (

        id ? (
            <div className="home dashboard" >

                <header className=" header"

                >
                    {/* above is the black header */}
                    <div
                        style={{ visibility: (focusedContact.username || headerTitle !== "Globet") ? "visible" : "hidden", backgroundColor: "transparent" }}
                        onClick={
                            () => {

                                chatStore.getState().clearChat()

                                userStore.getState().clearFocusedContact()

                                navigate("/users")


                                setHeaderTitle("Globet")
                            }
                        }
                        className="button">
                        {/* this is the back button */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                        </svg>
                    </div>

                    {/* below div is profile photo and username of header */}

                    <div
                        className="profile-photo-and-username-in-header" style={{
                            fontFamily: "cursive",
                            color: "var(--professional-blue)",
                            fontWeight: "bold",
                            textShadow: "1px 1px 1px var(--dark-black)"
                        }}

                    >
                        <div className="profile-photo-in-header" style={{
                            display: focusedContact.username ? "flex" : "none",
                            backgroundImage: (focusedContact.country === "nocountry") ? (`url(${aiProfile.profileImage})`) : 'url("default_user_photo.png")'

                        }}>

                        </div>
                        <i className={focusedContact.username ? "selected-username-holder" : ""}>{focusedContact.username || headerTitle}</i></div>


                    {/* below div is the div to recent contacts */}
                    <div
                        className={unreadCount ? "svg-container-inbox-icon hovereffectbtn" : "inbox hovereffectbtn"}
                        data-recent-contact-unread-count={unreadCount}
                        ref={inboxIconRef}

                        onClick={
                            (e) => {

                                userStore.getState().clearFocusedContact()
                                chatStore.getState().clearChat()

                                navigate("/mycontacts-and-notifications")
                                setHeaderTitle("Recent Connections")



                            }
                        }
                    >
                        {/* this is div to recent contact */}

                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" fill="none">

                            <path fillRule="evenodd" clipRule="evenodd" d="M22.0002 6.66667C22.0002 5.19391 20.8062 4 19.3335 4H1.79015C1.01286 4 0.540213 4.86348 0.940127 5.53L3.00016 9V17.3333C3.00016 18.8061 4.19406 20 5.66682 20H19.3335C20.8062 20 22.0002 18.8061 22.0002 17.3333V6.66667ZM7.00016 10C7.00016 9.44772 7.44787 9 8.00016 9H17.0002C17.5524 9 18.0002 9.44772 18.0002 10C18.0002 10.5523 17.5524 11 17.0002 11H8.00016C7.44787 11 7.00016 10.5523 7.00016 10ZM8.00016 13C7.44787 13 7.00016 13.4477 7.00016 14C7.00016 14.5523 7.44787 15 8.00016 15H14.0002C14.5524 15 15.0002 14.5523 15.0002 14C15.0002 13.4477 14.5524 13 14.0002 13H8.00016Z" fill="currentColor"></path>
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
                        style={{ display: focusedContact.username ? "none" : "flex" }}

                    >
                        <div>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" fill="none">

                                <path d="M12 20C11.45 20 10.9792 19.8042 10.5875 19.4125C10.1958 19.0208 10 18.55 10 18C10 17.45 10.1958 16.9792 10.5875 16.5875C10.9792 16.1958 11.45 16 12 16C12.55 16 13.0208 16.1958 13.4125 16.5875C13.8042 16.9792 14 17.45 14 18C14 18.55 13.8042 19.0208 13.4125 19.4125C13.0208 19.8042 12.55 20 12 20ZM12 14C11.45 14 10.9792 13.8042 10.5875 13.4125C10.1958 13.0208 10 12.55 10 12C10 11.45 10.1958 10.9792 10.5875 10.5875C10.9792 10.1958 11.45 10 12 10C12.55 10 13.0208 10.1958 13.4125 10.5875C13.8042 10.9792 14 11.45 14 12C14 12.55 13.8042 13.0208 13.4125 13.4125C13.0208 13.8042 12.55 14 12 14ZM12 8C11.45 8 10.9792 7.80417 10.5875 7.4125C10.1958 7.02083 10 6.55 10 6C10 5.45 10.1958 4.97917 10.5875 4.5875C10.9792 4.19583 11.45 4 12 4C12.55 4 13.0208 4.19583 13.4125 4.5875C13.8042 4.97917 14 5.45 14 6C14 6.55 13.8042 7.02083 13.4125 7.4125C13.0208 7.80417 12.55 8 12 8Z" fill="currentColor"></path>
                            </svg>
                        </div>


                        <aside style={{
                            right: toggleSelect ? "calc(var(--max-padding))" : "calc(-2 * var(--toggle-select-width))",


                        }}>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                </svg>
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="callai">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-openai" viewBox="0 0 16 16">
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
                            ><i className="selected-username-holder-noborder">{username}</i></button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="refresh" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
                                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                                    <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
                                </svg>Sync
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option hovereffectbtn" value="logout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px', color: "red" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-left" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z" />
                                    <path fillRule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
                                </svg> Logout
                            </button>
                        </aside>


                    </section>



                    {/* below is call button for rtc */}

                    <section
                        className="button hovereffectbtn" ref={rtcbuttonRef}
                        style={{ display: "none" }}
                        onClick={() => { webRTCStartFunction("mediastream") }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone-plus-fill" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877zM12.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H13v1.5a.5.5 0 0 1-1 0V4h-1.5a.5.5 0 0 1 0-1H12V1.5a.5.5 0 0 1 .5-.5" />
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
                            e
                        )

                    }}>

                        <fieldset>

                            <legend>Username</legend>
                            <input required type="text" name="username" />

                        </fieldset>

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