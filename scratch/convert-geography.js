// Script to convert Thailand geography flat JSON to hierarchical TypeScript
// Run: node scratch/convert-geography.js

const fs = require('fs');
const path = require('path');

// Read the downloaded geography.json content (extracted from markdown)
const mdContent = fs.readFileSync(
  path.join('C:', 'Users', 'DD Notebook', '.gemini', 'antigravity-cli', 'brain', 'd59885a5-5575-4c70-ba10-e2a311c2975c', '.system_generated', 'steps', '77', 'content.md'),
  'utf8'
);

// Extract JSON from markdown (after the --- separator)
const jsonStart = mdContent.indexOf('[');
const jsonEnd = mdContent.lastIndexOf(']') + 1;
const jsonStr = mdContent.substring(jsonStart, jsonEnd);
const rawData = JSON.parse(jsonStr);

console.log(`Loaded ${rawData.length} subdistrict records`);

// Build hierarchical structure
const provinceMap = new Map();

for (const item of rawData) {
  const provName = item.provinceNameTh;
  const distName = item.districtNameTh;
  const subName = item.subdistrictNameTh;

  if (!provinceMap.has(provName)) {
    provinceMap.set(provName, new Map());
  }
  const distMap = provinceMap.get(provName);
  
  if (!distMap.has(distName)) {
    distMap.set(distName, []);
  }
  distMap.get(distName).push(subName);
}

console.log(`Found ${provinceMap.size} provinces`);

// Generate TypeScript
let tsContent = `// ข้อมูลจังหวัด อำเภอ ตำบล ของประเทศไทย (ครบทุกจังหวัด)
// Auto-generated from thailand-geography-json (https://github.com/thailand-geography-data/thailand-geography-json)
// Total: ${provinceMap.size} provinces, ${rawData.length} subdistricts

export interface ThaiProvince {
  name: string;
  districts: ThaiDistrict[];
}

export interface ThaiDistrict {
  name: string;
  subdistricts: string[];
}

export const THAI_PROVINCES: ThaiProvince[] = [\n`;

for (const [provName, distMap] of provinceMap) {
  tsContent += `  {\n    name: '${provName}',\n    districts: [\n`;
  for (const [distName, subs] of distMap) {
    const subsStr = subs.map(s => `'${s}'`).join(', ');
    tsContent += `      { name: '${distName}', subdistricts: [${subsStr}] },\n`;
  }
  tsContent += `    ]\n  },\n`;
}

tsContent += `];\n`;

// Write output
const outputPath = path.join(__dirname, '..', 'lib', 'thai-address-data.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`Written to ${outputPath}`);
console.log(`File size: ${(Buffer.byteLength(tsContent, 'utf8') / 1024).toFixed(1)} KB`);
