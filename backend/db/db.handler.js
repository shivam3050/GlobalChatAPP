import dotenv from 'dotenv';
dotenv.config();
import fs from "fs";
import path from "path";
import { google } from 'googleapis';

import mongoose from "mongoose";


export const connectDB = async () => {
    try {
        const connectionAttempt = await mongoose.connect(`${process.env.MONGODB_URI}`,
            {
                dbName: process.env.DATABASE_NAME,
                serverSelectionTimeoutMS: 5000,
                retryWrites: true,
            }
        )
        if (!connectionAttempt) {
            throw new Error()
        }

        const dbname = mongoose.connection.name;
        console.log("MongoDb Connected Successfully : ", dbname)
        return dbname
    } catch (error) {
        throw new Error(error)
    }
}






const TOKEN_PATH = "tokens.json";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export const initGoogleDrive = async () => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    if (fs.existsSync(TOKEN_PATH)) {
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    } else {
        const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
        console.log("Visit this URL to authorize:", authUrl);

        // Code manually leke run karke token store karega
        return null;
    }

    return google.drive({ version: "v3", auth: oAuth2Client });
};