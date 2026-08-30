import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const { engines } = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "package.json"),
    "utf-8",
  ),
);
const nodeTarget = `node${engines.node.match(/\d+/)[0]}`;

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  sourcemap: false,
  minify: false,
  target: [nodeTarget],
  treeShaking: true,
  format: "esm",
  outdir: "dist",
  external: ["@aws-sdk/*"],
  outExtension: { ".js": ".mjs" },
});

console.log("✔ Build → dist/");