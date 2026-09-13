const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="50%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" rx="${size * 0.18}" fill="none" stroke="url(#iconGrad)" stroke-width="${size * 0.02}" opacity="0.5" />
    
    <g transform="translate(${size * 0.22}, ${size * 0.18}) scale(${size * 0.023})">
      <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" fill="url(#iconGrad)" />
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="#10b981" />
    </g>
    
    <text x="${size * 0.5}" y="${size * 0.84}" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.11}" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="-0.5">ColeSistema</text>
  </svg>`;
}

// Pure Node.js uncompressed / standard PNG builder
function createSolidPng(width, height, r = 16, g = 185, b = 129) {
  // Simple valid RGBA PNG encoder using zlib
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // Raw image data: filter byte (0) + width * 4 bytes per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    // Create nice gradient & rounded icon look
    const cy = y - height / 2;
    for (let x = 0; x < width; x++) {
      const cx = x - width / 2;
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Gradient background from dark slate to indigo
      const t = (x + y) / (width + height);
      const bgR = Math.round(15 + t * 25);
      const bgG = Math.round(23 + t * 20);
      const bgB = Math.round(42 + t * 60);

      // Simple inner emblem
      const distCenter = Math.sqrt(cx * cx + cy * cy);
      if (distCenter < width * 0.3) {
        rawData[pxOffset] = 16;     // Emerald R
        rawData[pxOffset + 1] = 185; // Emerald G
        rawData[pxOffset + 2] = 129; // Emerald B
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createSvg(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createSvg(512));
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSvg(64));

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createSolidPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createSolidPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createSolidPng(32, 32));

console.log('Generated icon-192.png, icon-512.png, and SVGs in public/');
