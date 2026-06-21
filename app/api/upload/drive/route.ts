import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

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

    // --- Mode 1: OAuth2 with Refresh Token (For Personal Gmail 15GB Quota) ---
    if (hasOAuth2) {
      try {
        console.log('[Google Drive] Authenticating via OAuth2 Refresh Token...');
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground' // Redirect URI used in Google OAuth Playground
        );

        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const media = {
          mimeType: file.type,
          body: require('stream').Readable.from(buffer),
        };

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const response = await drive.files.create({
          requestBody: {
            name: file.name || `upload-${Date.now()}`,
            parents: folderId ? [folderId] : undefined,
          },
          media: media,
          fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id;

        // Share the file publicly so it can be viewed in browser / img tag
        await drive.permissions.create({
          fileId: fileId!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        // Use direct hotlink URL for displaying images in <img> tags
        const viewLink = `https://docs.google.com/uc?export=view&id=${fileId}`;

        console.log(`[Google Drive] Successfully uploaded file "${file.name}" via OAuth2 to folder "${folderId || 'Root'}". File ID: ${fileId}`);
        
        return NextResponse.json({ 
          success: true, 
          path: viewLink,
          fileId: fileId,
          source: 'google_drive_oauth2'
        });
      } catch (oauthError: any) {
        console.error('[Google Drive OAuth2 Error] Failed uploading via OAuth2:', oauthError);
        // If OAuth fails, we can fall back to Service Account or Local Fallback
      }
    }

    // --- Mode 2: Service Account (Requires Shared Drive to have Quota) ---
    if (hasDriveCreds) {
      try {
        console.log('[Google Drive] Authenticating via Service Account...');
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
        
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const media = {
          mimeType: file.type,
          body: require('stream').Readable.from(buffer),
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

        const viewLink = `https://docs.google.com/uc?export=view&id=${fileId}`;

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
      message: 'เก็บไฟล์ไว้ในโฟลเดอร์เครื่องเซิร์ฟเวอร์เนื่องจากไม่ได้ตั้งค่า Google Drive หรือเกิดข้อผิดพลาดในการเชื่อมต่อ'
    });

  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' }, { status: 500 });
  }
}
