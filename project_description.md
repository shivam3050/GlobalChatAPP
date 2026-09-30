**Backend**

http.createServer
new WebSocketServer

**USING HTTP**
req.method === "OPTIONS"                                      -> res.writeHead(204, headers)
req.url.startsWith("/download-file") && req.method === "POST" -> fs.createReadStream(filepath)
req.url.startsWith("/upload-file") && req.method === "POST"   -> fs.createWriteStream(filepath)

**USING WS**
server.on("connection") -> activeClients.set(client.id, client); 
socket.on("message")    -> (parse message into json)

                           {sender, receiver, type, queryType}
                            type -> {"message", "query-message", *"file-meta-data-to-server",}
                            queryType -> {"chat-list-demand", "refresh-all-user"}

**Frontend**

new WebSocket("ws://localhost:8000")

App.JSX

    ALL Global Instance References lies here

    BrowserRouter
        Routes
            Route path="/" element={<Home/>} "### This route is always mounted and contains all websocket event listener definitions ###"
                Route index element={<AllUsers/>}
                Route path="users" element={<AllUsers/>}
                Route path="chats" element={<ChatsRoute/>}
                Route path="mycontacts-and-notifications" element={<AllContactsAndNotifications/>}
                
            Route path="*" element={<p>Not found the page</p>}

    

