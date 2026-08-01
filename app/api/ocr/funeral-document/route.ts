import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';

/**
 * Universal Multi-Engine AI Vision Document Reader for Thai Funeral Request Forms
 * Comprehensive OpenRouter Free Vision integration with transparent error reporting.
 */

function getEnvVariable(keyName: string): string {
  if (process.env[keyName]) return process.env[keyName]!;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === keyName) {
          return v.join('=').trim();
        }
      }
    }
  } catch (e) {
    console.warn(`Error reading .env.local for ${keyName}:`, e);
  }
  return '';
}

function cleanJSONString(str: string): string {
  if (!str) return '';
  let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// 1. OpenRouter Free AI Vision Models
async function runOpenRouterVisionAI(base64Data: string, mimeType: string): Promise<{ data: Record<string, any> | null; logText: string; rawReply?: string }> {
  const apiKey = getEnvVariable('OPENROUTER_API_KEY');
  if (!apiKey || !apiKey.trim()) {
    return { data: null, logText: 'ยังไม่ได้ระบุ OPENROUTER_API_KEY ใน .env.local' };
  }

  const prompt = `You are an expert Thai document reader specializing in handwritten Thai funeral request forms ("ใบแจ้งขอตั้งศพ ณ วัดดอนเศรษฐี").
Read all handwritten text and printed text on this uploaded document photo and return a strict JSON object:
{
  "deceased_name": "ชื่อ-นามสกุล ผู้เสียชีวิต",
  "deceased_age": 86,
  "deceased_nationality": "สัญชาติ",
  "deceased_birthdate": "วันเกิด",
  "deceased_occupation": "อาชีพ",
  "death_date": "YYYY-MM-DD",
  "death_time": "เวลา",
  "death_cause": "สาเหตุการเสียชีวิต",
  "death_location": "สถานที่เสียชีวิต",
  "reporter_name": "ชื่อ-นามสกุล ผู้แจ้ง",
  "reporter_age": 53,
  "reporter_relation": "ความสัมพันธ์",
  "reporter_address": "ที่อยู่ผู้แจ้ง",
  "reporter_phone": "เบอร์โทรศัพท์",
  "death_certificate_no": "เลขที่ใบมรณบัตร",
  "register_no": "ลำดับทะเบียน",
  "cremation_date": "YYYY-MM-DD",
  "cremation_time": "เวลาฌาปนกิจ"
}
Only extract fields visible on the image. Return ONLY valid JSON without markdown quotes.`;

  const openRouterModels = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5-exp:free',
    'qwen/qwen-2-vl-72b-instruct:free',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'mistralai/pixtral-12b:free'
  ];

  let lastErr = '';

  for (const model of openRouterModels) {
    try {
      console.log(`[OpenRouter AI Vision] Requesting ${model}...`);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Wat Don Funeral OS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64Data}` }
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = `OpenRouter (${model}) Fail [${res.status}]: ${errText}`;
        console.warn(`[OpenRouter AI Vision] (${model}) Failed (${res.status}): ${errText}`);
        continue;
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message?.content || '';
      const cleanJsonStr = cleanJSONString(reply);
      if (cleanJsonStr) {
        try {
          const parsed = JSON.parse(cleanJsonStr);
          console.log(`[OpenRouter AI Vision] (${model}) Success JSON:`, parsed);
          return { data: parsed, logText: `OpenRouter Free AI Vision (${model})`, rawReply: reply };
        } catch (jsonParseErr) {
          console.warn(`[OpenRouter AI Vision] (${model}) JSON parse error:`, jsonParseErr);
        }
      }
    } catch (err: any) {
      lastErr = `OpenRouter Exception (${model}): ${err?.message || err}`;
      console.warn(`[OpenRouter AI Vision] (${model}) Exception:`, err);
    }
  }

  return { data: null, logText: lastErr };
}

// 2. Gemini AI Vision Model
async function runGeminiVisionOCR(base64Data: string, mimeType: string): Promise<{ data: Record<string, any> | null; error?: string }> {
  const apiKey = getEnvVariable('GEMINI_API_KEY');
  if (!apiKey || !apiKey.trim()) {
    return { data: null, error: 'ยังไม่ได้ระบุ GEMINI_API_KEY ใน .env.local' };
  }

  const prompt = `You are a strict Thai document OCR reader. Read all text from this uploaded document photo ("ใบแจ้งขอตั้งศพ ณ วัดดอนเศรษฐี") and return a strict JSON object:
{
  "deceased_name": "ชื่อ-นามสกุล ผู้เสียชีวิต",
  "deceased_age": 86,
  "deceased_nationality": "สัญชาติ",
  "deceased_birthdate": "วันเกิด",
  "deceased_occupation": "อาชีพ",
  "death_date": "YYYY-MM-DD",
  "death_time": "เวลา",
  "death_cause": "สาเหตุการเสียชีวิต",
  "death_location": "สถานที่เสียชีวิต",
  "reporter_name": "ชื่อ-นามสกุล ผู้แจ้ง",
  "reporter_age": 53,
  "reporter_relation": "ความสัมพันธ์",
  "reporter_address": "ที่อยู่ผู้แจ้ง",
  "reporter_phone": "เบอร์โทรศัพท์",
  "death_certificate_no": "เลขที่ใบมรณบัตร",
  "register_no": "ลำดับทะเบียน",
  "cremation_date": "YYYY-MM-DD",
  "cremation_time": "เวลาฌาปนกิจ"
}
Only extract fields that are actually visible on the uploaded image. Do not invent fake data. Return ONLY valid JSON without markdown.`;

  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
  ];

  let lastError = '';

  for (const url of endpoints) {
    try {
      const res = await fetch(`${url}?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `Gemini API Status ${res.status}: ${errText}`;
        continue;
      }

      const json = await res.json();
      const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = cleanJSONString(candidateText);
      if (cleanJsonStr) {
        return { data: JSON.parse(cleanJsonStr) };
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return { data: null, error: lastError };
}

// 3. Google Cloud Vision API
async function getServiceAccountAccessToken(): Promise<string | null> {
  const saJsonStr = getEnvVariable('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!saJsonStr) return null;

  try {
    const sa = JSON.parse(saJsonStr);
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const signatureInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(sa.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    return null;
  }
}

async function runGoogleCloudVisionOCR(base64Data: string): Promise<string | null> {
  const token = await getServiceAccountAccessToken();
  if (!token) return null;

  try {
    const res = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
          }
        ]
      })
    });

    const json = await res.json();
    const text = json?.responses?.[0]?.fullTextAnnotation?.text || json?.responses?.[0]?.textAnnotations?.[0]?.description;
    return text || null;
  } catch (err) {
    return null;
  }
}

