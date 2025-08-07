import { useEffect, useState } from "react"



export const MyRecentContactSection = (props) => {

 





    const [updateAvailableConnectedUsersInUI, setUpdateAvailableConnectedUsersUsersInUI] = useState([])

    useEffect(() => {
        if (props.userRef.current.availableConnectedUsers) {
            setUpdateAvailableConnectedUsersUsersInUI(props.userRef.current.availableConnectedUsers)
        }

        return


    }, [props.refreshUsersFlag])



    if (!props.userRef || !props.userRef.current.availableConnectedUsers || props.userRef.current.availableConnectedUsers.length === 0) {
        return (<div className="any-label"
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            No recent connections

        </div>)
    }



    return <div className="users-container">
        {
            updateAvailableConnectedUsersInUI.map((user, index) => {
              
                return (
                    <div
                        onClick={
                            () => {


                                if (props.userRef.current.availableConnectedUsers[index].unread) {

                                    props.userRef.current.availableConnectedUsersUnreadLength -= 1

                                    props.setRecentUnreadContactCount(props.userRef.current.availableConnectedUsersUnreadLength)


                                }


                                if (!props.socketContainer?.current || props.socketContainer.current.readyState !== 1) {
                                    return console.error("socket is not ready")
                                }

                                props.userRef.current.availableConnectedUsers[index].unread = false

                                props.socketContainer.current.send(
                                    JSON.stringify(
                                        {
                                            // sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country },
                                            // receiver: { username: user.username, id: user.id, country: user.country, gender: user.gender },
                                            sender: { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country },
                                            receiver: { username: user.username, id: user.id, country: user.country },
                                            type: "query-message",
                                            queryType: "chat-list-demand"
                                        }
                                    )
                                )

                            }
                        }
                        key={index}>
                        <div style={{
                            // backgroundImage: `url(${user.gender === "male" ? "male_small.png" : "female_small.png"})`
                            backgroundImage: (user.country==="nocountry") ? (`url(${aiProfile.profileImage})`): url("default_user_photo.png")
                            

                        }}>

                        </div>
                        <div>
                            <div>
                                {user.username}
                            </div>
                            <div>
                                <section></section> <section>{(user.country==="nocountry")?"":user.country}</section>


                            </div>
                        </div>
                        <div>
                            <section style={{ backgroundImage: `url(${props.CountryMap.get(user.country)?.png})` }}></section>

                        </div>


                        <div className="unread-highlight-container">
                            <div className={user.unread ? "unread-notification-highlight-icon" : ""}>

                            </div>
                        </div>
                    </div>
                )
            })
        }
    </div>

}