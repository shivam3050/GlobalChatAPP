
import { aiProfile, countries } from "../controllers/allCountries.js";
import { useState, useRef } from "react";
import Loading from "../utilitiesCompo/loading";
import { Outlet, useNavigate } from "react-router-dom";


export function Home(props) {
    const [selectedReceiver, setSelectedReceiver] = useState({ username: "", gender: "", age: null, id: "" })
    const [headerTitle, setHeaderTitle] = useState("Globet")
    const [toggleSelect, setToggleSelect] = useState(false)
    const inboxIconRef = useRef(null)
    const typingFlagRef = useRef({ setTimeoutId: null, element: null })
    const [signInLoadingFlag, setSignInLoadingFlag] = useState(false)
    const [signInErrorLog, setSignInErrorLog] = useState("")
    const navigate = useNavigate()

    const initializeConnection = (e, socketContainer, user, setUser, userRef, chatRef) => {
        e.preventDefault()
        setSignInLoadingFlag(true)

        const formData = new FormData(e.currentTarget);
        const username = formData.get("username")
        const country = formData.get("country")
        const label = e.currentTarget.lastElementChild;

        label.style.visibility = "visible"

        for (let i = 0; i < username.length; i++) {
            if (username[i] === ' ') {
                setSignInLoadingFlag(false)
                setSignInErrorLog("no spaces allowed in username")
                return
            }
        }

        try {
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
            console.log("WebSocket connected")
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
                    
                    userRef.current = {
                        username: data.username,
                        country: data.country,
                        id: data.id,
                        customAccessToken: data.customAccessToken,
                        availableConnectedUsersUnreadLength: 0,
                        yourGlobalStarAiReference: (data.availableUsers[0]?.username === "StarAI") ?
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
                        focusedContact: {},
                        availableConnectedUsers: [],
                        availableUsers: data.availableUsers || []
                    }
                    console.log("got it")
                    console.log(userRef.current.availableUsers)

                    props.setUser(userRef.current)
                    props.setRefreshUsersFlag((prev) => prev + 1)
                    props.setRefreshGlobalUsersFlag((prev) => prev + 1)
                    navigate("/users")
                    return
                }

        
                if (data.type === "query-message") {
                    const query = data.query


                    if (data.type === "query-message") {
              

                        if (data.query === "refresh-all-user") {
                            console.log("refreshing the users")

                            userRef.current.availableUsers =  data.msg || [];

                            navigate("/users")
                            props.setRefreshUsersFlag((prev) => prev + 1)
                            props.setRefreshGlobalUsersFlag((prev) => prev + 1)

                            setHeaderTitle("Globet")

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
                    }

                    console.error("invalid query but valid type in the response")
                    return
                }

                if (data.type === "message") {
                    if (data.sender.id === props.userRef.current.id) {
                        // Message sent by me
                        if (data.status === "failed") {
                            console.error("your msg has been failed", data.msg)
                            const chatsDiv = props.chatsDivRef.current
                            const pendingFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")
                            for (let i = 0; i < pendingFields.length; i++) {
                                pendingFields[i].children[1].textContent = `❌`
                                pendingFields[i].classList.remove("newly-unupdated-chats")
                            }
                            return
                        }

                        if (!(props.userRef.current.availableConnectedUsers.some((obj) => (obj.id === data.receiver.id)))) {
                            props.userRef.current.availableConnectedUsers.push({
                                username: data.receiver.username,
                                country: data.receiver.country,
                                id: data.receiver.id,
                                unread: false
                            })
                        }

                        const chatsDiv = props.chatsDivRef.current
                        const pendingFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")
                        for (let i = 0; i < pendingFields.length; i++) {
                            const date = new Date(Number(data.createdAt))
                            const createdAt = date.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            });
                            pendingFields[i].children[1].textContent = `✔ ${createdAt}`
                            pendingFields[i].classList.remove("newly-unupdated-chats")
                        }

                        return
                    }

                    if (data.sender.id === props.userRef.current.focusedContact?.id) {
                        // Message from focused contact
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

                        if (data.status === "success") {
                            // Remove typing indicator
                            if (typingFlagRef.current.element) {
                                clearTimeout(typingFlagRef.current.setTimeoutId)
                                const chatsDiv = props.chatsDivRef.current
                                if (chatsDiv.contains(typingFlagRef.current.element)) {
                                    chatsDiv.removeChild(typingFlagRef.current.element)
                                }
                                typingFlagRef.current.element = null
                            }

                            // Display message
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
                            chatTextField.textContent = data.msg

                            chatField.appendChild(chatTextField)

                            const chatStatusField = document.createElement("div")
                            chatStatusField.textContent = createdAt
                            chatStatusField.style.marginTop = "var(--max-margin)"
                            chatField.appendChild(chatStatusField)

                            chatsDiv.appendChild(chatField)
                            chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

                            return
                        }
                        return
                    }

                    if (data.sender.id !== props.userRef.current.focusedContact?.id){
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
                        return
                    }
                }
                if(data.type === "file-completed-response-from-server"){
                    // ye dono ke liye common rhega
                    // socket.send(JSON.stringify(
                    //     {
                    //         status: "success",
                    //         sender: sender,
                    //         receiver: receiver,
                    //         type: type,
                    //         createdAt: createdAt,
                    //         msg: "file received on server",
                    //         fileMetaDataInfo: fileMetaDataInfo
                    //     }
                    // ))  this is from server sucees stored file respose
                    
                    return;
                }
                
            }
        };
    }

    const controlUserCallback = async (e) => {
        const value = e.currentTarget.getAttribute("value")

        if (value === "close") {
            setToggleSelect(false)
            return
        }

        if (value === "username") {
            setToggleSelect(false)
            alert(props.userRef.current.username)
            return
        }

        if (value === "refreshallusers") {
            console.log(" refresh function cal hua")
            setToggleSelect(false)


            if (!props.socketContainer.current || props.socketContainer.current.readyState !== 1) {
                console.error("socket is not ready")
                props.userRef.current.yourGlobalStarAiReference.isAiCallingOn.flag = false;
                return
            }

            console.log("i am sending ok")

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

        if (value === "logout") {
            if (props.socketContainer?.current) {
                props.socketContainer.current.close(1000, "user logged out")
            }
            props.setUser(null)
            props.userRef.current = null
            props.chatRef.current = null
            setToggleSelect(false)
            return
        }
    }

    return (
        props.user ? (
            <div className="home dashboard">
                {/* header is always mounted in Home */}
                <header className="header">
                    {/* Back button for global users page */}
                    <div
                        style={{ visibility: (selectedReceiver.username || headerTitle !== "Globet") ? "visible" : "hidden", backgroundColor: "transparent" }}
                        onClick={() => {
                            setSelectedReceiver({ username: "", gender: "" });
                            if (props.chatRef.current.availableChats) props.chatRef.current.availableChats = []
                            if (props.chatRef.current.receiver) {
                                props.chatRef.current.receiver = { username: "", id: "", country: "" }
                                props.userRef.current.focusedContact = { username: "", id: "", country: "" }
                            }
                            navigate("/users")
                            setHeaderTitle("Globet")
                        }}
                        className="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                        </svg>
                    </div>

                    {/* Header title that is photo with username */}
                    <div className="profile-photo-and-username-in-header" style={{
                        fontFamily: "cursive",
                        color: "var(--professional-blue)",
                        fontWeight: "bold",
                        textShadow: "1px 1px 1px var(--dark-black)"
                    }}>
                        <div className="profile-photo-in-header" style={{
                            display: selectedReceiver.username ? "flex" : "none",
                            backgroundImage: (selectedReceiver.country === "nocountry") ? (`url(${aiProfile.profileImage})`) : 'url("default_user_photo.png")'
                        }}></div>
                        <i className={selectedReceiver.username ? "selected-username-holder" : ""}>{selectedReceiver.username || headerTitle}</i>
                    </div>

                    {/* This is inbox icon which takes yu to connected users page or recent msgs */}
                    <div
                        className={props.recentUnreadContactCount ? "svg-container-inbox-icon hovereffectbtn" : "inbox hovereffectbtn"}
                        data-recent-contact-unread-count={props.recentUnreadContactCount}
                        ref={inboxIconRef}
                        onClick={() => {
                            setSelectedReceiver({ username: "", id: "" });
                            props.userRef.current.focusedContact = {}
                            props.chatRef.current.availableChats = []
                            navigate("/mycontacts-and-notifications")
                            props.setRefreshGlobalUsersFlag((prev) => (prev + 1))
                            setHeaderTitle("Recent Connections")
                        }}>
                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M22.0002 6.66667C22.0002 5.19391 20.8062 4 19.3335 4H1.79015C1.01286 4 0.540213 4.86348 0.940127 5.53L3.00016 9V17.3333C3.00016 18.8061 4.19406 20 5.66682 20H19.3335C20.8062 20 22.0002 18.8061 22.0002 17.3333V6.66667ZM7.00016 10C7.00016 9.44772 7.44787 9 8.00016 9H17.0002C17.5524 9 18.0002 9.44772 18.0002 10C18.0002 10.5523 17.5524 11 17.0002 11H8.00016C7.44787 11 7.00016 10.5523 7.00016 10ZM8.00016 13C7.44787 13 7.00016 13.4477 7.00016 14C7.00016 14.5523 7.44787 15 8.00016 15H14.0002C14.5524 15 15.0002 14.5523 15.0002 14C15.0002 13.4477 14.5524 13 14.0002 13H8.00016Z" fill="currentColor"></path>
                        </svg>
                    </div>

                    {/* Menu controls, these are toggled manu controls */}
                    <section
                        onClick={() => setToggleSelect(true)}
                        id="controls"
                        className="button hovereffectbtn"
                        style={{ display: selectedReceiver.username ? "none" : "flex" }}>
                        <div>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none">
                                <path d="M12 20C11.45 20 10.9792 19.8042 10.5875 19.4125C10.1958 19.0208 10 18.55 10 18C10 17.45 10.1958 16.9792 10.5875 16.5875C10.9792 16.1958 11.45 16 12 16C12.55 16 13.0208 16.1958 13.4125 16.5875C13.8042 16.9792 14 17.45 14 18C14 18.55 13.8042 19.0208 13.4125 19.4125C13.0208 19.8042 12.55 20 12 20ZM12 14C11.45 14 10.9792 13.8042 10.5875 13.4125C10.1958 13.0208 10 12.55 10 12C10 11.45 10.1958 10.9792 10.5875 10.5875C10.9792 10.1958 11.45 10 12 10C12.55 10 13.0208 10.1958 13.4125 10.5875C13.8042 10.9792 14 11.45 14 12C14 12.55 13.8042 13.0208 13.4125 13.4125C13.0208 13.8042 12.55 14 12 14ZM12 8C11.45 8 10.9792 7.80417 10.5875 7.4125C10.1958 7.02083 10 6.55 10 6C10 5.45 10.1958 4.97917 10.5875 4.5875C10.9792 4.19583 11.45 4 12 4C12.55 4 13.0208 4.19583 13.4125 4.5875C13.8042 4.97917 14 5.45 14 6C14 6.55 13.8042 7.02083 13.4125 7.4125C13.0208 7.80417 12.55 8 12 8Z" fill="currentColor"></path>
                            </svg>
                        </div>

                        <aside style={{ right: toggleSelect ? "calc(var(--max-padding))" : "calc(-2 * var(--toggle-select-width))" }}>
                            <button onClick={(e) => { e.stopPropagation(); controlUserCallback(e) }} className="option hovereffectbtn" value="close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                </svg>
                            </button>

                            {/* REFRESH ALL USERS BUTTON */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setToggleSelect(false);
                                   
                                    controlUserCallback(e)
                                }}
                                className="option hovereffectbtn"
                                value="refreshallusers"
                                title="Refresh All Users">
                                <span style={{ fontSize: "16px" }}>👥</span>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); controlUserCallback(e) }} className="option hovereffectbtn" value="callai">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z" />
                                </svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); controlUserCallback(e) }} className="option hovereffectbtn" value="username" style={{ fontFamily: "cursive", color: "var(--professional-blue)", fontWeight: "bold" }}>
                                {props.userRef.current.username}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); controlUserCallback(e) }} className="option hovereffectbtn" value="logout">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
                                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
                                </svg>
                            </button>
                        </aside>
                    </section>

                    {/* RTC button (hidden by default) */}
                    <section
                        className="button hovereffectbtn"
                 
                        style={{ display: "none" }}
                        >
                        
                    </section>
                </header>

                <Outlet /> 
                {/* this is overlay shown when user is offline */}
                <section className="dashboard-overlay"
                    style={{ display: toggleSelect ? "block" : "none" }}
                    onClick={() => setToggleSelect(false)}>
                </section>
            </div>
        ) : (
            <div className="home container-sign-in">
                <section className="signin-box">
                    <label>Register & Go!</label>
                    <form id="register-form" autoComplete="off" action="" className="inputs" onSubmit={(e) => {
                        initializeConnection(e, props.socketContainer, props.user, props.setUser, props.userRef, props.chatRef)
                    }}>
                        <fieldset>
                            <legend>Username</legend>
                            <input required type="text" name="username" />
                        </fieldset>

                        <section className="selectbar-container">
                            <fieldset>
                                <legend>Country</legend>
                                <select className="country-selector-signin" name="country" defaultValue="United States">
                                    <option style={{ visibility: "hidden" }} value="">{"▼"}</option>
                                    {countries.map((country, index) => (
                                        <option key={index} value={country.countryName}>
                                            {country.countryName}
                                        </option>
                                    ))}
                                </select>
                            </fieldset>
                        </section>

                        <input type="submit" spellCheck={false} name="submitbtn" value="Go" style={{ backgroundColor: "green" }} />

                        <label style={{ visibility: "hidden" }}>
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