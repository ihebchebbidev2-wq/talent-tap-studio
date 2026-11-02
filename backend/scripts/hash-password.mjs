import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
// Run in a private terminal. The hash, never the password, is written to stdout.
const prompt = createInterface({ input: process.stdin, output: process.stderr });
const password = await prompt.question('Admin password (input is visible in this terminal): ');
prompt.close();
if (password.length < 8) throw new Error('Use at least 8 characters.');
const salt = randomBytes(16).toString('hex');
console.log(`${salt}:${scryptSync(password, salt, 64).toString('hex')}`);