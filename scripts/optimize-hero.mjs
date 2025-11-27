import path from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const inputPath = path.resolve(
  "attached_assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png",
);
const outputDir = path.resolve("client/public/assets/hero");
const sizes = [1920, 1280];

const ensureDir = async () => {
  await mkdir(outputDir, { recursive: true });
};

const createVariant = async (width) => {
  const baseName = `hero-${width}`;

  await sharp(inputPath)
    .resize({ width })
    .avif({ quality: 50 })
    .toFile(path.join(outputDir, `${baseName}.avif`));

  await sharp(inputPath)
    .resize({ width })
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `${baseName}.webp`));

  await sharp(inputPath)
    .resize({ width })
    .jpeg({ quality: 75, progressive: true })
    .toFile(path.join(outputDir, `${baseName}.jpg`));
};

const run = async () => {
  await ensureDir();
  for (const size of sizes) {
    await createVariant(size);
  }
  console.log(`Optimized hero variants stored in ${outputDir}`);
};

run().catch((error) => {
  console.error("Hero optimization failed", error);
  process.exit(1);
});
