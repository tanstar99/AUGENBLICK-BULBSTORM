import Category from "../models/Category.js";
import Material from "../models/Material.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import WhatsappSession from "../models/WhatsappSession.js";
import { sendWhapiTextMessage } from "../services/whapiClient.js";
import {
  buildPhoneCandidates,
  extractPhoneFromChatId,
  normalizeIndianPhone,
  sanitizeToDigits,
} from "../utils/phone.js";

const UNIT_OPTIONS = ["pieces", "kg", "tons", "cubic_meters", "square_meters", "liters", "units"];
const PRICE_TYPE_OPTIONS = ["free", "fixed", "negotiable"];
const CONDITION_DEFAULT = "good";

const HELP_TEXT = [
  "Hi! I can help you with marketplace actions.",
  "",
  "Commands:",
  "- ADD LISTING",
  "- MY LISTINGS",
  "- MY TRANSACTIONS",
  "- HELP",
  "- CANCEL",
].join("\n");

const parseIncomingMessage = (payload) => {
  const candidates = [];

  if (Array.isArray(payload?.messages)) {
    candidates.push(...payload.messages);
  }

  if (payload?.messages && !Array.isArray(payload.messages)) {
    candidates.push(payload.messages);
  }

  if (payload?.message) {
    candidates.push(payload.message);
  }

  if (payload?.data?.message) {
    candidates.push(payload.data.message);
  }

  if (payload?.data?.messages) {
    if (Array.isArray(payload.data.messages)) {
      candidates.push(...payload.data.messages);
    } else {
      candidates.push(payload.data.messages);
    }
  }

  const message = candidates.find((entry) => entry && !entry.from_me && (entry.text?.body || entry.body || entry.text));

  if (!message) {
    return null;
  }

  const body = String(message.text?.body || message.body || message.text || "").trim();
  const chatId = message.chat_id || message.chatId || message.from || "";
  const messageId = message.id || message.message_id || null;

  if (!body || !chatId) {
    return null;
  }

  return {
    body,
    chatId,
    messageId,
    from: message.from || "",
  };
};

const isWebhookAuthorized = (req) => {
  if (!process.env.WHAPI_WEBHOOK_SECRET) {
    return true;
  }

  const querySecret = req.query?.secret || req.query?.token || "";
  const incomingSecret =
    req.headers["x-whapi-secret"] ||
    req.headers["x-webhook-secret"] ||
    req.headers["x-api-key"] ||
    "";

  return (
    incomingSecret === process.env.WHAPI_WEBHOOK_SECRET ||
    querySecret === process.env.WHAPI_WEBHOOK_SECRET
  );
};

const toChatId = (chatIdOrPhone) => {
  if (String(chatIdOrPhone).includes("@")) {
    return chatIdOrPhone;
  }

  const normalized = normalizeIndianPhone(chatIdOrPhone);
  return `${normalized}@c.us`;
};

const replyText = async (chatId, text) => {
  await sendWhapiTextMessage({ to: toChatId(chatId), body: text });
};

const findUserByPhone = async (chatId, fromField) => {
  const extractedPhone = extractPhoneFromChatId(chatId) || sanitizeToDigits(fromField);
  const candidates = buildPhoneCandidates(extractedPhone);

  if (!candidates.length) {
    return null;
  }

  let user = await User.findOne({ phone: { $in: candidates } });
  if (user) return user;

  const usersWithPhones = await User.find({ phone: { $exists: true, $ne: null } })
    .select("name phone role")
    .lean();

  const matched = usersWithPhones.find((entry) => {
    const normalizedPhone = normalizeIndianPhone(entry.phone || "");
    return candidates.includes(normalizedPhone) || candidates.includes(sanitizeToDigits(entry.phone || ""));
  });

  if (!matched?._id) {
    return null;
  }

  user = await User.findById(matched._id);
  return user;
};

const getOrCreateSession = async ({ phoneNumber, chatId }) => {
  let session = await WhatsappSession.findOne({ phoneNumber, chatId });

  if (!session) {
    session = await WhatsappSession.create({
      phoneNumber,
      chatId,
      flow: "none",
      step: "idle",
      draft: {},
    });
  }

  return session;
};

const resetSession = async (session) => {
  session.flow = "none";
  session.step = "idle";
  session.draft = {};
  await session.save();
};

const getCategoriesPrompt = async () => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).limit(20);

  const lines = categories.map((category, index) => `${index + 1}. ${category.name}`);

  return {
    categories,
    text: ["Choose category by number or exact name:", ...lines].join("\n"),
  };
};

const startAddListingFlow = async (session, chatId) => {
  session.flow = "add_listing";
  session.step = "title";
  session.draft = {};
  await session.save();

  await replyText(chatId, "Let us create your listing. Step 1/8: Send the listing title.");
};

const parseCategoryInput = async (input) => {
  const text = input.trim();
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).limit(50);

  const asNumber = Number(text);
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0 && asNumber <= categories.length) {
    return categories[asNumber - 1];
  }

  const exact = categories.find((category) => category.name.toLowerCase() === text.toLowerCase());
  if (exact) return exact;

  const partial = categories.find((category) => category.name.toLowerCase().includes(text.toLowerCase()));
  return partial || null;
};

