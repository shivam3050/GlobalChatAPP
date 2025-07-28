export const userRef = {

    username: "",
    id: "",
    // age: null,
    // gender: "",
    country: "",
    availableConnectedUsersUnreadLength :0,
    availableConnectedUsers: [
        {
            username: "",
            id: "",
            // age: null,
            // gender: "",
            country: "",
            unread: false
        }
    ],
    availableUsers: [
        {
            username: "",
            id: "",
            // age: null,
            // gender: "",
            country: "",
            unread: false
        }
    ],
    focusedContact: {

        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
        unread: false

    }

}


export const chatsRef = {
    sender: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
    },
    receiver: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
    },
    availableChats: [
        {
            senderId: "",
            receiverId: "",
            content: "",
            createdAt: ""
        }
    ]
}
