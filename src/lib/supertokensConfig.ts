import SuperTokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Passwordless from "supertokens-node/recipe/passwordless";

const {
  SUPERTOKENS_CONNECTION_URI,
  SUPERTOKENS_API_KEY,
  SMS_GATEWAY_URL,
  SMS_FROM_NUMBER,
  SMS_USERNAME,
  SMS_PASSWORD,
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

            // Validate required SMS gateway credentials
            if (!SMS_GATEWAY_URL || !SMS_FROM_NUMBER || !SMS_USERNAME || !SMS_PASSWORD) {
              throw new Error("SMS gateway configuration missing. Please set SMS_GATEWAY_URL, SMS_FROM_NUMBER, SMS_USERNAME, SMS_PASSWORD in environment.");
            }

            // Construct gateway URL
            const smsUrl = new URL(SMS_GATEWAY_URL);
            smsUrl.searchParams.set("method", "sendsms");
            smsUrl.searchParams.set("format", "json");
            smsUrl.searchParams.set("from", SMS_FROM_NUMBER);
            smsUrl.searchParams.set("to", phoneNumber);
            smsUrl.searchParams.set("text", codeMessage);
            smsUrl.searchParams.set("type", "0");
            smsUrl.searchParams.set("username", SMS_USERNAME);
            smsUrl.searchParams.set("password", SMS_PASSWORD);

            const res = await fetch(smsUrl.toString());
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
