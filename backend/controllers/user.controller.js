
import { Message } from "../db/message.model.js"
import { WebSocketServer } from 'ws';
import { parse } from "url"




const requestChatToken = async (currentUserPrompt, fewHistory = null) => {

    let contents = [

        {
            "role": "user",
            "parts": [{ "text": currentUserPrompt }]
        }
    ]

    if (Array.isArray(fewHistory) && fewHistory.length > 0) {
        contents = [
            ...fewHistory,
            {
                "role": "user",
                "parts": [{ "text": currentUserPrompt }]
            }
        ]
    }


    const geminiChatModel = "gemini-2.5-flash";

    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${geminiChatModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "contents": contents
        })
    })

    if (!res.ok) {
        const errorData = await res.json()

        return errorData?.error?.message

    }
    const data = await res.json()

    return data["candidates"][0]["content"]["parts"][0]["text"]


}

export const createNewOneChat = async (senderId, receiverId, content, createdAt) => {
    try {
        const message = await Message.create({
            senderId: senderId,
            receiverId: receiverId,
            content: content,
            createdAt: createdAt
        })
        return message
    } catch (error) {
        console.error(error)
        return null
    }
}

export const getChatList = async (senderId, receiverId) => {
    try {
        const messages = await Message.find(
            {
                $or: [
                    {
                        senderId: senderId, receiverId: receiverId
                    },
                    {
                        senderId: receiverId, receiverId: senderId
                    }
                ]
            },
            { senderId: 1, receiverId: 1, content: 1, createdAt: 1, _id: 0 }
        ).sort({ createdAt: 1 })


        return messages
    } catch (error) {
        console.error(error)
        return null
    }
}

export const deleteUserAllChats = async (userId) => {
    try {
        await Message.deleteMany(
            {
                $or: [
                    {
                        senderid: userId
                    },
                    {
                        receiverid: userId
                    }
                ]
            })


        return true
    } catch (error) {
        console.log(error)
        return false
    }
}






class Client {
    static counter = 0;
    static lastTimeStamp = 0;

    constructor(
        username,
        //  age,
        //  gender,
        country,
        socket
    ) {
        this.username = username;

        this.socket = socket;
        // this.age = age,
        // this.gender = gender,
        this.country = country;
        this.id = this.generateId();

        if (typeof socket === "string") {

            this.textoutput = "";
            this.transcriptinput = "";
            this.isAiCallingOn = { instance: null, flag: false };

        }
        this.unread = false;

    }

    generateId() {
        const now = Date.now();
        if (now !== Client.lastTimeStamp) {
            Client.lastTimeStamp = now;
            Client.counter = 0;
        }
        return `${now}${Client.counter++}`;
    }
}
















const activeClients = new Map()

// first client will be stars ai
const StarAI = new Client("StarAI", "nocountry", "socket-to-StarAI")

activeClients.set("StarAI", StarAI)

