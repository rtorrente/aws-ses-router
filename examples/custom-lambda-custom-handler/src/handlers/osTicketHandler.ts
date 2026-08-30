import { logger } from "aws-ses-router";

import type { EmailHandlerFn } from "aws-ses-router";

export interface OsTicketHandlerConfig {
  /** Full endpoint URL, e.g. "https://helpdesk.example.com/api/tickets.email" */
  apiUrl: string;
  /** API key generated in the osTicket admin panel (Admin > API) */
  apiKey: string;
}

export const createOsTicketHandler =
  (config: OsTicketHandlerConfig): EmailHandlerFn =>
  async (rawEmail) => {
    logger.debug(`[osTicket] POST ${config.apiUrl}`);

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "text/plain",
      },
      body: rawEmail,
    });

    logger.debug(`[osTicket] HTTP ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `osTicket API responded with HTTP ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
      );
    }
  };