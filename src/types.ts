export type EmailHandlerFn = (rawEmail: string) => Promise<void>;

export interface SesHandlerConfig {
  emailBucket: string;
  emailKeyPrefix?: string;
  overrideForwardFrom?: string;
  deleteOnSuccess?: boolean;
  handlers: Record<string, string[] | EmailHandlerFn | null>;
}