export const newConnectionHandler = async (dbname, httpServer, allowedOrigin) => {

    const server = new WebSocketServer(
        {
            server: httpServer,
            verifyClient: (info, done) => {
                const origin = info.origin;
                let allowed = false
                for (let i = 0; i < allowedOrigin.length; i++) {
                    if (!(origin === allowedOrigin[i])) {
                        continue;
                    } else {
                        // console.log(origin)
                        done(true);
                        allowed = true
                        break
                    }


                }
                if (!allowed) {
                    // console.log('Connection rejected from origin:', origin);
                    done(false, 403, 'Forbidden');
                }


            }
        }
    );
    if (server) {
        console.log(`ws is running`)
    }
    server.on("connection", (socket, request) => {
        console.log("connected")

        // await new Promise((resolve) => {
        //     setTimeout(() => { resolve() }, 20000)
        // })


        const { query } = parse(request.url, true)
        const username = query.username

        // const gender = query.gender

        const country = query.country



        // const age = parseInt(query.age)

        // if (age < 18) {
        //     socket.close(1008, "age is less then 18")
        //     return
        // }
        const reservedUsernames = ["StarAI", "StarAi", "starai", "star_ai", "star.ai"]

        if (reservedUsernames.some(name => name === username)) {
            socket.close(1008, "this is a reserved username")
            return
        }
        const user = activeClients.has(username)

        if (user) {
            socket.close(1008, "a user already exists")
            return
        }
        // const availableUsers = [...activeClients.entries()].map(([username, client], _, __) => ({ username: client.username, age: client.age, gender: client.gender, country: client.country, id: client.id }))
        const availableUsers = [...activeClients.entries()].map(([username, client], _, __) => {

            return { username: client.username, country: client.country, id: client.id, unread: false }
        })
        // const client = new Client(username, age, gender, country, socket)
        const client = new Client(username, country, socket)

        activeClients.set(username, client);





        socket.send(JSON.stringify(
            {
                username: client.username,
                type: "register",
                // age: client.age,
                // gender: client.gender,
                country: client.country,
                id: client.id,

                availableUsers: availableUsers

            }
        ))

        socket.on("message", async (message) => {
            let data = null
            try {
                data = await JSON.parse(message);
            } catch (error) {
                console.error(error)
            }

            const sender = data?.sender
            const receiver = data?.receiver
            const type = data?.type
            const queryType = data?.queryType



            if (!type) {
                return console.error("type is not availbale")
            }


            else if (type === "message") {


                const createdAt = data?.createdAt

                const userObject = activeClients.get(receiver.username)



                if (receiver.id === StarAI.id) {





                    // this part will make a fetch request to gemini api

                    // send typing flag
                    socket.send(JSON.stringify(
                        {
                            status: "typing",
                            sender: StarAI,
                            receiver: sender,
                            type: "message",
                            // createdAt: createdAt,
                            msg: null
                        }
                    ))



                    let responseMessage = ""
                    let extraFeeding = [
                        {
                            "role": "user",
                            "parts": [{ "text": "Always call me Sir in every reply, like Jarvis and always behave like Jarvis, but never say that you are Jarvis. Stay concise. If asked your name, say StarAI. If asked who made you, say Shivam Kumar, if asked when say 2025." }]
                        },
                        {
                            "role": "model",
                            "parts": [{ "text": "Got it, Sir." }]
                        }

                    ]
                    if (data.status === "calling") {
                        extraFeeding.push(
                            {
                                role: "user",
                                "parts": [{ "text": "Now onwards conversation will go on voice mode so keep your longer responses as small as possible, also if user sometime asks about mode of conversation then tell that it is voice conversation" }]

                            }
                        )
                        extraFeeding.push(
                            {
                                "role": "model",
                                "parts": [{ "text": "Got it, Sir." }]
                            }
                        )
                    }

                    try {
                        responseMessage = await requestChatToken(data.message, extraFeeding)
                    } catch (error) {
                        console.error(error)
                        responseMessage = "There are Some Server Error in the StarAI."
                    }

                    let status = "success"

                    if ("calling" === data.status) {
                        status = "calling"

                        return socket.send(JSON.stringify(
                            {
                                status: status,
                                sender: StarAI,
                                receiver: sender,
                                type: "message",

                                msg: responseMessage
                            }
                        ))

                    }

                    

                    const yourChatCloudSaveResult = await createNewOneChat(sender.id, StarAI.id, data.message, createdAt)

                    const aiChatCloudSaveResult = await createNewOneChat(StarAI.id, sender.id, responseMessage, createdAt)
                    if (!aiChatCloudSaveResult || !yourChatCloudSaveResult) {

                        console.error("mongodb database is not storing chats")
                        responseMessage = "There are Some Server Error in the StarAI."
                    }
                    return socket.send(JSON.stringify(
                        {
                            status: status,
                            sender: StarAI,
                            receiver: sender,
                            type: "message",
                            createdAt: createdAt,
                            msg: responseMessage
                        }
                    ))
                }

                if (!userObject || userObject.id !== receiver.id) {

                    return socket.send(JSON.stringify(
                        {
                            status: "failed",
                            sender: sender,
                            receiver: receiver,
                            type: "message",
                            createdAt: createdAt,
                            msg: "user is now offline"
                        }
                    ))
                }

                const currentSocket = userObject.socket




                if (!currentSocket || currentSocket.readyState !== 1) {


                    return socket.send(JSON.stringify(
                        {
                            status: "failed",
                            sender: sender,
                            receiver: receiver,
                            type: "message",
                            createdAt: createdAt,
                            msg: "recievr is not ready"
                        }
                    ))
                }

                // current socket have something and ready
                if (data.status === "typing") {

                    return currentSocket.send(
                        JSON.stringify({
                            status: "typing",
                            sender: sender,
                            receiver: receiver,
                            type: "message",
                            // createdAt: createdAt,
                            msg: ""
                        })
                    )
                }



                const result = await createNewOneChat(sender.id, receiver.id, data.message, createdAt)

                if (!result) {
                    return socket.send(
                        JSON.stringify({
                            status: "failed",
                            sender: sender,
                            receiver: receiver,
                            type: "message",
                            createdAt: createdAt,
                            msg: "chat not created in db"
                        })
                    )
                }

                // here socket is ready 





                currentSocket.send(
                    JSON.stringify({
                        status: "success",
                        sender: sender,
                        receiver: receiver,
                        type: "message",
                        createdAt: createdAt,
                        msg: data.message
                    })
                )
                socket.send(
                    JSON.stringify({
                        status: "success",
                        sender: sender,
                        receiver: receiver,
                        createdAt: createdAt,
                        type: "message",
                    })
                )

                return


            }

            else if (type === "query-message") {

                if (queryType === "chat-list-demand") {

                    if (!sender || !receiver) {
                        return console.error("sender or recievr not provided")
                    }

                    const client = activeClients.get(receiver.username)

                    if (!client || client.id !== receiver.id) {
                        console.error("client id old not matched recievr id new")
                        socket.send(
                            JSON.stringify({
                                status: "failed",
                                sender: sender,
                                receiver: receiver,
                                type: type,
                                query: queryType,
                                msg: `${receiver.username} is offline now`
                            })
                        )

                        return
                    }


                    socket.send(
                        JSON.stringify({
                            status: "success",
                            sender: sender,
                            receiver: receiver,
                            type: type,
                            query: queryType,
                            msg: await getChatList(sender.id, receiver.id)
                        })
                    )
                    return
                }
                else if (queryType === "refresh-all-user") {
                    socket.send(
                        JSON.stringify({
                            status: "success",
                            sender: sender,
                            type: type,
                            query: queryType,
                            // msg: [...activeClients.entries()].map(([username, client], _, __) => ({ username: client.username, age: client.age, gender: client.gender, country: client.country, id: client.id })).filter((item, _, __) => (item.id !== sender.id))
                            msg: [...activeClients.entries()].map(([username, client], _, __) => ({ username: client.username, country: client.country, id: client.id })).filter((item, _, __) => (item.id !== sender.id))
                            // msg: await searchAllUsers()
                        })

                    )

                    return
                }
                else {

                    console.error("invalid query under the valid type")
                    return
                }




                return
            }
            else {
                return console.log("dont have any valid type")
            }




        });











        socket.on("close", async () => {
            console.log("Client disconnected");
            socket.close(1000, "logout you out")
            await deleteUserAllChats(username)
            activeClients.delete(username)
            return

        });

        socket.on("error", async (error) => {
            console.error("WebSocket error:", error);

            socket.close(1011, "logged you out due to some error")
            await deleteUserAllChats(username)
            activeClients.delete(username)
            return
        });
    });

    server.on("error", (error) => {
        console.error("WebSocket server error:", error);
        activeClients = null;
        return
    });
}