import dotenv from 'dotenv';
dotenv.config();
import http from "http"
import fs from "fs"



import { activeClients, checkAuthenticUser, createNewOneChat,   newConnectionHandler } from "./controllers/user.controller.js"
import { connectDB } from './db/db.handler.js';
import path from 'path';

import dns from 'dns';
import { deleteOneFile, handlingFilesDir } from './controllers/file.controller.js';
dns.setServers(['8.8.8.8', '8.8.4.4']);


connectDB().then((dbname) => {
    const allowedOrigin = [process.env.WHITELISTED_FRONTEND_URL];


    const server = http.createServer((req, res) => {

            const headers = {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': "*",
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                "Access-Control-Allow-Headers": "Content-Type, X-Custom-Access-Token, X-Filename, X-Modified-Filename, X-Sender-Id, X-Receiver-Id, X-Created-At, X-Sender-Username, X-Receiver-Username"
            }

            if (req.method === "OPTIONS") {
                res.writeHead(204, headers);
                res.end();
                return;
            }
            if (req.url.startsWith("/download-file") && req.method === "POST") {
                
                const modifiedFileName = req.headers["x-modified-filename"]
                const customAccessToken = req.headers["x-custom-access-token"]

                if (!customAccessToken || !modifiedFileName) {
                    res.writeHead(404);
                    res.end("Missing tokens"); // so that browser can stop hang up
                    return;
                }


             
                const senderUsername = req.headers["x-sender-username"]
            
                const receiverUsername = req.headers["x-receiver-username"]
                const timestamp = req.headers["x-created-at"]

                if (!senderUsername || !receiverUsername) {
                    res.writeHead(404, headers);
                    res.end("Missing ids"); // so that browser can stop hang up
                    return;
                }
                if (!timestamp) {
                    res.writeHead(404, headers);
                    res.end();
                    return;
                }

                const sender = activeClients.get(senderUsername)
                const receiver = activeClients.get(receiverUsername)


                if (!sender || !receiver) {
                    res.writeHead(404, headers);
                    res.end("Sender or receiver gone offline"); // so that browser can stop hang up
                    return;
                }

                if(!checkAuthenticUser(sender.username,sender.customAccessToken,activeClients)){
                    res.writeHead(404, headers);
                    res.end("you are not genuine user");
                    return
                }

                

                
                const username1 = modifiedFileName.split("_")[0]
                const username2 = modifiedFileName.split("_")[1]
                
                if(!(sender.username === username1 || sender.username === username2 ||
                    receiver.username === username1 || receiver.username === username2
                )) {
                    res.writeHead(404, headers);
                    res.end("you dont have permission to acces this file");
                    return
                }




                if(!fs.existsSync(path.join(handlingFilesDir, modifiedFileName))){
                    res.writeHead(404, headers);
                    res.end("file not available on server");
                    return
                } 


                const readStream = fs.createReadStream(path.join(handlingFilesDir, modifiedFileName))
                res.writeHead(200, {
                    ...headers,
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${modifiedFileName}"`
                });

                readStream.pipe(res);

                readStream.on("error", () => {
                    res.writeHead(500, headers);
                    res.end("File read error");
                });

                return
            }
            if (req.url.startsWith("/upload-file") && req.method === "POST") {
             
                // verify encrypted token came from header
                const customAccessToken = req.headers["x-custom-access-token"]
                const filename = req.headers["x-filename"]

                if (!customAccessToken || !filename) {
                    res.writeHead(404);
                    res.end("Missing tokens"); // so that browser can stop hang up
                    console.log("missing the tokn")
                    return;
                }
                const senderUsername = req.headers["x-sender-username"]
                const receiverUsername = req.headers["x-receiver-username"]
                const timestamp = req.headers["x-created-at"]
                

                if (!senderUsername || !receiverUsername) {
                    res.writeHead(404, headers);
                    res.end("Missing ids"); // so that browser can stop hang up
                    console.log("Missing ids")
                    return;
                }
                if (!timestamp) {
                    res.writeHead(404, headers);
                    res.end();
                    console.log("timestamp nahi diya")
                    return;
                }

                const sender = activeClients.get(senderUsername)
         
                const receiver = activeClients.get(receiverUsername)

                if (!sender || !receiver) {
                    res.writeHead(404, headers);
                    res.end("Sender or receiver gone offline"); // so that browser can stop hang up
                    console.log("Sender or receiver gone offline")
                    return;
                }

                if(!checkAuthenticUser(sender.username,sender.customAccessToken,activeClients)){
                    res.writeHead(404, headers);
                    res.end("you are not genuine user");
                    console.log("you are not genuine user")
                    return
                }

                // here i for same timestamp i will add a unique counter so to avoid same timestaps in case of upload in same milisecond
                const modifiedFileName = sender.username + "_" + receiver.username + "_" + timestamp + "_" + filename;
                

                const writeStream = fs.createWriteStream(path.join(handlingFilesDir, modifiedFileName))

                req.pipe(writeStream);

                writeStream.on("finish", async () => {
                    // here only i will successfully message via socket

                    const sizeOnDisk = fs.statSync(path.join(handlingFilesDir, modifiedFileName)).size

                    const result = await createNewOneChat(sender.id, receiver.id, sender.username,receiver.username, modifiedFileName, timestamp, true, sizeOnDisk)

                    if (!result) {
                        deleteOneFile(path.join(handlingFilesDir, modifiedFileName))
                        res.writeHead(500, headers);
                        res.end("Cannot update on db");
                        return
                    }


                    if (!receiver.socket || receiver.socket.readyState !== 1 || !sender.socket || sender.socket.readyState !== 1) {
                        res.writeHead(500, headers);
                        res.end("Sockets are not ready");
                        return
                    }

                    // do alert to both about this information that your file has been stored

                    receiver.socket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: sender,
                            receiver: receiver,
                            type: "file-completed-response-from-server",
                            createdAt: timestamp,
                            msg: "file received on server",
                            fileMetaDataInfo: { upcomingFilename: modifiedFileName, fileSize: sizeOnDisk }
                        }
                    ))
                    console.log("File upload complete.");
                    sender.socket.send(JSON.stringify(
                        {
                            status: "success",
                            sender: sender,
                            receiver: receiver,
                            type: "file-completed-response-from-server",
                            createdAt: timestamp,
                            msg: "file received on server",
                            fileMetaDataInfo: { upcomingFilename: modifiedFileName, fileSize: sizeOnDisk }
                        }
                    ))


                    res.writeHead(200, headers);
                    res.end("OK");
                });

                writeStream.on("error", () => {
                    res.writeHead(500, headers);
                    res.end("File write failed");
                });

                // if success start receiving data
                // after success send the url of the file to receiver and append in db also
                return
            }


            console.log(req.headers.host)

            res.writeHead(200, headers); // headers are written , .write(raw data)
            res.end('Simple HTTP 1.1 Server is running\n'); // for flush
            return
        });

    const port = process.env.PORT
    server.listen(port, () => {
        console.log(`Server listening...`);
    });
    // new connection will be handled through websocket
    newConnectionHandler(dbname, server, allowedOrigin)
})