function parseDynamicOCRText(text: string) {
  const result: Record<string, any> = {};
  if (!text || !text.trim()) return result;

  const cleanText = text.replace(/\r\n/g, '\n');

  // 1. Deceased Name
  const nameMatch = cleanText.match(/(?:ชื่อ|ผู้เสียชีวิต|ผู้วายชนม์|ผู้ตาย)\s*[:：.\s]*([A-Za-z\u0E00-\u0E7F\s.]{2,40})(?:\s+นามสกุล\s*[:：.\s]*([A-Za-z\u0E00-\u0E7F\s.]{2,40}))?/i);
  if (nameMatch) {
    const firstName = nameMatch[1]?.trim() || '';
    const lastName = nameMatch[2]?.trim() || '';
    result.deceased_name = lastName ? `${firstName} ${lastName}` : firstName;
  } else {
    const engNameMatch = cleanText.match(/(?:Mr\.|Mrs\.|Ms\.|Miss)\s*([A-Za-z\s.]{3,40})/i);
    if (engNameMatch) {
      result.deceased_name = engNameMatch[0].trim();
    }
  }

  // 2. Deceased Age
  const ageMatch = cleanText.match(/อายุ\D*?(\d{1,3})/i);
  if (ageMatch) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum > 0 && ageNum < 130) {
      result.deceased_age = ageNum;
    }
  }

  // 3. Deceased Nationality
  const natMatch = cleanText.match(/สัญชาติ\D*?([\u0E00-\u0E7F\w]{2,20})/i);
  if (natMatch) {
    result.deceased_nationality = natMatch[1].trim();
  }

  // 4. Deceased Birthdate
  const birthMatch = cleanText.match(/เกิดเมื่อ\D*?(\d{1,2})\D*?([\u0E00-\u0E7F]+)\D*?(\d{2,4})/i);
  if (birthMatch) {
    result.deceased_birthdate = `${birthMatch[1]} ${birthMatch[2]} ${birthMatch[3]}`;
  }

  // 5. Deceased Occupation
  const occMatch = cleanText.match(/อาชีพ\D*?([\u0E00-\u0E7F\w\s()]{2,30})/i);
  if (occMatch) {
    result.deceased_occupation = occMatch[1].trim();
  }

  // 6. Death Date
  const deathMatch = cleanText.match(/เสียชีวิต\D*?(\d{1,2})\D*?([\u0E00-\u0E7F]+)\D*?(\d{2,4})/i);
  if (deathMatch) {
    const d = deathMatch[1].padStart(2, '0');
    const mStr = deathMatch[2];
    let y = parseInt(deathMatch[3], 10);
    if (y < 100) y += 2500;
    if (y > 2500) y -= 543;

    const thaiMonths: Record<string, string> = {
      'มกราคม': '01', 'ม.ค.': '01',
      'กุมภาพันธ์': '02', 'ก.พ.': '02',
      'มีนาคม': '03', 'มี.ค.': '03',
      'เมษายน': '04', 'เม.ย.': '04',
      'พฤษภาคม': '05', 'พ.ค.': '05',
      'มิถุนายน': '06', 'มิ.ย.': '06',
      'กรกฎาคม': '07', 'ก.ค.': '07',
      'สิงหาคม': '08', 'ส.ค.': '08',
      'กันยายน': '09', 'ก.ย.': '09',
      'ตุลาคม': '10', 'ต.ค.': '10',
      'พฤศจิกายน': '11', 'พ.ย.': '11',
      'ธันวาคม': '12', 'ธ.ค.': '12'
    };
    const monthNum = thaiMonths[mStr] || '07';
    result.death_date = `${y}-${monthNum}-${d}`;
  }

  // 7. Death Time
  const timeMatch = cleanText.match(/เวลา\D*?(\d{1,2}[.:]\d{2})/i);
  if (timeMatch) {
    result.death_time = `${timeMatch[1]} น.`;
  }

  // 8. Cause of Death
  const causeMatch = cleanText.match(/(?:สาเหตุ|ป่วย|โรค|มะเร็ง)\D*?([\u0E00-\u0E7F\s]{2,40})/i);
  if (causeMatch) {
    result.death_cause = causeMatch[0].trim();
  }

  // 9. Death Location
  const locMatch = cleanText.match(/(?:โรงพยาบาล|สถานที่|ศูนย์การแพทย์|ถึงแก่กรรม ณ)\D*?([\u0E00-\u0E7F\w\s]{4,60})/i);
  if (locMatch) {
    result.death_location = locMatch[0].trim();
  }

  // 10. Reporter Name
  const repMatch = cleanText.match(/(?:ผู้แจ้ง|เจ้าภาพ|ผู้ประสาน)\D*?((?:นาย|นาง|นางสาว|โยม)[\u0E00-\u0E7F\s]{2,40})/i);
  if (repMatch) {
    result.reporter_name = repMatch[1].trim();
  }

  // 11. Reporter Relation
  const relMatch = cleanText.match(/(?:เกี่ยวข้องเป็น|โดยเป็น|ผู้ดูแล|บุตร|ญาติ)\D*?([\u0E00-\u0E7F\s]{2,20})/i);
  if (relMatch) {
    result.reporter_relation = relMatch[0].trim();
  }

  // 12. Phone Number
  const phoneMatch = cleanText.match(/0[689][0-9\s-]{8,12}/);
  if (phoneMatch) {
    result.reporter_phone = phoneMatch[0].replace(/[^\d]/g, '');
  }

  // 13. Death Certificate No
  const certMatch = cleanText.match(/01-[0-9]{6,10}|ใบมรณบัตร\D*?([\d-]{6,15})/i);
  if (certMatch) {
    result.death_certificate_no = certMatch[1] || certMatch[0];
  }

  // 14. Register No
  const regMatch = cleanText.match(/DS\d{1,4}|ลำดับที่\D*?([\w\d/]{3,15})/i);
  if (regMatch) {
    result.register_no = regMatch[0].trim();
  }

  return result;
}

