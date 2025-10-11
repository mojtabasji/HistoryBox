import SuperTokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Passwordless from "supertokens-node/recipe/passwordless";

const {
  SUPERTOKENS_CONNECTION_URI,
  SUPERTOKENS_API_KEY,
  SMS_API_URL,
  SMS_API_TOKEN,
  NEXT_PUBLIC_API_DOMAIN,
  NEXT_PUBLIC_WEBSITE_DOMAIN,
} = process.env;

SuperTokens.init({
  framework: "express", // Next.js API routes use Express-like handlers
  supertokens: {
    connectionURI: SUPERTOKENS_CONNECTION_URI || "https://auth.bytecraft.ir",
    ...(SUPERTOKENS_API_KEY ? { apiKey: SUPERTOKENS_API_KEY } : {}),
  },
  appInfo: {
    appName: "History Box",
    apiDomain: NEXT_PUBLIC_API_DOMAIN || "http://localhost:3000",
    apiBasePath: "/api/auth",
    websiteDomain: NEXT_PUBLIC_WEBSITE_DOMAIN || "http://localhost:3000",
    websiteBasePath: "/login",
  },
  recipeList: [
    Session.init(),
    Passwordless.init({
      contactMethod: "PHONE",
      flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
      smsDelivery: {
        service: {
          sendSms: async (input) => {
            const phoneNumber = input.phoneNumber;
            if (!phoneNumber) throw new Error("Missing phone number for SMS delivery");

            // Build message
            const codeMessage = input.userInputCode
              ? `Your History Box code is ${input.userInputCode}`
              : `Use this link to sign in: ${input.urlWithLinkCode}`;

            // Validate required SMS API settings
            if (!SMS_API_URL || !SMS_API_TOKEN) {
              throw new Error("SMS API configuration missing. Please set SMS_API_URL and SMS_API_TOKEN in environment.");
            }

            // POST to external SMS service
            const res = await fetch(SMS_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SMS_API_TOKEN}`,
              },
              body: JSON.stringify({ phone: phoneNumber, message: codeMessage }),
            });
            if (!res.ok) {
              const body = await res.text().catch(() => "");
              throw new Error(`SMS gateway responded with ${res.status}. ${body}`);
            }
          },
        },
      },
    }),
  ],
});
