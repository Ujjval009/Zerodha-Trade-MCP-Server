import crypto from 'crypto';
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const API_KEY = process.env.KITE_API_KEY || "";
const API_SECRET = process.env.KITE_API_SECRET || "";
const REQUEST_TOKEN = process.env.REQUEST_TOKEN || "REQUEST_TOKEN"; // <--- Put your request token here (or in .env)

async function getAccessToken() {
    // Kite requires a SHA256 hash of: api_key + request_token + api_secret
    const checksumHash = crypto.createHash('sha256');
    checksumHash.update(API_KEY + REQUEST_TOKEN + API_SECRET);
    const checksum = checksumHash.digest('hex');

    const formData = new URLSearchParams();
    formData.append("api_key", API_KEY);
    formData.append("request_token", REQUEST_TOKEN);
    formData.append("checksum", checksum);

    console.log("Fetching access token...");

    try {
        const response = await fetch("https://api.kite.trade/session/token", {
            method: "POST",
            body: formData,
            headers: {
                "X-Kite-Version": "3"
            }
        });

        const data: any = await response.json();

        if (data.status === 'success') {
            console.log("\n✅ SUCCESS! Here is your Access Token:");
            console.log("----------------------------------------");
            console.log(data.data.access_token);
            console.log("----------------------------------------\n");
            console.log("Copy the token above and paste it into your .env file as KITE_ACCESS_TOKEN.");
        } else {
            console.error("\n❌ Failed to get token. Error details:");
            console.error(data);
        }
    } catch (e) {
        console.error("Request failed:", e);
    }
}

getAccessToken();
