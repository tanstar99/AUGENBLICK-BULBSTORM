import express from "express";
import { whapiHealth, whapiWebhook } from "../controllers/whapiController.js";

const router = express.Router();

router.get("/health", whapiHealth);
router.post("/webhook", whapiWebhook);

export default router;
