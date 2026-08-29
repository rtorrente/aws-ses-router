import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { logger } from "../utils/logger.js";
import { s3Client } from "../utils/s3client.js";

import type { SesHandlerConfig } from "../types.js";

const getKey = (messageId: string, config: SesHandlerConfig): string =>
  config.emailKeyPrefix ? `${config.emailKeyPrefix}${messageId}` : messageId;

export const getRawEmail = async (
  messageId: string,
  config: SesHandlerConfig,
): Promise<string> => {
  const key = getKey(messageId, config);

  logger.debug(`[s3] Fetching s3://${config.emailBucket}/${key}`);

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: config.emailBucket, Key: key }),
  );
  if (!response.Body) throw new Error(`No body for S3 key ${key}`);

  const raw = await response.Body.transformToString();

  logger.debug(`[s3] Fetched ${raw.length} bytes for ${messageId}`);

  return raw;
};

export const deleteEmail = async (
  messageId: string,
  config: SesHandlerConfig,
): Promise<void> => {
  const key = getKey(messageId, config);

  logger.debug(`[s3] Deleting s3://${config.emailBucket}/${key}`);

  await s3Client.send(
    new DeleteObjectCommand({ Bucket: config.emailBucket, Key: key }),
  );
};
