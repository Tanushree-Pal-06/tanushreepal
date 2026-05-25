import { NextResponse } from 'next/server';

function isPrime(numStr) {
  const num = Number(numStr);
  if (!Number.isInteger(num) || num <= 1) {
    return false;
  }
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function getMimeTypeFromMagic(buffer) {
  if (buffer.length < 4) return 'application/octet-stream';
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (hex === '89504E47') return 'image/png';
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex === '25504446') return 'application/pdf';
  if (hex === '47494638') return 'image/gif';
  return 'application/octet-stream';
}

export async function GET() {
  return NextResponse.json({ operation_code: 1 }, { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data = [], file_b64 = null } = body;

    const numbers = [];
    const alphabets = [];
    let is_prime_found = false;

    if (Array.isArray(data)) {
      for (const item of data) {
        const str = String(item).trim();
        if (/^-?\d+$/.test(str)) {
          numbers.push(str);
          if (isPrime(str)) {
            is_prime_found = true;
          }
        } else if (/^[a-zA-Z]$/.test(str)) {
          alphabets.push(str);
        }
      }
    }

    const lowercaseAlphabets = alphabets.filter(
      (char) => char === char.toLowerCase() && char >= 'a' && char <= 'z'
    );
    const highest_lowercase_alphabet =
      lowercaseAlphabets.length > 0
        ? [
            lowercaseAlphabets.reduce(
              (max, char) => (char > max ? char : max),
              lowercaseAlphabets[0]
            ),
          ]
        : [];

    let file_valid = false;
    let file_mime_type = "";
    let file_size_kb = "";

    if (file_b64 && typeof file_b64 === 'string') {
      try {
        let base64Data = file_b64;
        let mimeType = "";

        const dataUrlRegex = /^data:([^;]+);base64,(.+)$/;
        const match = file_b64.match(dataUrlRegex);

        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }

        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.length > 0) {
          file_valid = true;
          if (!mimeType) {
            mimeType = getMimeTypeFromMagic(buffer);
          }
          file_mime_type = mimeType;
          file_size_kb = (buffer.length / 1024).toFixed(2);
        }
      } catch (e) {
        file_valid = false;
      }
    }

    return NextResponse.json(
      {
        is_success: true,
        user_id: 'tanushree_pal_06102005',
        email: 'tanushreepal230408@acropolis.in',
        roll_number: '0827AL231132',
        numbers,
        alphabets,
        highest_lowercase_alphabet,
        is_prime_found,
        file_valid,
        file_mime_type,
        file_size_kb,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        is_success: false,
        error: error.message || 'Invalid Request JSON',
      },
      { status: 400 }
    );
  }
}
