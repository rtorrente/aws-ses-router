import { createSesLambdaHandler } from "./factory.js";
import { SesHandlerConfig } from "./types.js";

const config: SesHandlerConfig = {
  emailBucket: process.env.EMAIL_BUCKET ?? "",
  overrideForwardFrom: process.env.FORWARD_FROM,
  emailKeyPrefix: "emails/",
  handlers: [
    { match: "alice@example.com", handler: ["alice@gmail.com"] },
    { match: /@example\.com$/, handler: ["team@gmail.com"] },
  ],
};

export const handler = createSesLambdaHandler(config);
