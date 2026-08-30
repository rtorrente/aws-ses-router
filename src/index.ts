export { createSesLambdaHandler } from "./factory.js";
export { forwardEmail } from "./service/forwardService.js";
export { logger } from "./utils/logger.js";

export type { EmailHandlerFn, SesHandlerConfig } from "./types.js";
