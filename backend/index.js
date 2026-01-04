import dotenv from 'dotenv';
dotenv.config();
import http from "http"
import fs from "fs"



import { activeClients, createNewOneChat, createReadStreamOfAFile, deleteOneFile, handlingFilesDir, newConnectionHandler } from "./controllers/user.controller.js"
import { connectDB } from './db/db.handler.js';
import path from 'path';



connectDB().then((dbname) => {
    const allowedOrigin = [process.env.WHITELISTED_FRONTEND_URL];



    const server = http.createServer((req, res) => {


        const headers = {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': "*",
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            "Access-Control-Allow-Headers": "Content-Type, X-Custom-Access-Token, X-Filename, X-Modified-Filename, X-Sender-Id, X-Receiver-Id, X-Created-At"
        }

        if (req.method === "OPTIONS") {
            res.writeHead(204, headers);
            res.end();
            return;
        }
        if (req.url.startsWith("/download-file") && req.method === "POST") {
            // verify encrypted token came from header
            const modifiedFileName = req.headers["x-modified-filename"]
            const customAccessToken = req.headers["x-custom-access-token"]


            if (!customAccessToken || !modifiedFileName) {
                res.writeHead(404);
                res.end("Missing tokens"); // so that browser can stop hang up
                return;
            }
            const senderId = req.headers["x-sender-id"]
            const receiverId = req.headers["x-receiver-id"]
            const timestamp = req.headers["x-created-at"]

            if (!senderId || !receiverId) {
                res.writeHead(404, headers);
                res.end("Missing ids"); // so that browser can stop hang up
                return;
            }
            if (!timestamp) {
                res.writeHead(404, headers);
                res.end();
                return;
            }

            const sender = activeClients.get(senderId)
            const receiver = activeClients.get(receiverId)

            if (!sender || !receiver) {
                res.writeHead(404, headers);
                res.end("Sender or receiver gone offline"); // so that browser can stop hang up
                return;
            }

            // if success check user existence and send him file

            const { readStream, sizeOnDisk } = createReadStreamOfAFile(path.join(handlingFilesDir, modifiedFileName));
            if (!readStream) {
                res.writeHead(404, headers);
                res.end("File not found")
                return
            }
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
                return;
            }
            const senderId = req.headers["x-sender-id"]
            const receiverId = req.headers["x-receiver-id"]
            const timestamp = req.headers["x-created-at"]

            if (!senderId || !receiverId) {
                res.writeHead(404, headers);
                res.end("Missing ids"); // so that browser can stop hang up
                return;
            }
            if (!timestamp) {
                res.writeHead(404, headers);
                res.end();
                return;
            }

            const sender = activeClients.get(senderId)
            const receiver = activeClients.get(receiverId)

            if (!sender || !receiver) {
                res.writeHead(404, headers);
                res.end("Sender or receiver gone offline"); // so that browser can stop hang up
                return;
            }

            // lets assume token verified


            const modifiedFileName = sender.id + "_" + receiver.id + "_" + timestamp + "_" + filename;

            const writeStream = fs.createWriteStream(path.join(handlingFilesDir, modifiedFileName))
            req.pipe(writeStream);
            writeStream.on("finish", async () => {
                // here only i will successfully message via socket

                const sizeOnDisk = fs.statSync(path.join(handlingFilesDir, modifiedFileName)).size

                const result = await createNewOneChat(sender.id, receiver.id, modifiedFileName, timestamp, true, sizeOnDisk)

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


                receiver.socket.send(JSON.stringify(
                    {
                        status: "success",
                        sender: sender,
                        receiver: receiver,
                        type: "file-completed-response-from-server",
                        createdAt: timestamp,
                        msg: "file received on server",
                        upcomingFilename: modifiedFileName,
                        fileSize: sizeOnDisk
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








