import zlib from 'zlib'
import fs from 'fs'

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Blue (#3b82f6) square
  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0  // filter type None
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = 0x3b
    row[1 + x * 3 + 1] = 0x82
    row[1 + x * 3 + 2] = 0xf6
  }

  const rawData = Buffer.concat(Array(size).fill(row))
  const compressed = zlib.deflateSync(rawData)

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/icons/icon16.png', createPng(16))
fs.writeFileSync('public/icons/icon48.png', createPng(48))
fs.writeFileSync('public/icons/icon128.png', createPng(128))
console.log('Icons created: icon16.png, icon48.png, icon128.png')
