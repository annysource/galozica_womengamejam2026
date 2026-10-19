"""Generate a seamless linear grayscale caustics texture; standard library only."""
import math
from pathlib import Path
import struct
import zlib

SIZE = 512
CELLS = 10

def seed(x, y):
    return (math.sin(x * 127.1 + y * 311.7 + 13.0) * 43758.5453) % 1.0

def chunk(name, data):
    return struct.pack('!I', len(data)) + name + data + struct.pack('!I', zlib.crc32(name + data) & 0xffffffff)

rows = bytearray()
for y in range(SIZE):
    rows.append(0)
    for x in range(SIZE):
        u, v = x / SIZE, y / SIZE
        # Periodic domain warp avoids a rigid regular cell pattern.
        px = u * CELLS + 0.30 * math.sin(v * math.tau * 3) + 0.12 * math.sin(u * math.tau * 2)
        py = v * CELLS + 0.27 * math.sin(u * math.tau * 3) + 0.15 * math.cos(v * math.tau * 2)
        ix, iy = math.floor(px), math.floor(py)
        distances = []
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                cx, cy = ix + dx, iy + dy
                sx, sy = cx % CELLS, cy % CELLS
                fx = cx + 0.15 + 0.7 * seed(sx, sy)
                fy = cy + 0.15 + 0.7 * seed(sx + 43, sy + 29)
                distances.append(math.hypot(px - fx, py - fy))
        distances.sort()
        gap = distances[1] - distances[0]
        light = math.exp(-((gap / 0.055) ** 2))
        light = 0.82 * light + 0.18 * math.exp(-((gap / 0.15) ** 2))
        rows.append(round(255 * light))

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('!2I5B', SIZE, SIZE, 8, 0, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(bytes(rows), 9))
png += chunk(b'IEND', b'')
Path(__file__).with_name('Causticas.png').write_bytes(png)
