import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"


export const UserSection = (props) => {





    const [updateAvailableUsersInUI, setUpdateAvailableUsersInUI] = useState([])

    useEffect(() => {
        if (props.userRef.current.availableUsers) {
            setUpdateAvailableUsersInUI(props.userRef.current.availableUsers)
        }

        return


    }, [props.refreshGlobalUsersFlag])



    // if (!props.userRef || !props.userRef.current.availableUsers || props.userRef.current.availableUsers.length === 0) {
    //     return (<div className="any-label"
    //         style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    //     >
    //         No users active

    //     </div>)
    // }



    return <div className="users-container my-contact-field-container" data-online-users-count={updateAvailableUsersInUI.length}>
        {

            updateAvailableUsersInUI.map((user, index) => {
                return (
                    <div
                        onClick={
                             () => {

                                //  I WILL FIX THIS LATER

                                // if (props.userRef.current.availableUsers[index].unread) {

                                //     props.userRef.current.availableConnectedUsersUnreadLength -= 1

                                //     props.setRecentUnreadContactCount(props.userRef.current.availableConnectedUsersUnreadLength)


                                // }




                                if (!props.socketContainer?.current || props.socketContainer.current.readyState !== 1) {
                                    return console.error("socket is not ready")
                                }
                                props.socketContainer.current.send(
                                    JSON.stringify(
                                        {
                                            // sender: { username: props.userRef.current.username, id: props.userRef.current.id, age: props.userRef.current.age, gender: props.userRef.current.gender, country: props.userRef.current.country },
                                            // receiver: { username: user.username, id: user.id, age: user.age, gender: user.gender, country: user.country },
                                            sender: { username: props.userRef.current.username, id: props.userRef.current.id,  country: props.userRef.current.country },
                                            receiver: { username: user.username, id: user.id,  country: user.country },
                                            type: "query-message",
                                            queryType: "chat-list-demand"
                                        }
                                    )
                                )

                            }
                        }
                        key={index}>
                        <div style={{
                            backgroundImage: `url("default_user_photo.png")`

                        }}>

                        </div>
                        <div>
                            <div>
                                {user.username}
                            </div>
                            <div>
                                <section>
                                    {/* {`Age ${user.age} yrs`} */}
                                    </section> <section>{user.country}</section>
                                
                                
                            </div>
                        </div>
                        <div>
                            <section style={{backgroundImage:`url(${props.CountryMap.get(user.country).png})`}}></section>

                        </div>
                    </div>
                )
            })
        }
    </div>

}