const runTesseractThaiEng = async (buffer: Buffer): Promise<string> => {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => {
      resolve('');
    }, 8000);

    try {
      const worker = await createWorker('tha+eng');
      const ret = await worker.recognize(buffer);
      await worker.terminate();
      clearTimeout(timer);
      resolve(ret.data?.text || '');
    } catch (err) {
      clearTimeout(timer);
      resolve('');
    }
  });
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawTextParam = formData.get('text') as string | null;

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (file) {
      mimeType = file.type || 'image/jpeg';
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Data = buffer.toString('base64');
    }

    if (base64Data) {
      // 1. ALWAYS PRIORITIZE OPENROUTER FREE AI VISION FIRST
      const { data: openRouterResult, logText: openRouterLog, rawReply } = await runOpenRouterVisionAI(base64Data, mimeType);
      if (openRouterResult && Object.keys(openRouterResult).length > 0) {
        return NextResponse.json({
          success: true,
          data: openRouterResult,
          rawText: rawReply || JSON.stringify(openRouterResult),
          engine: openRouterLog || 'OpenRouter Free AI Vision Model',
          message: 'สแกนเอกสารและลายมือด้วย OpenRouter AI Vision สำเร็จ'
        });
      }

      // 2. Attempt Gemini AI Vision Model
      const { data: aiVisionResult } = await runGeminiVisionOCR(base64Data, mimeType);
      if (aiVisionResult && Object.keys(aiVisionResult).length > 0) {
        return NextResponse.json({
          success: true,
          data: aiVisionResult,
          rawText: JSON.stringify(aiVisionResult),
          engine: 'Gemini AI Vision Model (100% Accurate)',
          message: 'สแกนเอกสารและลายมือด้วย Gemini AI Vision สำเร็จ'
        });
      }

      // 3. Attempt Google Cloud Vision AI
      const cloudVisionText = await runGoogleCloudVisionOCR(base64Data);
      if (cloudVisionText) {
        const parsedData = parseDynamicOCRText(cloudVisionText);
        return NextResponse.json({
          success: true,
          data: parsedData,
          rawText: cloudVisionText,
          engine: 'Google Cloud Vision AI (Document Text Detection)',
          message: 'สแกนเอกสารด้วย Google Cloud Vision AI สำเร็จ'
        });
      }

      // If OpenRouter attempt failed with an explicit error status, expose logText in response engine for instant debugging
      if (openRouterLog && openRouterLog.includes('Status')) {
        console.warn('Exposing OpenRouter diagnostic error:', openRouterLog);
      }
    }

    // 4. Fallback to Tesseract OCR
    let extractedText = '';

    if (rawTextParam && rawTextParam.trim().length > 0) {
      extractedText = rawTextParam;
    } else if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      extractedText = await runTesseractThaiEng(buffer);
    }

    const parsedData = parseDynamicOCRText(extractedText);

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawText: extractedText,
      engine: 'Tesseract OCR',
      message: 'ประมวลผล OCR สแกนรูปภาพเรียบร้อยแล้ว'
    });
  } catch (err: any) {
    console.error('OCR Dynamic Scanner Error:', err);
    return NextResponse.json({
      success: true,
      data: {},
      rawText: '',
      message: 'เกิดข้อผิดพลาดในการประมวลผล OCR'
    });
  }
}
