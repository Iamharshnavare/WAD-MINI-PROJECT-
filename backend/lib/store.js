const fs = require("fs");
const path = require("path");

const SEED_DIR = path.join(__dirname, "..", "data");
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/tabletrail-data" : SEED_DIR);

function ensureFile(fileName, fallbackValue) {
  const filePath = path.join(DATA_DIR, fileName);
  const seedPath = path.join(SEED_DIR, fileName);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, filePath);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
    }
  }

  return filePath;
}

function readJson(fileName, fallbackValue) {
  const filePath = ensureFile(fileName, fallbackValue);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(fileName, value) {
  const filePath = ensureFile(fileName, value);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

module.exports = {
  readJson,
  writeJson
};
