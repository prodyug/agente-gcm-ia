import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
// Import the parser directly because the package entry point runs a debug fixture in ESM.
import pdf from "pdf-parse/lib/pdf-parse.js";

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const input = option("input");
const title = option("title");
const topic = option("topic");
const sourceUrl = option("source-url");

if (!input || !title || !topic) {
  console.error(
    "Uso: npm run import:reference -- --input data/sources/prova.pdf --title \"Prova GCM\" --topic \"Lei 13.022/2014\" [--source-url https://...]"
  );
  process.exit(1);
}

const file = await readFile(input);
const parsed = await pdf(file);
const content = parsed.text.replace(/\s+\n/g, "\n").trim();

if (content.length < 300) {
  console.error("O PDF não possui texto extraível suficiente. Use um PDF com OCR.");
  process.exit(1);
}

const reference = {
  title,
  board: "IDECAN",
  topics: topic.split(",").map((value) => value.trim()).filter(Boolean),
  sourceUrl: sourceUrl || null,
  importedAt: new Date().toISOString(),
  sourceFile: path.basename(input),
  pageCount: parsed.numpages,
  content,
};
const referencesDirectory = process.env.REFERENCE_DIR || path.join("data", "references");
const output = path.join(referencesDirectory, `${Date.now()}-${slug(title)}.json`);

await mkdir(referencesDirectory, { recursive: true });
await writeFile(output, `${JSON.stringify(reference, null, 2)}\n`, "utf8");
console.log(`Referência importada: ${output}`);
