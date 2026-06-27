import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
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
