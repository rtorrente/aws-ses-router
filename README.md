# aws-ses-router

*Route incoming SES emails to the right handler — forward, process, or ignore. Zero boilerplate.*

A lightweight AWS Lambda handler for **Amazon SES email receiving**. It fetches incoming emails from S3, routes them by recipient address or domain, and either forwards them via SES or passes the raw email to a custom handler function.

## How it works

When SES receives an email, it stores the raw message in S3 and triggers a Lambda function. This library handles that Lambda invocation:

1. Fetches the raw email from S3 using the message ID
2. Skips auto-replies automatically (`Auto-Submitted: auto-replied` header)
3. Matches each recipient against your configured handlers in order (first match wins)
4. Either **forwards** the email to a list of addresses, calls your **custom handler**, or **ignores** it if the handler is `null`
5. Optionally deletes the email from S3 after successful processing

## Installation

```bash
npm install aws-ses-router
# or
pnpm add aws-ses-router
```

## Usage

```ts
import { createSesLambdaHandler } from 'aws-ses-router';

export const handler = createSesLambdaHandler({
  emailBucket: process.env.EMAIL_BUCKET!,
  emailKeyPrefix: 'emails/',          // optional S3 key prefix
  overrideForwardFrom: 'noreply@example.com', // optional: override the From address when forwarding
  deleteOnSuccess: true,              // optional: delete the S3 object after processing

  handlers: [
    // Forward to one or more addresses (exact match)
    { match: 'hello@example.com', handler: ['alice@gmail.com', 'bob@gmail.com'] },

    // Custom handler -- receives the raw RFC 2822 email string
    { match: 'support@example.com', handler: async (rawEmail) => {
      // parse, store, send to a webhook, etc.
    }},

    // Explicitly ignore a recipient (no forwarding, no handler, no warning)
    { match: 'noreply@example.com', handler: null },

    // RegExp -- matches any recipient @example.com not matched above
    { match: /@example\.com$/, handler: ['team@gmail.com'] },
  ],
});
```

### Config reference

```ts
interface SesHandlerConfig {
  emailBucket: string;                   // S3 bucket name
  emailKeyPrefix?: string;               // prepended to the message ID when fetching from S3
  overrideForwardFrom?: string;          // SES-verified "From" address used when forwarding; falls back to the original recipient if omitted
  forwardConfigurationSetName?: string;  // SES configuration set name attached to forwarded emails
  deleteOnSuccess?: boolean;             // delete the S3 object after all handlers succeed (default: false)
  handlers: HandlerEntry[];
}

interface HandlerEntry {
  match: string | RegExp;             // exact address string or a regexp tested against the normalised recipient
  handler: string[] | EmailHandlerFn | null; // forward list, async function, or null to ignore
}

type EmailHandlerFn = (rawEmail: string) => Promise<void>;
```

### Handler matching order

For each recipient, entries are tested **in array order** — the first match wins:

1. If `match` is a `string`, it must equal the normalised recipient address exactly
2. If `match` is a `RegExp`, it is tested against the normalised recipient address
3. No match -- logs a warning and skips

Put more specific entries (exact addresses) before broader ones (regexps) to control priority.

### Handler values

| Value | Behaviour |
|---|---|
| `string[]` | Forwards the email to the listed addresses via SES |
| `EmailHandlerFn` | Calls the async function with the raw RFC 2822 email string |
| `null` | Silently ignores the email (no forwarding, no warning) |

### Auto-reply detection

Emails containing an `Auto-Submitted: auto-replied` header are automatically skipped for all handlers. This prevents forwarding loops when your destination addresses have out-of-office replies.

### Email forwarding

When a handler is an array of addresses, the library rewrites the email before sending:

- Strips headers that break re-sending: `Return-Path`, `Sender`, `Message-ID`, `DKIM-Signature`, etc.
- Rewrites `From` using `overrideForwardFrom` (keeps original display name) if set, or falls back to the original recipient address
- Adds `Reply-To` pointing to the original sender
- Adds `Auto-Submitted: auto-generated` to prevent reply loops

### Logger

The library exports a `logger` instance that respects the `LOG_LEVEL` environment variable (`debug`, `info`, `warn`, `error`; default: `info`). You can use it in your custom handlers for consistent log formatting:

```ts
import { logger } from 'aws-ses-router';

const handler: EmailHandlerFn = async (rawEmail) => {
  logger.info('Processing email');
};
```

## Examples

Ready-to-use examples are available in the [`examples/`](./examples) directory:

- [`terraform-custom-lambda`](./examples/terraform-custom-lambda) — Terraform deployment with a custom Lambda (TypeScript + esbuild) using basic forward rules
- [`custom-lambda-custom-handler`](./examples/custom-lambda-custom-handler) — Lambda code demonstrating a custom handler that posts raw emails to an [osTicket](https://osticket.com) instance

## AWS setup

Your Lambda execution role needs the following permissions:

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
}
```

If you use `deleteOnSuccess`, also add:

```json
{
  "Effect": "Allow",
  "Action": ["s3:DeleteObject"],
  "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
}
```

If you use email forwarding, also add:

```json
{
  "Effect": "Allow",
  "Action": ["ses:SendRawEmail"],
  "Resource": "*"
}
```

In SES, configure a **receipt rule** that:
1. Stores the email to your S3 bucket (with the same prefix you set in `emailKeyPrefix`, if any)
2. Invokes your Lambda function

## Building from source

```bash
pnpm install

# Build both the Lambda zip and the npm library
pnpm build

# Lambda zip only (bundled + tree-shaken)
pnpm build:lambda

# npm library (TypeScript declarations + ESM)
pnpm build:lib
```

## Requirements

- Node.js 24+
- AWS SDK v3 (`@aws-sdk/client-s3` and `@aws-sdk/client-ses`) -- included in the Lambda zip, peer dependency when used as a library

## License

GPL-3.0