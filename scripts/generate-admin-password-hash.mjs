#!/usr/bin/env node

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

function createPasswordHash(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString("base64url");

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

async function promptPassword() {
  const rl = createInterface({ input, output, terminal: true });
  output.write("Enter admin password: ");
  input.setRawMode?.(true);
  let value = "";

  for await (const chunk of input) {
    const key = chunk.toString("utf8");

    if (key === "\r" || key === "\n") {
      output.write("\n");
      break;
    }

    if (key === "\u0003") {
      output.write("\nAborted.\n");
      process.exit(1);
    }

    if (key === "\u007f" || key === "\b") {
      value = value.slice(0, -1);
      continue;
    }

    value += key;
  }

  input.setRawMode?.(false);
  rl.close();
  return value.trim();
}

async function main() {
  const rawArg = process.argv[2] === "--" ? process.argv[3] : process.argv[2];
  const fromArg = rawArg?.trim();
  const password = fromArg || (await promptPassword());

  if (!password) {
    console.error("Password is required.");
    process.exit(1);
  }

  console.log(createPasswordHash(password));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
