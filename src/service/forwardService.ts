import { SendRawEmailCommand } from "@aws-sdk/client-ses";

import { logger } from "../utils/logger.js";
import { sesClient } from "../utils/sesClient.js";

const HEADERS_TO_REMOVE = [
  "Return-Path",
  "Sender",
  "Message-ID",
  "DKIM-Signature",
  "X-SES-DKIM-SIGNATURE",
  "X-Google-DKIM-Signature",
  "Authentication-Results",
  "Received-SPF",
  "X-Google-Smtp-Source",
  "X-Received",
];

const removeHeader = (headers: string, name: string): string =>
  headers.replace(
    new RegExp(`^${name}:[ \\t]*.*(?:\\r?\\n[ \\t]+.*)*\\r?\\n?`, "gim"),
    "",
  );

const rewriteFrom = (
  originalFrom: string,
  originalRecipient: string,
  overrideForwardFrom?: string,
): string => {
  if (overrideForwardFrom) {
    const displayName = originalFrom.replace(/<.*>/, "").trim();
    return displayName
      ? `${displayName} <${overrideForwardFrom}>`
      : `<${overrideForwardFrom}>`;
  }
  const encodedFrom = originalFrom.replace("<", "at ").replace(">", "");
  return `${encodedFrom} <${originalRecipient}>`;
};

export const forwardEmail = async ({
  rawEmail,
  recipients,
  originalRecipient,
  overrideForwardFrom,
}: {
  rawEmail: string;
  recipients: string[];
  originalRecipient: string;
  overrideForwardFrom?: string;
}): Promise<void> => {
  const separatorIndex = rawEmail.search(/\r?\n\r?\n/);
  if (separatorIndex === -1)
    throw new Error("Invalid email: no header/body separator found");

  let headers = rawEmail.slice(0, separatorIndex);
  const body = rawEmail.slice(separatorIndex);

  const fromMatch = /^From:[ \t]*(.+)$/im.exec(headers);
  const originalFrom = fromMatch?.[1]?.trim() ?? "";

  headers = HEADERS_TO_REMOVE.reduce(removeHeader, headers);

  const sender = overrideForwardFrom ?? originalRecipient;

  headers = headers.replace(
    /^From:[ \t]*.*$/im,
    `From: ${rewriteFrom(originalFrom, originalRecipient, overrideForwardFrom)}`,
  );
  headers = headers.replace(/^To:[ \t]*.*$/im, `To: ${recipients.join(", ")}`);

  if (originalFrom && !/^Reply-To:/im.test(headers)) {
    headers += `\r\nReply-To: ${originalFrom}`;
  }

  if (!/^Auto-Submitted:/im.test(headers)) {
    headers += `\r\nAuto-Submitted: auto-generated`;
  }

  logger.debug(`[forward] Sending to [${recipients.join(", ")}] via ${sender}`);
  await sesClient.send(
    new SendRawEmailCommand({
      Destinations: recipients,
      RawMessage: { Data: Buffer.from(headers + body) },
      Source: sender,
    }),
  );
  logger.debug(`[forward] Sent to [${recipients.join(", ")}]`);
};
