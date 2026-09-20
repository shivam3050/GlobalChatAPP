import { aiProfile, CountryMap } from "../controllers/allCountries"
import { userStore } from "../zustand/userStore"
import { socketStore } from "../zustand/socket"

export const UserSection = () => {

    const availableUsers = userStore((state) => state.availableUsers);
    console.log(userStore.getState().availableUsers)

    if (!Array.isArray(availableUsers) || availableUsers.length === 0) {
        return (
            <div className="any-label" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                No users online
            </div>
        )
    }

    return (
        <div className="users-container my-contact-field-container" data-online-users-count={availableUsers.length}>
            {
                availableUsers.map((user) => {

                    const countryData = CountryMap.get(user.country);

                    return (
                        <div
                            className="hovereffectbtn"
                            key={user.id}
                            onClick={() => {

                                if (!socketStore.getState().isActive()) {
                                    return console.error("socket is not ready")
                                }

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
                                    <section></section>
                                    <section>{(user.country === "nocountry") ? "" : user.country}</section>
                                </div>
                            </div>

                            <div>
                                <section style={{
                                    backgroundImage: (user.country === "nocountry")
                                        ? 'url("default_user_photo.png")'
                                        : (countryData?.png ? `url(${countryData.png})` : 'url("default_user_photo.png")')
                                }}></section>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}