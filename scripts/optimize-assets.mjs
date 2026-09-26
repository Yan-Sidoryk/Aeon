// Turns the raw Higgsfield outputs into web-ready assets.
//   node scripts/optimize-assets.mjs
// - assets-src/doodles/*.svg  -> public/images/doodles/*.png  (white keyed to transparency, trimmed, 240px)
// - public/images/photos/*.png -> public/images/photos/*.webp (max 1600px wide, q82), original png removed
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");

async function doodles() {
  const src = path.join(root, "assets-src/doodles");
  const out = path.join(root, "public/images/doodles");
  fs.mkdirSync(out, { recursive: true });
  for (const file of fs.readdirSync(src).filter((f) => f.endsWith(".svg"))) {
    const svg = fs.readFileSync(path.join(src, file), "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/, "");
    const { data, info } = await sharp(Buffer.from(svg), { density: 144 })
      .resize(480, 480, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    // GIMP-style "color to alpha" against white: keeps black/orange ink, turns paper transparent.
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const a = Math.max(255 - r, 255 - g, 255 - b) / 255;
      if (a <= 0.02) continue; // fully transparent
      const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
      rgba[j] = un(r); rgba[j + 1] = un(g); rgba[j + 2] = un(b); rgba[j + 3] = Math.round(a * 255);
    }
    const name = file.replace(/\.svg$/, ".png");
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .trim({ threshold: 1 })
      .resize(240, 240, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(out, name));
    console.log("doodle", name, fs.statSync(path.join(out, name)).size);
  }
}

async function photos() {
  const dir = path.join(root, "public/images/photos");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".png"))) {
    const inPath = path.join(dir, file);
    const outPath = inPath.replace(/\.png$/, ".webp");
    await sharp(inPath).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath);
    const meta = await sharp(outPath).metadata();
    fs.rmSync(inPath);
    console.log("photo", path.basename(outPath), `${meta.width}x${meta.height}`, fs.statSync(outPath).size);
  }
}

await doodles();
await photos();
