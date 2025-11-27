import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const limits = [
  { prefix: "index-", maxKb: 300, maxRawKb: 1200, label: "main" },
  { prefix: "vendor-react", maxKb: 220, maxRawKb: 800, label: "vendor-react" },
  { prefix: "vendor-charts", maxKb: 250, maxRawKb: 900, label: "vendor-charts" },
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

const getSizes = async (file) => {
  const buffer = await readFile(path.join(assetsDir, file));
  const gzipped = gzipSync(buffer);
  return {
    gzipKb: gzipped.length / 1024,
    rawKb: buffer.length / 1024,
  };
};

const run = async () => {
  let failed = false;

  for (const { prefix, maxKb, maxRawKb, label } of limits) {
    const file = await findHashedFile(prefix);
    const { gzipKb, rawKb } = await getSizes(file);

    const gzipOkay = gzipKb <= maxKb;
    const rawOkay = rawKb <= maxRawKb;

    const gzipStatus = gzipOkay ? "✅" : "❌";
    const rawStatus = rawOkay ? "✅" : "❌";

    console.log(
      `${gzipStatus} ${label} gzip: ${gzipKb.toFixed(1)} KB (limit ${maxKb} KB)`,
    );
    console.log(
      `${rawStatus} ${label} raw: ${rawKb.toFixed(1)} KB (limit ${maxRawKb} KB)`,
    );

    if (!gzipOkay || !rawOkay) {
      failed = true;
      console.error(`Bundle size exceeded for ${label} (${file}).`);
    }
  }

  if (failed) {
    console.error("Bundle size check failed.");
    process.exit(1);
  }

  console.log("Bundle size check passed.");
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
