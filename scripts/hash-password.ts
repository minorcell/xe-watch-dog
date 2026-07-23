import bcrypt from "bcryptjs";

// "pnpm run -- <arg>" forwards "--" as argv[2], so skip it.
const input = process.argv.slice(2).find((arg) => arg !== "--");

if (!input) {
  console.error('Usage: pnpm auth:hash -- "your-password"');
  process.exit(1);
}

const password = input;

async function main() {
  console.log(await bcrypt.hash(password, 12));
}

main();
