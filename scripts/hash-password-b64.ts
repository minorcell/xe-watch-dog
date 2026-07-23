import bcrypt from "bcryptjs";

// "pnpm run -- <arg>" forwards "--" as argv[2], so skip it.
const input = process.argv.slice(2).find((arg) => arg !== "--");

if (!input) {
  console.error('Usage: pnpm auth:hash-b64 -- "your-password"');
  process.exit(1);
}

// TS narrows after process.exit(1), but it doesn't flow into the async callback.
// Re-bind so the compiler knows it's defined.
const password = input;

async function main() {
  const hash = await bcrypt.hash(password, 12);
  console.log(Buffer.from(hash, "utf8").toString("base64"));
}

main();
