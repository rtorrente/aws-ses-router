import { createSesLambdaHandler } from "aws-ses-router";

import { createOsTicketHandler } from "./handlers/osTicketHandler.js";

export const handler = createSesLambdaHandler({
  emailBucket: process.env.EMAIL_BUCKET ?? "",
  overrideForwardFrom: process.env.FORWARD_FROM,
  emailKeyPrefix: "emails/",
  deleteOnSuccess: true,
  handlers: [
    {
      match: "alice@example.com",
      handler: ["alice@gmail.com"],
    },
    {
      match: "support@example.com",
      handler: createOsTicketHandler({
        apiKey: process.env.OSTICKET_API_KEY ?? "",
        apiUrl: process.env.OSTICKET_API_URL ?? "",
      }),
    },
    { match: /@example\.com$/, handler: ["team@gmail.com"] },
  ],
});