const parseQuantityAndUnit = (input) => {
  const value = input.trim().replace(/\s+/g, " ");
  const [quantityRaw, unitRaw] = value.split(" ");

  const quantity = Number(quantityRaw);
  if (!quantity || quantity < 1) {
    return { error: "Please send quantity and unit like: 25 kg" };
  }

  const unit = (unitRaw || "pieces").toLowerCase();
  if (!UNIT_OPTIONS.includes(unit)) {
    return { error: `Unit must be one of: ${UNIT_OPTIONS.join(", ")}` };
  }

  return { quantity, unit };
};

const parseCoordinates = (input) => {
  const cleaned = input.trim();
  const parts = cleaned.split(",").map((entry) => Number(entry.trim()));

  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return { error: "Please send location as: latitude,longitude" };
  }

  const [latitude, longitude] = parts;

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: "Invalid coordinates. Latitude must be -90 to 90 and longitude -180 to 180." };
  }

  return { latitude, longitude };
};

const parsePriceType = (input) => {
  const value = input.trim().toLowerCase();
  if (!PRICE_TYPE_OPTIONS.includes(value)) {
    return { error: `Price type must be one of: ${PRICE_TYPE_OPTIONS.join(", ")}` };
  }
  return { priceType: value };
};

const sendMyListings = async (chatId, userId) => {
  const materials = await Material.find({ listedBy: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title status price priceType quantity unit createdAt")
    .lean();

  if (!materials.length) {
    await replyText(chatId, "You do not have any listings yet. Send ADD LISTING to create one.");
    return;
  }

  const lines = materials.map((item, index) => {
    const pricePart = item.priceType === "free" ? "Free" : `INR ${item.price}`;
    return `${index + 1}. ${item.title} | ${item.status} | ${item.quantity} ${item.unit} | ${pricePart}`;
  });

  await replyText(chatId, ["Your latest listings:", ...lines].join("\n"));
};

const sendMyTransactions = async (chatId, userId) => {
  const transactions = await Transaction.find({
    $or: [{ supplier: userId }, { receiver: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("material", "title")
    .populate("supplier", "name")
    .populate("receiver", "name")
    .lean();

  if (!transactions.length) {
    await replyText(chatId, "You do not have any transactions yet.");
    return;
  }

  const userIdString = String(userId);
  const lines = transactions.map((txn, index) => {
    const role = String(txn.supplier?._id) === userIdString ? "supplier" : "receiver";
    const withUser = role === "supplier" ? txn.receiver?.name : txn.supplier?.name;
    return `${index + 1}. ${txn.material?.title || "Material"} | ${txn.status} | role: ${role} | with: ${withUser || "Unknown"}`;
  });

  await replyText(chatId, ["Your latest transactions:", ...lines].join("\n"));
};

const finalizeAddListing = async (session, user, chatId) => {
  const draft = session.draft || {};

  const material = await Material.create({
    title: draft.title,
    description: draft.description,
    category: draft.categoryId,
    condition: CONDITION_DEFAULT,
    quantity: draft.quantity,
    availableQuantity: draft.quantity,
    unit: draft.unit,
    images: [],
    location: {
      type: "Point",
      coordinates: [draft.longitude, draft.latitude],
    },
    address: {
      city: draft.city,
      country: "India",
    },
    listedBy: user._id,
    price: draft.price,
    priceType: draft.priceType,
    source: "api",
  });

  await resetSession(session);

  await replyText(
    chatId,
    [
      "Listing created successfully.",
      `ID: ${material._id}`,
      `Title: ${material.title}`,
      "Send MY LISTINGS to see your latest entries.",
    ].join("\n")
  );
};

const continueAddListingFlow = async ({ session, user, chatId, inputText }) => {
  const text = inputText.trim();

  switch (session.step) {
    case "title":
      if (text.length < 3) {
        await replyText(chatId, "Title is too short. Please send at least 3 characters.");
        return;
      }

      session.draft = { ...session.draft, title: text };
      session.step = "description";
      await session.save();

      await replyText(chatId, "Step 2/8: Send a short description.");
      return;

    case "description":
      if (text.length < 10) {
        await replyText(chatId, "Description is too short. Please send at least 10 characters.");
        return;
      }

      session.draft = { ...session.draft, description: text };
      session.step = "category";
      await session.save();

      {
        const prompt = await getCategoriesPrompt();
        await replyText(chatId, `Step 3/8\n${prompt.text}`);
      }
      return;

    case "category": {
      const category = await parseCategoryInput(text);

      if (!category) {
        const prompt = await getCategoriesPrompt();
        await replyText(chatId, `Could not match category.\n${prompt.text}`);
        return;
      }

      session.draft = {
        ...session.draft,
        categoryId: category._id,
        categoryName: category.name,
      };
      session.step = "quantity";
      await session.save();

      await replyText(chatId, "Step 4/8: Send quantity and unit (example: 25 kg).");
      return;
    }

    case "quantity": {
      const parsed = parseQuantityAndUnit(text);
      if (parsed.error) {
        await replyText(chatId, parsed.error);
        return;
      }

      session.draft = {
        ...session.draft,
        quantity: parsed.quantity,
        unit: parsed.unit,
      };
      session.step = "city";
      await session.save();

      await replyText(chatId, "Step 5/8: Send city (for listing location). Example: Mumbai");
      return;
    }

    case "city":
      if (text.length < 2) {
        await replyText(chatId, "City is too short. Please send a valid city name.");
        return;
      }

      session.draft = {
        ...session.draft,
        city: text,
      };
      session.step = "location";
      await session.save();

      await replyText(chatId, "Step 6/8: Send latitude,longitude (example: 19.0760,72.8777)");
      return;

    case "location": {
      const parsed = parseCoordinates(text);
      if (parsed.error) {
        await replyText(chatId, parsed.error);
        return;
      }

      session.draft = {
        ...session.draft,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
      session.step = "price_type";
      await session.save();

      await replyText(chatId, "Step 7/8: Send price type: free, fixed, or negotiable");
      return;
    }

    case "price_type": {
      const parsed = parsePriceType(text);
      if (parsed.error) {
        await replyText(chatId, parsed.error);
        return;
      }

      session.draft = {
        ...session.draft,
        priceType: parsed.priceType,
      };

      if (parsed.priceType === "free") {
        session.draft.price = 0;
        session.step = "confirm";
        await session.save();
        await replyText(chatId, "Step 8/8: Reply CONFIRM to publish your listing or CANCEL to stop.");
        return;
      }

      session.step = "price";
      await session.save();
      await replyText(chatId, "Step 8/8: Send price amount in INR (numbers only). Example: 1200");
      return;
    }

    case "price": {
      const price = Number(text);
      if (Number.isNaN(price) || price < 0) {
        await replyText(chatId, "Invalid price. Please send a valid number (example: 1200).");
        return;
      }

      session.draft = {
        ...session.draft,
        price,
      };
      session.step = "confirm";
      await session.save();
      await replyText(chatId, "Reply CONFIRM to publish your listing or CANCEL to stop.");
      return;
    }

    case "confirm":
      if (text.toUpperCase() !== "CONFIRM") {
        await replyText(chatId, "Please reply CONFIRM to publish or CANCEL to exit.");
        return;
      }

      await finalizeAddListing(session, user, chatId);
      return;

    default:
      await resetSession(session);
      await replyText(chatId, HELP_TEXT);
  }
};

const processCommandOrFlow = async ({ session, user, chatId, body }) => {
  const normalized = body.trim().toUpperCase();

  if (normalized === "HELP") {
    await replyText(chatId, HELP_TEXT);
    return;
  }

  if (normalized === "CANCEL") {
    await resetSession(session);
    await replyText(chatId, "Current action cancelled. Send HELP to see available commands.");
    return;
  }

  if (session.flow === "add_listing") {
    await continueAddListingFlow({
      session,
      user,
      chatId,
      inputText: body,
    });
    return;
  }

  if (normalized === "ADD LISTING") {
    await startAddListingFlow(session, chatId);
    return;
  }

  if (normalized === "MY LISTINGS") {
    await sendMyListings(chatId, user._id);
    return;
  }

  if (normalized === "MY TRANSACTIONS") {
    await sendMyTransactions(chatId, user._id);
    return;
  }

  await replyText(chatId, HELP_TEXT);
};

export const whapiWebhook = async (req, res) => {
  try {
    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ success: false, message: "Unauthorized webhook request." });
    }

    const incoming = parseIncomingMessage(req.body);

    if (!incoming) {
      return res.status(200).json({ success: true, message: "Webhook event ignored." });
    }

    const phoneNumber = normalizeIndianPhone(extractPhoneFromChatId(incoming.chatId) || incoming.from);

    if (!phoneNumber) {
      return res.status(200).json({ success: true, message: "No valid phone number in event." });
    }

    const user = await findUserByPhone(incoming.chatId, incoming.from);

    if (!user) {
      return res.status(200).json({ success: true, message: "Unregistered number ignored." });
    }

    const session = await getOrCreateSession({
      phoneNumber,
      chatId: incoming.chatId,
    });

    if (incoming.messageId && session.lastIncomingMessageId === incoming.messageId) {
      return res.status(200).json({ success: true, message: "Duplicate event ignored." });
    }

    session.lastIncomingMessageId = incoming.messageId;
    session.lastIncomingAt = new Date();

    session.user = user._id;
    await session.save();

    await processCommandOrFlow({
      session,
      user,
      chatId: incoming.chatId,
      body: incoming.body,
    });

    return res.status(200).json({ success: true, message: "Webhook processed." });
  } catch (error) {
    console.error("WHAPI webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process WHAPI webhook.",
    });
  }
};

export const whapiHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "WHAPI integration is active.",
  });
};
