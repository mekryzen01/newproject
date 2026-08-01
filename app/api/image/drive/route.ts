import { NextResponse } from 'next/server';
import { google } from 'googleapis';

function parseServiceAccountJson(rawJson: string | undefined): any {
  if (!rawJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is empty');
  
  let jsonStr = rawJson.trim();
  
  // 1. Strip outer single/double quotes if they were kept by the environment loader
  if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
    jsonStr = jsonStr.slice(1, -1).trim();
  }
  if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
    jsonStr = jsonStr.slice(1, -1).trim();
  }
  
  let parseErrors: string[] = [];

  // Strategy A: Standard JSON Parse (and handle double-escaped strings)
  try {
    let parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (err: any) {
    parseErrors.push(`Standard: ${err.message}`);
  }

  // Strategy B: Normalize raw newlines to literal \n
  try {
    const cleaned = jsonStr.replace(/\r?\n/g, '\\n');
    let parsed = JSON.parse(cleaned);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (err2: any) {
    parseErrors.push(`Newline Fix: ${err2.message}`);
  }

  // Strategy C: Replace single quotes with double quotes (in case it is an object literal but not strict JSON)
  try {
    // Basic replacement for 'key': 'value' into "key": "value"
    const cleanedQuotes = jsonStr
      .replace(/'([^']+)':/g, '"$1":')
      .replace(/: \s*'([^']*)'/g, ': "$1"');
    let parsed = JSON.parse(cleanedQuotes);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (err3: any) {
    parseErrors.push(`Single Quote Fix: ${err3.message}`);
  }

  // If all strategies fail, output a highly descriptive error with structure info for debugging
  const length = jsonStr.length;
  const startChars = jsonStr.slice(0, 70);
  const endChars = jsonStr.slice(-40);
  throw new Error(`JSON parse failed. Strategies failed: [${parseErrors.join(' | ')}]. Total Length: ${length} chars. Start: ${startChars}... End: ...${endChars}`);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'ไม่พบ File ID ที่ต้องการดึงข้อมูล' }, { status: 400 });
    }

    const hasOAuth2 = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    const hasDriveCreds = 
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    let auth;

    if (hasOAuth2) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
      auth = oauth2Client;
    } else if (hasDriveCreds) {
      const credentials = parseServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
      });
    } else {
      return NextResponse.json({ error: 'ไม่ได้ตั้งค่าสิทธิ์ในการเชื่อมต่อ Google Drive ในระบบ' }, { status: 500 });
    }

    const drive = google.drive({ version: 'v3', auth });

    // 1. Get file metadata (MimeType)
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType, name'
    });

    // 2. Fetch file content as an ArrayBuffer
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // Return image with the original MimeType and cache header for performance
    return new Response(buffer, {
      headers: {
        'Content-Type': fileMetadata.data.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year in browser
      }
    });

  } catch (error: any) {
    console.error('[Image Proxy Error] Failed to fetch image from Google Drive:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการโหลดรูปภาพ' }, { status: 500 });
  }
}
