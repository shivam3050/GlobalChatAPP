import { useLayoutEffect, useState } from "react";
import { useEffect } from "react";


export const ChatSection = (props) => {

    

    const [availableChatsInUI, setAvailableChatsInUI] = useState([])

    useEffect(() => {

        setAvailableChatsInUI(props.chatRef.current.availableChats)

    }, [props.refreshChatsFlag])

        useLayoutEffect(() => {
        const chatDiv = props.chatsDivRef.current//document.getElementById("chats-div");
        chatDiv?.scrollTo({
            top: chatDiv.scrollHeight,
            behavior: "smooth"
        });
    }, [availableChatsInUI]);

    // if (!props.chatRef.current || props.chatRef.current.availableChats.length === 0) {
        
    //     return (<div id="chats-div" className="" style={{
    //         display: "flex", flexDirection: "column", justifyContent: "start", alignItems: "center"

    //     }}>
    //         <div className="any-label" style={{
    //             borderRadius: "calc(10*var(--med-border-radius))",
    //             textAlign: "center"
    //         }}>
    //             No chats there
    //         </div>
    //     </div>)
    // }

    // else {
        return <div id="chats-div" ref={props.chatsDivRef}>
            {
                availableChatsInUI.map((item, index) => {   //  senderId: data.sender.id, receiverId: data.receiver.id, content: data.msg, createdAt: data.createdAt
                    const originalTimestamp = new Date(item.createdAt)
                    const createdAt = originalTimestamp.toLocaleTimeString(
                        "en", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12 :true
                        }
                    )

                    return (
                        <div
                        
                            className={(item.senderId === props.userRef.current.id) ? "bakground-gradient-in-chat" : ""} 
                        style={
                            {

                                alignSelf: (item.senderId === props.userRef.current.id) ? ("flex-end") : ("flex-start")
                            }
                        } key={index}>

                            <p className="main-chat-text pre">

                                {item.content}

                            </p>

                            <div className="chatTextStatus">

                                {(item.senderId === props.userRef.current.id) ? (`✔ ${createdAt}`) : (createdAt)}
                            </div>

                        </div>
                    )
                })
            }
        </div>
    // }
}
