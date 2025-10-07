export const userRef = {

    username: "",
    id: "",
    // age: null,
    // gender: "",
    country: "",
    yourGlobalStarAiReference: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
        isAiCallingOn: {instance:null,flag:false},
        unread: false
    },
    availableConnectedUsersUnreadLength: 0,

    availableConnectedUsers: [
        {
            username: "",
            id: "",
            // age: null,
            // gender: "",
            country: "",
            transcriptinput: "",
            textoutput:"",
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
    ],
    starAiRecentChatContextStack: [
        // {
        //     "role": "user",
        //     "parts": [{ "text": "" }]
        // }
    ],
    starAiRecentVoiceContextStack: [
        // {
        //     "role": "user",
        //     "parts": [{ "text": "" }]
        // }
    ]
}
