# Backend

- `http.createServer`
- `new WebSocketServer`

## Using HTTP APIs

### OPTIONS

`req.method === "OPTIONS"` -> `res.writeHead(204, headers)`

### Download file

```
req.url.startsWith("/download-file")

input =
req.headers["x-modified-filename"]
req.headers["x-sender-id"]
req.headers["x-receiver-id"]
req.headers["x-created-at"]
req.headers["x-custom-access-token"]

output =
fs.createReadStream(filepath).pipe(res)
```

### Upload file

```
req.url.startsWith("/upload-file")

input =
req.headers["x-modified-filename"]
req.headers["x-sender-id"]
req.headers["x-receiver-id"]
req.headers["x-created-at"]
req.headers["x-custom-access-token"]

output =
req.pipe(fs.createWriteStream(filepath))
```

## Using WS APIs

### Connection

```
server.on("connection") ->

input = { username, country }

output = {
  username,
  type,
  country,
  id,
  customAccessToken,
  availableUsers: availableUsers
}
```

### Message

```
socket.on("message") ->

input = { sender, receiver, type, queryType }
type (may be) = { "message", "query-message", *"file-meta-data-to-server" }
queryType (may be) = { "chat-list-demand", "refresh-all-user" }
```

# Frontend

`new WebSocket("ws://localhost:8000")`

## App.JSX

All global instance references lie here.

```
BrowserRouter
  Routes
    Route path="/" element={<Home/>}   // always mounted, all websocket event listeners yahin hain
      Route index element={<AllUsers/>}
      Route path="users" element={<AllUsers/>}
      Route path="chats" element={<ChatsRoute/>}
      Route path="mycontacts-and-notifications" element={<AllContactsAndNotifications/>}
    Route path="*" element={<p>Not found the page</p>}
```