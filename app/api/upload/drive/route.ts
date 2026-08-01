import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่ต้องการอัพโหลด' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const hasOAuth2 = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    const hasDriveCreds = 
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON && 
      process.env.GOOGLE_DRIVE_FOLDER_ID;

    let viewLink = '';
    let fileId = '';

    // --- Mode 1: OAuth2 flow (if client keys are present) ---
    if (hasOAuth2) {
      try {
        console.log('[Google Drive] Authenticating via OAuth2...');
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const media = {
          mimeType: file.type,
          body: Readable.from(buffer),
        };

        const response = await drive.files.create({
          requestBody: {
            name: file.name || `upload-${Date.now()}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
          },
          media: media,
          fields: 'id, webViewLink, webContentLink',
        });

        fileId = response.data.id || '';
        viewLink = response.data.webViewLink || '';

        console.log('[Google Drive OAuth2 Success] Uploaded file ID:', fileId);

        // Update permissions to public read so everyone can load image
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        return NextResponse.json({ 
          success: true, 
          path: viewLink,
          fileId: fileId,
          source: 'google_drive_oauth2'
        });
      } catch (oauthError: any) {
        console.error('[Google Drive OAuth2 Error] Failed uploading via OAuth2:', oauthError);
      }
    }

    // --- Mode 2: Service Account (Requires Shared Drive to have Quota) ---
    if (hasDriveCreds) {
      try {
        console.log('[Google Drive] Authenticating via Service Account...');
        const credentials = parseServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const media = {
          mimeType: file.type,
          body: Readable.from(buffer),
        };

        const response = await drive.files.create({
          requestBody: {
            name: file.name || `upload-${Date.now()}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
          },
          media: media,
          fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id;

        await drive.permissions.create({
          fileId: fileId!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        const viewLink = `/api/image/drive?id=${fileId}`;

        console.log(`[Google Drive] Successfully uploaded file "${file.name}" via Service Account. File ID: ${fileId}`);
        
        return NextResponse.json({ 
          success: true, 
          path: viewLink,
          fileId: fileId,
          source: 'google_drive_service_account'
        });
      } catch (driveError: any) {
        console.error('[Google Drive Service Account Error] Failed uploading to Google Drive:', driveError);
      }
    }

    // --- Mode 3: Local Fallback Upload Mode (If credentials are not configured or failed) ---
    console.warn('[Warning] Google Drive authentication not configured or failed. Storing file locally in public/uploads.');

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name || '');
    const uniqueName = `upload-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      path: localUrl,
      source: 'local_fallback',
      message: 'เก็บไฟล์ไว้ในโฟลเดอร์เครื่องเซิร์ฟเวอร์เนื่องจากเกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive'
    });

  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' }, { status: 500 });
  }
}
