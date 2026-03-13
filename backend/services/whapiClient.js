import axios from "axios";

const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL || "https://gate.whapi.cloud";

export const sendWhapiTextMessage = async ({ to, body }) => {
  if (!process.env.WHAPI_API_TOKEN) {
    throw new Error("WHAPI_API_TOKEN is not configured");
  }

  const response = await axios.post(
    `${WHAPI_BASE_URL}/messages/text`,
    {
      to,
      body,
      typing_time: 0,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHAPI_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    }
  );

  return response.data;
};
