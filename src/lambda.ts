import { createSesLambdaHandler } from "./factory.js";

import type { SesHandlerConfig } from "./types.js";

const config: SesHandlerConfig = {
  emailBucket: process.env.EMAIL_BUCKET ?? "",
  overrideForwardFrom: process.env.FORWARD_FROM,
  forwardConfigurationSetName: process.env.FORWARD_CONFIGURATION_SET,
  emailKeyPrefix: process.env.EMAIL_KEY_PREFIX ?? "emails/",
  handlers: [
    { match: "alice@example.com", handler: ["alice@gmail.com"] },
    { match: /@example\.com$/, handler: ["team@gmail.com"] },
  ],
};

export const handler = createSesLambdaHandler(config);
