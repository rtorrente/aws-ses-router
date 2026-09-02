import { forwardEmail } from "./forwardService.js";
import { deleteEmail, getRawEmail } from "./s3Service.js";
import { logger } from "../utils/logger.js";

import type { SESEventRecord } from "aws-lambda";

import type { HandlerEntry, SesHandlerConfig } from "../types.js";

const SKIP_PATTERNS = [
  /^Auto-Submitted:\s*auto-replied\b/im,
  /^Content-Type:[^\n]*\breport-type=delivery-status\b/im,
  /^Content-Type:[^\n]*\breport-type=feedback-report\b/im,
];

const shouldSkip = (rawEmail: string): boolean => {
  const separatorIndex = rawEmail.search(/\r?\n\r?\n/);
  const headers =
    separatorIndex === -1 ? rawEmail : rawEmail.slice(0, separatorIndex);
  const unfolded = headers.replace(/\r?\n[ \t]+/g, " ");
  return SKIP_PATTERNS.some((pattern) => pattern.test(unfolded));
};

export const processRecord = async (
  record: SESEventRecord,
  config: SesHandlerConfig,
): Promise<void> => {
  const { mail, receipt } = record.ses;
  logger.info(
    `[ses-handler] Processing message ${mail.messageId} from ${mail.source} to [${receipt.recipients.join(", ")}]`,
  );
  const rawEmail = await getRawEmail(mail.messageId, config);

  await Promise.all(
    receipt.recipients.map(async (recipient) => {
      const normalized = recipient.toLowerCase();
      const entry = config.handlers.find(({ match }: HandlerEntry): boolean =>
        typeof match === "string"
          ? match === normalized
          : match.test(normalized),
      );
      const handler = entry?.handler;

      if (shouldSkip(rawEmail)) {
        logger.info(
          `[ses-handler] Skipping automated message ${mail.messageId} for ${recipient}`,
        );
        return;
      }

      if (handler === undefined) {
        logger.warn(`[ses-handler] No handler configured for ${recipient}`);
        return;
      }

      if (handler === null) {
        logger.debug(
          `[ses-handler] Ignoring ${mail.messageId} for ${recipient}`,
        );
        return;
      }

      if (Array.isArray(handler)) {
        logger.info(
          `[ses-handler] Forwarding ${mail.messageId} for ${recipient} to [${handler.join(", ")}]`,
        );
        await forwardEmail({
          rawEmail,
          recipients: handler,
          originalRecipient: recipient,
          overrideForwardFrom: config.overrideForwardFrom,
          forwardConfigurationSetName: config.forwardConfigurationSetName,
        });
      } else {
        logger.info(
          `[ses-handler] Dispatching ${mail.messageId} for ${recipient} to custom handler`,
        );
        await handler(rawEmail);
      }
    }),
  );

  if (config.deleteOnSuccess) {
    await deleteEmail(mail.messageId, config);
    logger.info(`[ses-handler] Deleted ${mail.messageId} from S3`);
  }
};
