import { createSesLambdaHandler } from "aws-ses-router";

export const handler = createSesLambdaHandler({
  emailBucket: process.env.EMAIL_BUCKET ?? "",
  overrideForwardFrom: process.env.FORWARD_FROM,
  emailKeyPrefix: "emails/",
  deleteOnSuccess: true,
  handlers: [
    { match: "alice@example.com", handler: ["alice@gmail.com"] },
    { match: /@example\.com$/, handler: ["team@gmail.com"] },
  ],
});