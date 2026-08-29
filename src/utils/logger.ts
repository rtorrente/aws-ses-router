/* eslint-disable no-console */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const resolved = process.env.LOG_LEVEL?.toLowerCase();
const currentLevel: Level =
  resolved !== undefined && resolved in LEVELS ? (resolved as Level) : "info";

const enabled = (level: Level) => LEVELS[level] >= LEVELS[currentLevel];

export const logger = {
  debug: (...args: unknown[]) => {
    if (enabled("debug")) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (enabled("info")) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (enabled("warn")) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (enabled("error")) console.error(...args);
  },
};
