import { encode, decode } from "gpt-3-encoder";
import { fileURLToPath } from "url";
import fs from "fs";
import "./config.js";

export const countTokens = (text) => {
  const tokens = encode(text);
  return tokens.length;
};

const tokensinFile = () => {
  const file = process.argv[2];
  const fileText = fs.readFileSync(file, "utf-8");
  const tokens = countTokens(fileText);
  console.log(`The number of tokens in the file is: ${tokens}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  tokensinFile();
}
