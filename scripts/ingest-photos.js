#!/usr/bin/env node
// Diffs assets/images/ against public/images/, copies new files,
// and updates ALL_IMAGES in src/lib/images.ts.
// Exits with code 0 if new photos were ingested, 1 if nothing changed.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const ASSETS_DIR = path.join(ROOT, "assets/images");
const PUBLIC_DIR = path.join(ROOT, "public/images");
const IMAGES_TS = path.join(ROOT, "src/lib/images.ts");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

function getImageFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
}

const assetFiles = getImageFiles(ASSETS_DIR);
const publicFiles = new Set(getImageFiles(PUBLIC_DIR));

const newFiles = assetFiles.filter((f) => !publicFiles.has(f));

if (newFiles.length === 0) {
  console.log("No new photos found.");
  process.exit(1);
}

// Copy new files to public/images/
for (const file of newFiles) {
  const src = path.join(ASSETS_DIR, file);
  const dest = path.join(PUBLIC_DIR, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${file}`);
}

// Read current images.ts and append new paths
const current = fs.readFileSync(IMAGES_TS, "utf8");

// Extract existing entries
const existingMatches = [...current.matchAll(/"(\/images\/[^"]+)"/g)];
const existingPaths = existingMatches.map((m) => m[1]);

// Append new paths (in the order they were found)
const newPaths = newFiles.map((f) => `/images/${f}`);
const allPaths = [...existingPaths, ...newPaths];

const entries = allPaths.map((p) => `  "${p}",`).join("\n");
const updated = `// All available grandkid images\nexport const ALL_IMAGES = [\n${entries}\n];\n`;

fs.writeFileSync(IMAGES_TS, updated, "utf8");
console.log(`Updated images.ts with ${newFiles.length} new photo(s).`);

process.exit(0);
