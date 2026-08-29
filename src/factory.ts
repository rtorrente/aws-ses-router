import { processRecord } from "./service/handlerService.js";

import type { SESHandler } from "aws-lambda";

import type { SesHandlerConfig } from "./types.js";

export function createSesLambdaHandler(config: SesHandlerConfig): SESHandler {
  return async (event) => {
    await Promise.all(
      event.Records.map(async (record) => processRecord(record, config)),
    );
  };
}
