import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Keep each source upload below the connector's request-size limit.
// The built MP4 is byte-for-byte identical to the supplied original.
const name = 'so-spielt-ihr-mit-2026-10-22.mp4';
const expectedHash = '74ea410948c6d906a79fd93f5faa68c761dd61080c11fd223c4769c0c6a52e9f';
const source = new URL('../media/kids-video/', import.meta.url);
const destination = new URL('../src/client/public/kids-video/', import.meta.url);
const parts = await Promise.all([1, 2].map(part => readFile(new URL(`${name}.part${part}`, source))));
const video = Buffer.concat(parts);
if (createHash('sha256').update(video).digest('hex') !== expectedHash) {
  throw new Error('Kids intro source parts are incomplete or corrupted.');
}
await mkdir(destination, { recursive: true });
await writeFile(new URL(name, destination), video);
console.log('Prepared Kids intro video (original picture and sound).');
