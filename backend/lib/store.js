const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");

function ensureFile(fileName, fallbackValue) {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
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
