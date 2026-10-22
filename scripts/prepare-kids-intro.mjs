import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

// Keep each source upload below the connector's request-size limit.
// The checked output aligns group-card colors; the original narration is preserved.
const name = 'so-spielt-ihr-mit-2026-10-23.mp4';
const expectedHash = 'ffc375714b7e516feb64c2e5b20cd82554b60fb97b0b5c5169a26225b1e1b475';
const source = new URL('../media/kids-video/', import.meta.url);
const destination = new URL('../src/client/public/kids-video/', import.meta.url);
const parts = await Promise.all([1, 2].map(part => readFile(new URL(`${name}.part${part}`, source))));
const video = Buffer.concat(parts);
if (createHash('sha256').update(video).digest('hex') !== expectedHash) {
  throw new Error('Kids intro source parts are incomplete or corrupted.');
}
await mkdir(destination, { recursive: true });
await writeFile(new URL(name, destination), video);
await rm(new URL('so-spielt-ihr-mit-2026-10-22.mp4', destination), { force: true });
console.log('Prepared Kids intro video (aligned group colors, original narration).');
