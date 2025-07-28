import dotenv from 'dotenv';
dotenv.config();
import http from "http"


import { newConnectionHandler } from "./controllers/user.controller.js"
import { connectDB } from './db/db.handler.js';



connectDB().then((dbname) => {
    const allowedOrigin = [process.env.WHITELISTED_FRONTEND_URL];

    const server = http.createServer((req, res) => {
        
        console.log(req.headers.host)
        res.writeHead(200, { 'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin':"*",
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
         });
        res.end('Simple HTTP 1.1 Server is running\n');
        return
    });

    const port = process.env.PORT
    server.listen(port, () => {
        console.log(`Server listening...`);
    });
    newConnectionHandler(dbname, server, allowedOrigin)
})








