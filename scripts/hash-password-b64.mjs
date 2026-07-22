import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: pnpm auth:hash-b64 -- "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(Buffer.from(hash, "utf8").toString("base64"));
