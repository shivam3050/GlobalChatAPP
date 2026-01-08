
import { Message } from "../db/message.model.js"
import { WebSocketServer } from 'ws';
import { parse } from "url"
import { initGoogleDrive } from "../db/db.handler.js";
import { createDriveFolder } from "./file.controller.js";
import fs from 'fs';
import path from "path";






export const requestChatToken = async (currentUserPrompt, fewHistory = null) => {

   

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
        console.log(errorData?.error?.message)

        return "StarAI is busy right now , so it cannot response to you."

    }

    try {
        const data = await res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    } catch (error) {
        return error.message;
    }




}

export const createNewOneChat = async (senderId, receiverId, content, createdAt = "", isLink = false, fileSize = 0) => {
    try {
        const message = await Message.create({
            senderId: senderId,
            receiverId: receiverId,
            content: content,
            createdAt: createdAt,
            isLink: isLink,
            fileSize: fileSize
        })
        return message
    } catch (error) {
        console.error(error)
        return null
    }
}

export const getChatList = async (senderId, receiverId) => {
    // await Message.updateMany(
    //     { isLink: { $exists: false } },
    //     { $set: { isLink: false, fileSize: 0 } }
    // )
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
            { senderId: 1, receiverId: 1, content: 1, createdAt: 1, isLink: 1, fileSize: 1, _id: 0 }
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
export const deleteAllAssociatedFiles = async (userid, dir) => {
    try {

        if (dir != "handlingFilesDir") return false



        const client = activeClients.get(userid)
        const fileKeyword = client.id

        fs.readdir(dir, (err, files) => {
            if (err) throw err;

            files.forEach(file => {
                if (file.includes(fileKeyword)) {
                    fs.unlink(path.join(dir, file), err => {
                        if (err && err.code !== 'ENOENT') throw err;
                    });
                }
            });
        });



        return true
    } catch (error) {
        console.log(error)
        return false
    }
}
export const deleteOneFile = (path) => {
    try {
        const ans = fs.unlink(path);
        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

export const createReadStreamOfAFile = (filepath) => {
    if (!fs.existsSync(filepath)) {
        console.log("File not exist");
        return null;
    }


    console.log("File exist");
    return { readStream: fs.createReadStream(filepath), fileSize: fs.statSync(filepath).size };
}
export const filesGarbageCollectorFunction = async (dir) => {
    try {
        const files = await fs.promises.readdir(dir); // returns array of file names
        const mins = 20 * 60000;

        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stats = await fs.promises.stat(fullPath);

                if (stats.isFile() && (Date.now() - stats.birthtime.getTime() > mins)) { // greater then 20 minutes
                    await fs.promises.unlink(fullPath); // delete old file
                    console.log('Deleted:', file);
                }
            } catch {
                // this means its not a file its a dir so skip it , although this case is never going to happend because i have not kept any dir there
            }
        }
    } catch {
        return
    }

};






class Client {
    static counter = 0;
    static lastTimeStamp = 0;

    constructor(
        username,
        //  age,
        //  gender,
        country,
        socket,
        fileMetaDataInfo = null
    ) {
        this.username = username;
        this.fileMetaDataInfo = fileMetaDataInfo;

        this.socket = socket;
        // this.age = age,
        // this.gender = gender,
        this.country = country;
        this.id = this.generateId();
        this.customAccessToken = this.simpleHash(this.id.toString())

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
    simpleHash(text) {

        if (!text || text.length === 0) {
            return null;
        }

        let hash = 0n; // Use BigInt to avoid overflow issues
        for (let i = 0; i < text.length; i++) {
            hash = (hash * 31n + BigInt(text.charCodeAt(i))) & 0xFFFFFFFFFFFFn; // Keep within 48 bits
        }

        // Convert BigInt to hex string (lowercase)
        let hex = hash.toString(16);

        // Pad with leading zeros to make it exactly 16 characters
        return hex.padStart(16, '0').slice(-16);
    }
}


let folderId = null;
let googleAuth, googleDrive;

// Initialize Google Drive
googleDrive = await initGoogleDrive()

// Create folder in service account root
folderId = await createDriveFolder(googleDrive, "GoogleChatAPPDatabaseFilesStorage");

console.log("Folder ID:", folderId);



const rootDir = process.cwd();

export const handlingFilesDir = path.join(rootDir, 'handlingFilesDir');

// Create directory if it doesn't exist
if (!fs.existsSync(handlingFilesDir)) {
    fs.mkdirSync(handlingFilesDir);
    console.log('Assets directory created at:', handlingFilesDir);
} else {
    console.log('Assets directory already exists at:', handlingFilesDir);
}


let running = false;




export const filesGarbageCollectorInterval = setInterval(async () => {
    if (!running) {
        running = true;
        console.log("files garbage collector is running!")
        await filesGarbageCollectorFunction(handlingFilesDir);
        running = false;
    }
}, 2 * 60000); // 2 minutes frequency













export const activeClients = new Map()

// first client will be stars ai
const StarAI = new Client("StarAI", "nocountry", "socket-to-StarAI")

activeClients.set(StarAI.id, StarAI)
console.log("StartAi is active")

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
        console.log("a user just connected")

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
        // const user = activeClients.has(id)

        // if (user) {
        //     socket.close(1008, "a user already exists")
        //     return
        // }
        // const availableUsers = [...activeClients.entries()].map(([username, client], _, __) => ({ username: client.username, age: client.age, gender: client.gender, country: client.country, id: client.id }))
        const availableUsers = [...activeClients.entries()].map(([username, client], _, __) => {


            return { username: client.username, country: client.country, id: client.id, unread: false }
        })
        // const client = new Client(username, age, gender, country, socket)
        const client = new Client(username, country, socket)
        socket.id = client.id;

        activeClients.set(client.id, client); //     KEY VALUE , ID : AND CLIENT







        socket.send(JSON.stringify(
            {
                username: client.username,
                type: "register",
                // age: client.age,
                // gender: client.gender,
                country: client.country,
                id: client.id,
                customAccessToken: client.customAccessToken,

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


                else if (type === "message") { // , i am introducing messageSubType
                    //                                                              text-just-forward
                    //                                                              triple-text-to-ai
                    //                                                              


                    const createdAt = data?.createdAt

                    const userObject = activeClients.get(receiver.id)

                    // if type is a mesage so its sure it is came to someone
                    // so first check receiver
                    // its sure that same will never going to send msg to itself, if i want i will update in future



                    if (receiver.id === StarAI.id) {
                        // if(data.messageSubType==="text-just-forward"){
                        //     return
                        // }
                        if (data?.messageSubType === "triple-text-to-ai") {
                            let responseMessage = ""
                            let extraFeeding = [
                                {
                                    role: "user",
                                    "parts": [{ "text": "You are constrained to reply within 10 words max." }]

                                },
                                {
                                    "role": "model",
                                    "parts": [{ "text": "Okay Sir." }]
                                }

                            ]


                            try {
                                if(data.message.length>0){
                                    responseMessage = await requestChatToken(data.message, extraFeeding)
                                }
                                // console.log(responseMessage)
                            } catch (error) {
                                console.error(error)
                                responseMessage = "StarAI is busy right now , cannot response to you."
                            }

                            if (!userObject || userObject.id !== receiver.id) {
                                console.log("receiver: ", receiver)

                                return socket.send(JSON.stringify(
                                    {
                                        status: "failed",
                                        sender: sender,
                                        receiver: receiver,
                                        type: "message",
                                        messageSubType: "triple-text-from-ai",
                                        createdAt: createdAt,
                                        msg: "your receiver gone now offline"
                                    }
                                ))
                            }

                            // const currentSocket = userObject.socket

                            // if (!currentSocket || currentSocket.readyState !== 1) {
                            //     console.log("receiverr: ", receiver)
                            //     console.log("readystate ",currentSocket.readyState)


                            //     return socket.send(JSON.stringify(
                            //         {
                            //             status: "failed",
                            //             sender: sender,
                            //             receiver: receiver,
                            //             type: "message",
                            //             messageSubType: "triple-text-from-ai",
                            //             createdAt: createdAt,
                            //             msg: "your receiver gone now offline"
                            //         }
                            //     ))
                            // } // here i am sending response to you only later i will bicast to both using udp
                            return socket.send(
                                JSON.stringify({
                                    status: "success",
                                    sender: sender,
                                    receiver: receiver,
                                    type: "message",
                                    messageSubType: "triple-text-from-ai",
                                    // createdAt: createdAt,
                                    msg: responseMessage
                                })
                            )
                            




                        } else {   // all cases behaveving normal

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
                            if (data.starAiRecentChatContextStack && data.starAiRecentChatContextStack.length > 0) {
                                for (let j = 0; j < data.starAiRecentChatContextStack.length; j++) {
                                    extraFeeding.push(data.starAiRecentChatContextStack[j]);
                                }
                            }

                            // here i am sending previous themes of chat contexts if given
                            if (data.starAiRecentVoiceContextStack && data.starAiRecentVoiceContextStack.length > 0) {
                                for (let j = 0; j < data.starAiRecentVoiceContextStack.length; j++) {
                                    extraFeeding.push(data.starAiRecentVoiceContextStack[j]);
                                }
                            }

                            if (data.status === "calling") {

                                // here i am sending previous themes of chat contexts if given

                                extraFeeding.push(
                                    {
                                        role: "user",
                                        "parts": [{ "text": "Now onwards conversation will go on voice mode so keep your responses as small as possible, also if user sometime asks about mode of conversation then tell that it is voice conversation" }]

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

                        const client = activeClients.get(receiver.id)

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


                        return socket.send(
                            JSON.stringify({
                                status: "success",
                                sender: sender,
                                receiver: receiver,
                                type: type,
                                query: queryType,
                                msg: await getChatList(sender.id, receiver.id)
                            })
                        )

                    }


                    else if (queryType === "refresh-all-user") {
                        console.log("i have sent the refresh user query")
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
                    else if (queryType === "offer") {
                        const presentSender = activeClients.get(sender?.id)
                        const presentReceiver = activeClients.get(receiver?.id)
                        if (!presentReceiver || !presentSender) {
                            console.error("sender or receiver are gone")
                            return
                        }

                        presentReceiver.socket.send(JSON.stringify({
                            type: "query-message",
                            query: "offer",
                            d: data.d,
                            sender: presentSender,
                            receiver: presentReceiver,
                            ttsTrackId: data?.ttsTrackId
                        }))


                        return
                    }
                    else if (queryType === "answer") {
                        const presentSender = activeClients.get(sender?.id)
                        const presentReceiver = activeClients.get(receiver?.id)
                        if (!presentReceiver || !presentSender) {
                            console.error("sender or receiver are gone , restart process")
                            return
                        }

                        presentReceiver.socket.send(JSON.stringify({
                            type: "query-message",
                            query: "answer",
                            d: data.d,
                            sender: presentSender,
                            receiver: presentReceiver,
                            ttsTrackId: data?.ttsTrackId
                        }))


                        return
                    }
                    else if (queryType === "ice") {
                        const presentSender = activeClients.get(sender?.id);
                        const presentReceiver = activeClients.get(receiver?.id);

                        if (!presentReceiver || !presentSender) {
                            console.error("sender or receiver are gone during ICE exchange");
                            return;
                        }

                        // Forward ICE candidate to receiver
                        presentReceiver.socket.send(JSON.stringify({
                            type: "query-message",
                            d: data.d,
                            query: "ice",
                            sender: presentSender,
                            receiver: presentReceiver
                        }));
                        return
                    }
                    else {

                        console.error("invalid query under the valid type")
                        return
                    }




                    return
                }
                else if (type === "file-meta-data-to-server") {
                    // sender 
                    // receiver
                    // type
                    // message: { filesize: file.size, filename: file.name },
                    const upcomingFileInfo = data.message;

                    let upcomingFilename = upcomingFileInfo.filename;

                    const upcomingFilesize = upcomingFileInfo.filesize;

                    // this is used
                    upcomingFilename = sender.id + "_" + receiver.id + "_" + data.createdAt + "_" + upcomingFilename; //modified uniquefilename





                    // this is used
                    const upcomingFilestream = fs.createWriteStream(path.join(handlingFilesDir, upcomingFilename));

                    const client = activeClients.get(sender.id)

                    if (client.fileMetaDataInfo && client.fileMetaDataInfo.upcomingFilestream) {
                        console.error("wait a file is already uploading")
                        return socket.send(JSON.stringify(
                            {
                                status: "failed",
                                sender: sender,
                                receiver: receiver,
                                type: "file-meta-data-response-from-server",
                                createdAt: data.createdAt,
                                msg: "wait file writer is busy",
                                upcomingFilename: upcomingFilename
                            }
                        ))

                    }
                    client.fileMetaDataInfo = {

                        upcomingFilestream: upcomingFilestream,
                        upcomingFilesize: upcomingFilesize,
                        totalReceivedBytes: 0,
                        sender: sender,
                        receiver: receiver,
                        createdAt: data.createdAt,
                        upcomingFilename: upcomingFilename,
                        fileSize: upcomingFilesize

                    };

                    return socket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: sender,
                            receiver: receiver,
                            type: "file-meta-data-response-from-server",
                            createdAt: data.createdAt,
                            msg: "yes now send the file",
                            upcomingFilename: upcomingFilename,
                            fileSize: upcomingFilesize
                        }
                    ))


                }
                else if (type === "download-file-request-from-client") {
                    const fileMetaDataInfo = data.fileMetaDataInfo
                    const readStreamObject = createReadStreamOfAFile(path.join(handlingFilesDir, fileMetaDataInfo.upcomingFilename))
                    if (!readStreamObject) {
                        socket.send(JSON.stringify(
                            {
                                status: "failed",
                                // sender: socket,
                                // receiver: receiver,
                                type: "download-file-response-from-server",
                                // createdAt: createdAt,
                                msg: "requested file is not present"
                            }
                        ))
                        return

                    }


                    socket.send(JSON.stringify(
                        {
                            status: "success",
                            // sender: socket,
                            // receiver: receiver,
                            type: "download-file-response-from-server",
                            // createdAt: createdAt,
                            fileMetaDataInfo: { filename: fileMetaDataInfo.upcomingFilename, fileSize: readStreamObject.fileSize },
                            msg: "get ready i am sending you file raw data"
                        }
                    ))

                    readStreamObject.readStream.on("data", (data) => {
                        socket.send(data) // binary/raw
                    })
                    readStreamObject.readStream.on("end", () => {
                        socket.send(JSON.stringify({
                            status: "done"
                        })); // optional end marker
                    });

                    return


                }
                else {
                    return console.log("dont have any valid type")
                }



            }
            else {
                // BINARY frame
                const id = socket.id
                const sender = activeClients.get(id)
                if (!sender) {
                    console.log("your trace has been removed")

                    return socket.send(JSON.stringify(
                        {
                            status: "failed",
                            // sender: socket,
                            // receiver: receiver,
                            type: "file-meta-data-response-from-server",
                            // createdAt: createdAt,
                            msg: "you are removed"
                        }
                    ))
                }
                const fileMetaDataInfo = sender.fileMetaDataInfo
                if (!fileMetaDataInfo) {  // is meta data is not found then i am not sending RECEIVER and CREATEDAT in the error this will key error in frontend
                    console.error("file meta data was not found.")
                    return socket.send(JSON.stringify(
                        {
                            status: "failed",
                            sender: { username: sender.username, id: sender.id, country: sender.country },        // { username: props.userRef.current.username, id: props.userRef.current.id, country: props.userRef.current.country }
                            // receiver: receiver,
                            type: "file-completed-response-from-server",
                            // createdAt: createdAt,
                            msg: "file meta data not found, sent meta data first"
                        }
                    ))

                }
                const upcomingFilesize = fileMetaDataInfo.upcomingFilesize;

                const filestream = fileMetaDataInfo.upcomingFilestream;

                filestream.write(message);



                sender.fileMetaDataInfo.totalReceivedBytes += message.length;

                if (sender.fileMetaDataInfo.totalReceivedBytes >= upcomingFilesize) {
                    filestream.end();
                    sender.fileMetaDataInfo.upcomingFilestream = null;

                    // here i can attach a chat to db about this file
                    console.log("showing size when adding on db ", fileMetaDataInfo.fileSize)
                    const result = await createNewOneChat(sender.id, fileMetaDataInfo.receiver.id, fileMetaDataInfo.upcomingFilename, fileMetaDataInfo.createdAt, true, fileMetaDataInfo.fileSize)


                    sender.fileMetaDataInfo = null;

                    if (!result) {
                        // delete file on server also
                        deleteOneFile(path.join(handlingFilesDir, fileMetaDataInfo.upcomingFilename))
                        // i will not confirm the deletion here
                        return socket.send(
                            JSON.stringify({
                                status: "failed",
                                sender: sender,
                                receiver: fileMetaDataInfo.receiver,
                                type: "message",
                                createdAt: fileMetaDataInfo.createdAt,
                                msg: "chat not created in db of the uploaded file"
                            })
                        )
                    }

                    console.log("File upload complete.");
                    socket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: fileMetaDataInfo.sender,
                            receiver: fileMetaDataInfo.receiver,
                            type: "file-completed-response-from-server",
                            createdAt: fileMetaDataInfo.createdAt,
                            msg: "file received on server",
                            fileMetaDataInfo: { upcomingFilename: fileMetaDataInfo.upcomingFilename, fileSize: fileMetaDataInfo.fileSize }
                        }
                    ))
                    // now i can send this link to another person also
                    const receiver = activeClients.get(fileMetaDataInfo.receiver.id)
                    // but i am not checking that receiver exists or not and not notifying to the sender about unavailbility of receiver
                    if (!receiver) {
                        return // just doing nothing, but later improve this
                    }
                    const currentSocket = receiver.socket

                    if (!currentSocket || currentSocket.readyState !== 1) {
                        return // just doing nothing, but later improve this
                    }
                    currentSocket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: fileMetaDataInfo.sender,
                            receiver: fileMetaDataInfo.receiver,
                            type: "file-completed-response-from-server",
                            createdAt: fileMetaDataInfo.createdAt,
                            msg: "file received on server",
                            fileMetaDataInfo: { upcomingFilename: fileMetaDataInfo.upcomingFilename, fileSize: fileMetaDataInfo.fileSize }
                        }
                    ))
                    return
                }
                return;





            }


        });




        socket.on("close", async () => {
            console.log("Client disconnected");
            socket.close(1000, "logout you out")
            await deleteUserAllChats(client.id)
            await deleteAllAssociatedFiles(client.id, handlingFilesDir)
            activeClients.delete(client.id)
            return

        });

        socket.on("error", async (error) => {
            console.error("WebSocket error:", error);

            socket.close(1011, "logged you out due to some error")
            await deleteUserAllChats(client.id)
            await deleteAllAssociatedFiles(client.id, handlingFilesDir)
            activeClients.delete(client.id)
            return
        });
    });

    server.on("error", (error) => {
        console.error("WebSocket server error:", error);
        activeClients = null;
        //// fs.rmdir(handlingFilesDir,{ recursive: true, force: true })
        return
    });
}