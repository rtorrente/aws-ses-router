export type EmailHandlerFn = (rawEmail: string) => Promise<void>;

export type HandlerValue = string[] | EmailHandlerFn | null;

export interface HandlerEntry {
  match: string | RegExp;
  handler: HandlerValue;
}

export interface SesHandlerConfig {
  emailBucket: string;
  emailKeyPrefix?: string;
  overrideForwardFrom?: string;
  deleteOnSuccess?: boolean;
  handlers: HandlerEntry[];
}
