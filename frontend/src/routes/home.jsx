
import { countries } from "../controllers/allCountries.js";
import { useState } from "react";

import Loading from "../utilitiesCompo/loading";
import { Outlet, useNavigate } from "react-router-dom";
import { useRef } from "react";
import WebRTCQrPage from "./WebRTCQrPage.jsx";


export function Home(props) {
    // states to update only ui and none
    const [selectedReceiver, setSelectedReceiver] = useState({ username: "", gender: "", age: null, id: "" })

    const [headerTitle, setHeaderTitle] = useState("Globet")

    const [toggleSelect, setToggleSelect] = useState(false)

    const inboxIconRef = useRef(null)

    const [signInLoadingFlag, setSignInLoadingFlag] = useState(false)

    const [signInErrorLog, setSignInErrorLog] = useState("")

    // for local

    const [localConnectionStatus, setLocalConnectionStatus] = useState(false)






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
        } catch (error) {

            setSignInLoadingFlag(false)
            setSignInErrorLog("unknown error")
            console.error(error)
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

                    availableConnectedUsersUnreadLength: 0,

                    availableUsers: data.availableUsers || [],

                    availableConnectedUsers: []
                }





                setUser(data.username)
                return
            }

            if (data.type === "query-message") {

                if (data.query === "refresh-all-user") {


                    userRef.current.availableUsers = data.msg || []



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
                        console.error("query respose is not for me")
                        return
                    }










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




                    setSelectedReceiver(userRef.current.focusedContact)


                    props.setRefreshChatsFlag(prev => prev + 1)

                    navigate("/chats")

                    // userRef.current.availableUsers.unread = false

                    return
                }
                console.error("invalid query but valid type in the respnse")
                return
            }

            if (data.type === "message") {




                if (data.sender.id === userRef.current.id) {

                    if (data.status === "failed") {

                        console.error("your msg has been failed", data.msg)

                        const chatsDiv = props.chatsDivRef.current


                        const pendinGlobetFields = chatsDiv.querySelectorAll(".newly-unupdated-chats")

                        for (let i = 0; i < pendinGlobetFields.length; i++) {

                            pendinGlobetFields[i].children[1].textContent = `❌`

                            pendinGlobetFields[i].classList.remove("newly-unupdated-chats")
                        }

                        return
                    }



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

                        const date = new Date(data.createdAt)

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
                    // THIS IS THE PART WHERE RECEIVER IS FOCUSED AND MSG CAME FROM HIM

                    if (data.status === "failed") {
                        console.error("recieved failed msg by a sender to me")
                        return
                    }



                    const date = new Date(data.createdAt)

                    const createdAt = date.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    });




                    const chatsDiv = props.chatsDivRef.current

                    const chatField = document.createElement("div")

                    chatField.style.alignSelf = "flex-start"

                    const chatTextField = document.createElement("pre")

                    const chatStatusField = document.createElement("div")

                    chatTextField.textContent = data.msg

                    chatStatusField.textContent = createdAt

                    chatField.appendChild(chatTextField)

                    chatField.appendChild(chatStatusField)

                    chatsDiv.appendChild(chatField)

                    chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })






                    return
                }


                if (data.receiver && data.sender.id !== userRef.current.focusedContact?.id) {



                    // THIS IS THE CONDITION WHERE RECEIVER IS NOT FOCUSED BUT MESSAGE CAME FROM HIM


                    if (data.status === "failed") {
                        console.error("this is failed message by any random or known user who is unfocused")
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

            console.error("invalid data type in response")
            return

        }
    }












    const controlUserCallback = (e) => {




        setToggleSelect(false)


        if (e.target.value === "close") {
            return
        }
        if (e.target.value === "refresh") {


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
        if (e.target.value === "logout") {



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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                        </svg>
                    </div>

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
                            backgroundImage: `url("default_user_photo.png")`
                        }}>

                        </div>
                        <i className={selectedReceiver.username ? "selected-username-holder" : ""}>{selectedReceiver.username || headerTitle}</i></div>


                    <div
                        className={props.recentUnreadContactCount ? "svg-container-inbox-icon" : "inbox"}
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

                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class="" fill="none">

                            <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0002 6.66667C22.0002 5.19391 20.8062 4 19.3335 4H1.79015C1.01286 4 0.540213 4.86348 0.940127 5.53L3.00016 9V17.3333C3.00016 18.8061 4.19406 20 5.66682 20H19.3335C20.8062 20 22.0002 18.8061 22.0002 17.3333V6.66667ZM7.00016 10C7.00016 9.44772 7.44787 9 8.00016 9H17.0002C17.5524 9 18.0002 9.44772 18.0002 10C18.0002 10.5523 17.5524 11 17.0002 11H8.00016C7.44787 11 7.00016 10.5523 7.00016 10ZM8.00016 13C7.44787 13 7.00016 13.4477 7.00016 14C7.00016 14.5523 7.44787 15 8.00016 15H14.0002C14.5524 15 15.0002 14.5523 15.0002 14C15.0002 13.4477 14.5524 13 14.0002 13H8.00016Z" fill="currentColor"></path>
                        </svg>

                    </div>



                    <section

                        onClick={
                            () => {

                                setToggleSelect(true)

                            }
                        }
                        id="controls"
                        className="button"
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
                            } className="option" value="close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                </svg>
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option " value="username"
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
                            } className="option" value="refresh" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
                                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                                    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
                                </svg>Sync
                            </button>
                            <button onClick={
                                (e) => { e.stopPropagation(); controlUserCallback(e) }
                            } className="option" value="logout" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: '10px', color: "red" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-left" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z" />
                                    <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
                                </svg> Logout
                            </button>
                        </aside>


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


            props.localuser ? (<WebRTCQrPage

                peerRef={props.peerRef}
                callerChannelRef={props.callerChannelRef}
                receiverChannelRef={props.receiverChannelRef}
                localConnectionStatus={localConnectionStatus}
                setLocalConnectionStatus={setLocalConnectionStatus}
                setLocaluser={props.setLocaluser}
                localuser={props.localuser}

            />) : (
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
                                <input required type="text" name="username" />

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

                            <section className="selectbar-container" defaultValue="">
                                <fieldset >

                                    <legend>Country</legend>
                                    <select className="country-selector-signin" name="country" required>
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
                        <button
                            style={{ backgroundColor: "var(--professional-blue)", textShadow: "0px 0px 10px white", position: "absolute", borderRadius: "50%", width: "50px", height: "50px", display: "flex", justifyContent: "center", alignItems: "center", top: "0", transform: "translateX(-50%)" }}
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



        )




    );
}