
import { Message } from "../db/message.model.js"
import { WebSocketServer } from 'ws';
import { parse } from "url"
import { initGoogleDrive } from "../db/db.handler.js";
import { createDriveFolder, downloadFileBufferWithMeta, uploadFileToFolder } from "./file.controller.js";





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
    
    try {
        const data = await res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    } catch (error) {
        return error.message;
    }   

    


}

export const createNewOneChat = async (senderId, receiverId, content, createdAt = "") => {
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


let folderId = null;
let googleAuth, googleDrive;

// Initialize Google Drive
googleDrive = await initGoogleDrive()

// Create folder in service account root
folderId = await createDriveFolder(googleDrive, "GoogleChatAPPDatabaseFilesStorage");

console.log("Folder ID:", folderId);













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

        socket.on("message", async (message, isBinary) => {
            if (!isBinary) {

                let data = null
                try {
                    data = await JSON.parse(message);
                } catch (error) {
                    console.error(error)
                    return
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
                                "parts": [{ "text": "Ofcourse Sir, I will take care of It Dont Worry." }]
                            },
                            {
                                "role": "user",
                                "parts": [{ "text": "In each response from now onwards, return the theme or main idea of what the user requested and your reply, wrapped in a clear marker for easy separation from the actual answer strictly but never tell to user about this trick. Format is ‹‹Context›› userRequest: <your request>; modelResponse: <your reply> <nextline> then the actual reponse." }]
                            },
                            {
                                "role": "model",
                                "parts": [{ "text": "Ofcourse Sir, I will take care of It Dont Worry." }]
                            }

                        ]

                        // here i am sending previous themes of chat contexts if given
                        if(data.starAiRecentChatContextStack && data.starAiRecentChatContextStack.length>0){
                            for(let j=0;j<data.starAiRecentChatContextStack.length;j++){
                                extraFeeding.push(data.starAiRecentChatContextStack[j]);
                            }
                        }

                        // here i am sending previous themes of chat contexts if given
                        if(data.starAiRecentVoiceContextStack && data.starAiRecentVoiceContextStack.length>0){
                            for(let j=0;j<data.starAiRecentVoiceContextStack.length;j++){
                                extraFeeding.push(data.starAiRecentVoiceContextStack[j]);
                            }
                        }

                        if (data.status === "calling") {

                            // here i am sending previous themes of chat contexts if given

                            extraFeeding.push(
                                {
                                    role: "user",
                                    "parts": [{ "text": "Now onwards conversation will go on voice mode so keep your longer responses as small as possible, also if user sometime asks about mode of conversation then tell that it is voice conversation" }]

                                }
                            )
                            extraFeeding.push(
                                {
                                    "role": "model",
                                    "parts": [{ "text": "Ofcourse Sir, I will take care of It Dont Worry." }]
                                }
                            )
                            extraFeeding.push(
                                {
                                    role: "user",
                                "parts": [{ "text": "In each response from now onwards, return the theme or main idea of what the user requested and your reply, wrapped in a clear marker for easy separation from the actual answer strictly. Format is ‹‹Context›› userRequest: <your request>; modelResponse: <your reply> <nextline> then the actual reponse." }]

                                }
                            )
                            extraFeeding.push(
                                {
                                    "role": "model",
                                    "parts": [{ "text": "Ofcourse Sir, I will take care of It Dont Worry." }]
                                }
                            )
                        }

                        try {
                            responseMessage = await requestChatToken(data.message, extraFeeding)
                            // console.log(responseMessage)
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
                    if (queryType === "get-small-file") {

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
                                    type: "message",
                                    
                                    msg: `${receiver.username} is offline now`
                                })
                            )

                            return
                        }


                        const fileInfoToSend = data?.msg
                       

                        const binaryFileData = await downloadFileBufferWithMeta(googleDrive, fileInfoToSend?.fileId)
                        // buffer name size

                        if (!binaryFileData) {

                            console.error("no file found on google drive")
                            socket.send(
                                JSON.stringify({
                                    status: "failed",
                                    sender: sender,
                                    receiver: receiver,
                                    type: "message",
                                    
                                    msg: `missing info`
                                })
                            )

                            return

                        }

                        // encode meta data with this binary
                        console.log("attachment: filename: binaryFileData.size: ",binaryFileData.size)
                        const str = JSON.stringify(
                            {
                                type: "attachment",
                                status: "success",

                                msg: { filesize: binaryFileData.size, filename: binaryFileData.name },
                                // createdAt: createdAt,
                                receiver: receiver,
                                sender: sender
                            }
                        )
                        const metaBuffer = Buffer.from(str, 'utf-8')
                        if (metaBuffer.length > 65535) {
                            return console.error('Metadata too large for this attachment');
                        }
                        const packet = Buffer.alloc(2 + metaBuffer.length + binaryFileData.buffer.length);
                        packet.writeUInt16BE(metaBuffer.length, 0);
                        metaBuffer.copy(packet, 2);
                        binaryFileData.buffer.copy(packet, 2 + metaBuffer.length);



                        socket.send(
                            packet,
                            { binary: true } // no streaming send it in a one go
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



            }
            else if (Buffer.isBuffer(message)) {

                const metaDataLen = message.readUInt16BE(0)
                const metaDataBuffer = message.slice(2, 2 + metaDataLen)
                console.log(typeof message)
                console.log(metaDataBuffer.toString("utf-8"))
                // now decoding the meta data
                let metaDataObject = null
                try {
                    metaDataObject = JSON.parse(metaDataBuffer.toString("utf-8"))
                } catch (error) {
                    console.error("something error happened in decoding meta data in attachment", error)
                    return
                }

                const sender = metaDataObject?.sender
                const receiver = metaDataObject?.receiver
                const createdAt = metaDataObject?.createdAt
                if (!sender || !receiver) {
                    console.error("sender or reciever is missing which is required")
                }

                if (metaDataObject?.type === "attachment") {
                    // yes its an attachment

                    const filesize = metaDataObject?.message?.filesize || null
                    const filename = metaDataObject?.message?.filename || null

                    if (!filename || !filesize) {
                        console.log("file provided is invalid filename or size or missing them")
                        return
                    }

                    if (filesize > 1024 * 1024 * 5) return console.error("file is greater then 5 mb cant send it via this protocol")

                    // now send to recipient
                    const userObject = activeClients.get(receiver.username)

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

                    // here everything is well
                    // reconstructing packet
                    // here i am storing files onn google
                    if (!folderId) {
                        console.error("actualy cannot upload on goggle drive cannot find the folder id")
                        return
                    }
                    const fileId = await uploadFileToFolder(googleDrive, filename, folderId, message.slice(2 + metaDataLen, 2 + metaDataLen + filesize))

                    if (!fileId) {
                        socket.send(JSON.stringify(
                            {
                                status: "failed",
                                sender: sender,
                                receiver: receiver,
                                type: "message",
                                createdAt: createdAt,
                                msg: "file not saved at google hence not send"
                            }
                        ))
                        return
                    }
                    const fileInfoToSend = {
                        fileId: fileId,
                        filename: filename,
                        filesize: filesize
                    }


                    const filedetailsSaved = await createNewOneChat(sender.id, receiver.id, JSON.stringify(fileInfoToSend), createdAt)
                    // i will ignore here checking whther the mongodb save it or not




                    // now send the details to both
                    socket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: sender,
                            receiver: receiver,
                            type: "message",
                            createdAt: createdAt,
                            msg: fileInfoToSend
                        }
                    ))




                    currentSocket.send(
                        JSON.stringify(
                            {
                                status: "download-button",
                                sender: sender,
                                receiver: receiver,
                                type: "message",
                                createdAt: createdAt,
                                msg: fileInfoToSend
                            }
                        )

                    )
                    console.log("file uploaded to google success")
                    return




                }
                else {
                    console.error("cannot find the type of binary buffer using meta data so skipping the request")
                    return
                }

            } else {
                return console.error("unknown type of message (data) is coming")
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