#!/usr/bin/env python3
"""Recolor only the three group-card backgrounds in the supplied intro.

Optional authoring dependencies: ffmpeg, Python numpy/scipy. The normal npm build
uses the checked-in output parts and does not require these dependencies.
Original narration, timing, illustrations and answer-field colors are preserved.
"""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'media/kids-video'
NAME = 'so-spielt-ihr-mit-2026-10-23.mp4'
WIDTH, HEIGHT, FPS = 1920, 1080, 30
# Source fills measured from the original H.264, destination fills from the show.
CARDS = [
    (70, 490, (255, 219, 114), (165, 243, 220), 94, 463),
    (490, 915, (154, 240, 218), (255, 218, 104), 516, 883),
    (915, 1335, (217, 194, 241), (248, 161, 173), 937, 1304),
]
BASE = np.array((8, 42, 60), dtype=np.float32)


def recolor(frame):
    for x1, x2, source, target, left, right in CARDS:
        area = frame[400:890, x1:x2]
        pixels = area.astype(np.float32)
        source = np.array(source, dtype=np.float32)
        direction = source - BASE
        alpha = np.clip(np.sum((pixels - BASE) * direction, axis=2) / np.sum(direction ** 2), 0, 1.15)
        residual = np.linalg.norm(pixels - (BASE + alpha[:, :, None] * direction), axis=2)
        # A source-colored shadow is recolored with its existing shading. Dark outlines
        # and the separate mascot/illustration components are kept intact.
        seed_x, seed_y = (left + right) // 2 - x1, 840 - 400
        opacity = alpha[seed_y, seed_x]
        if opacity < .10 or residual[seed_y, seed_x] > 28:
            continue
        yy, xx = np.ogrid[400:890, x1:x2]
        cx = np.clip(xx, left + 40, right - 40)
        cy = np.clip(yy, 424 + 40, 875 - 40)
        card_shape = (xx - cx) ** 2 + (yy - cy) ** 2 <= 40 ** 2
        mask = (residual < 28) & (alpha > max(.07, opacity * .36)) & card_shape
        labels, _ = ndimage.label(mask)
        component = labels[seed_y, seed_x]
        if not component:
            continue
        mask = labels == component
        if mask.sum() < 20_000:
            continue
        replacement = pixels + alpha[:, :, None] * (np.array(target) - source)
        area[mask] = np.clip(np.rint(replacement[mask]), 0, 255).astype(np.uint8)
    return frame


def main():
    with tempfile.TemporaryDirectory(prefix='kids-colors-') as temporary:
        original = Path(temporary) / 'original.mp4'
        original.write_bytes(b''.join((SOURCE / f'so-spielt-ihr-mit-2026-10-22.mp4.part{i}').read_bytes() for i in (1, 2)))
        output = Path(temporary) / NAME
        decoder = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(original), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
        encoder = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS), '-i', '-', '-i', str(original), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', str(output)], stdin=subprocess.PIPE)
        number = 0
        while True:
            data = decoder.stdout.read(WIDTH * HEIGHT * 3)
            if not data:
                break
            if len(data) != WIDTH * HEIGHT * 3:
                raise RuntimeError('Incomplete source frame')
            # These bounds contain only the group presentation, including its fades.
            if 5.65 <= number / FPS < 20.5:
                frame = np.frombuffer(data, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3).copy()
                data = recolor(frame).tobytes()
            encoder.stdin.write(data)
            number += 1
            if number % 300 == 0:
                print(f'{number}/{1597} frames', flush=True)
        decoder.stdout.close()
        encoder.stdin.close()
        if decoder.wait() or encoder.wait():
            raise RuntimeError('Video conversion failed')
        # Confirm exact AAC packet preservation before committing the new media.
        def audio_hash(path):
            return subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-']).strip()
        if audio_hash(original) != audio_hash(output):
            raise RuntimeError('Narration changed')
        video = output.read_bytes()
        for index, start in enumerate(range(0, len(video), 6_300_000), 1):
            (SOURCE / f'{NAME}.part{index}').write_bytes(video[start:start + 6_300_000])
        import hashlib
        print(f'{NAME}: {len(video)} bytes, {number} frames, sha256={hashlib.sha256(video).hexdigest()}', flush=True)
        print('AAC narration preserved exactly.', flush=True)


if __name__ == '__main__':
    main()
