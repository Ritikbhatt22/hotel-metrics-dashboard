import { onRequest } from "firebase-functions/v2/https";
import app from "./server.js"; // import your full Express app

export const api = onRequest(app);
