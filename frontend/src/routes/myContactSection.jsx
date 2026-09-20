import { aiProfile, CountryMap } from "../controllers/allCountries"
import { userStore } from "../zustand/userStore"
import { socketStore } from "../zustand/socket"

export const MyRecentContactSection = () => {

    // store holds this as a dictionary: { [id]: { id, username, country, unread } }
    const availableConnectedUsersMap = userStore((state) => state.availableConnectedUsers)
    const availableConnectedUsers = Object.values(availableConnectedUsersMap || {})

    if (availableConnectedUsers.length === 0) {
        return (
            <div className="any-label" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                No recent connections
            </div>
        )
    }

    return (
        <div className="users-container">
            {
                availableConnectedUsers.map((user) => {

                    const countryData = CountryMap.get(user.country);

                    return (
                        <div
                            onClick={() => {

                                if (!socketStore.getState().isActive()) {
                                    return console.error("socket is not ready")
                                }

                                // clears unread flag + decrements unreadCount inside the store itself
                                userStore.getState().markRead(user.id)

                                socketStore.getState().socket.send(
                                    JSON.stringify({
                                        sender: {
                                            username: userStore.getState().username,
                                            id: userStore.getState().id,
                                            country: userStore.getState().country
                                        },
                                        receiver: {
                                            username: user.username,
                                            id: user.id,
                                            country: user.country
                                        },
                                        type: "query-message",
                                        queryType: "chat-list-demand"
                                    })
                                )
                            }}
                            key={user.id}
                        >
                            <div style={{
                                backgroundImage: (user.country === "nocountry")
                                    ? `url(${aiProfile.profileImage})`
                                    : 'url("default_user_photo.png")'
                            }}>
                            </div>
                            <div>
                                <div>
                                    {user.username}
                                </div>
                                <div>
                                    <section></section> <section>{(user.country === "nocountry") ? "" : user.country}</section>
                                </div>
                            </div>
                            <div>
                                <section style={{
                                    backgroundImage: (user.country === "nocountry")
                                        ? 'url("default_user_photo.png")'
                                        : (countryData?.png ? `url(${countryData.png})` : 'url("default_user_photo.png")')
                                }}></section>
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
    )
}