// Delegate to the CJS config so build servers that can't parse TypeScript will still succeed.
// Keeping this file minimal prevents Prisma from failing when it tries to parse .ts files on hosts
// that don't transpile TypeScript.
module.exports = require('./prisma.config.cjs');

