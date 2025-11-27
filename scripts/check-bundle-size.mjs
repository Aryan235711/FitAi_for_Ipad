import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const limits = [
  { prefix: "index-", maxKb: 300, label: "main" },
  { prefix: "vendor-react", maxKb: 220, label: "vendor-react" },
  { prefix: "vendor-charts", maxKb: 250, label: "vendor-charts" },
];

const assetsDir = path.resolve("dist/public/assets");

const findHashedFile = async (prefix) => {
  const files = await readdir(assetsDir);
  const target = files.find(
    (file) => file.startsWith(prefix) && file.endsWith(".js"),
  );
  if (!target) {
    throw new Error(`Unable to locate bundle matching prefix: ${prefix}`);
  }
  return target;
};

const getGzipKb = async (file) => {
  const buffer = await readFile(path.join(assetsDir, file));
  const gzipped = gzipSync(buffer);
  return gzipped.length / 1024;
};

const run = async () => {
  for (const { prefix, maxKb, label } of limits) {
    const file = await findHashedFile(prefix);
    const sizeKb = await getGzipKb(file);
    if (sizeKb > maxKb) {
      throw new Error(
        `${label} bundle ${file} is ${sizeKb.toFixed(1)} KB gzip (limit ${maxKb} KB)`,
      );
    }
    console.log(
      `✅ ${label} bundle ${file} is ${sizeKb.toFixed(1)} KB gzip (limit ${maxKb} KB)`,
    );
  }

  console.log("Bundle size check passed.");
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
