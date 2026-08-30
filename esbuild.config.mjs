/* eslint-disable */

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

import fs, { readFileSync } from "node:fs";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { ZipArchive } from "archiver";

const { engines } = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "package.json"),
    "utf-8",
  ),
);
const nodeTarget = `node${engines.node.match(/\d+/)[0]}`;

const outDir = "dist/lambda";

/** @type {BuildOptions} */
const common = {
  entryPoints: ["src/lambda.ts"],
  bundle: true,
  platform: "node",
  sourcemap: false,
  minify: false,
  target: [nodeTarget],
  treeShaking: true,
  format: "esm",
  outdir: outDir,
  external: ["@aws-sdk/*"],
  outExtension: { ".js": ".mjs" },
};

async function zipDist() {
  const zipPath = path.join(outDir, "lambda.zip");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve());
    output.on("end", () => resolve());
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn(err);
      } else {
        reject(err);
      }
    });
    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    const files = fs.readdirSync(outDir).filter((f) => f === "lambda.mjs");
    for (const f of files) {
      const full = path.join(outDir, f);
      archive.file(full, { name: f });
    }

    archive.finalize();
  });
}

async function build() {
  try {
    await esbuild.build({ ...common });
    await zipDist();
    console.log("✔ Build completed → dist/lambda/lambda.zip");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const mode = process.argv[2];

if (mode === "build") {
  build();
} else {
  console.log("Usage: node esbuild.config.mjs build");
}
