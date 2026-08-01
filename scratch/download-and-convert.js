const fs = require('fs');
const path = require('path');
const https = require('https');

const URL = 'https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/refs/heads/main/src/geography.json';

console.log('Downloading geography JSON from:', URL);

https.get(URL, (res) => {
  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', () => {
    try {
      console.log('Download complete. Parsing JSON...');
      const buffer = Buffer.concat(chunks);
      const data = buffer.toString('utf8');
      const rawData = JSON.parse(data);
      console.log(`Loaded ${rawData.length} subdistrict records.`);

      // Build hierarchical structure
      const provinceMap = new Map();

      for (const item of rawData) {
        const provName = item.provinceNameTh;
        const distName = item.districtNameTh;
        const subName = item.subdistrictNameTh;

        if (!provName || !distName || !subName) continue;

        if (!provinceMap.has(provName)) {
          provinceMap.set(provName, new Map());
        }
        const distMap = provinceMap.get(provName);
        
        if (!distMap.has(distName)) {
          distMap.set(distName, new Set());
        }
        distMap.get(distName).add(subName);
      }

      console.log(`Found ${provinceMap.size} provinces.`);

      // Generate TypeScript
      let tsContent = `// ข้อมูลจังหวัด อำเภอ ตำบล ของประเทศไทย (ครบทุกจังหวัด)
// Auto-generated from thailand-geography-json
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

      // Sort provinces alphabetically or logically (optional, let's keep order or sort)
      const sortedProvinces = Array.from(provinceMap.keys()).sort((a, b) => a.localeCompare(b, 'th'));

      for (const provName of sortedProvinces) {
        tsContent += `  {\n    name: '${provName}',\n    districts: [\n`;
        const distMap = provinceMap.get(provName);
        const sortedDistricts = Array.from(distMap.keys()).sort((a, b) => a.localeCompare(b, 'th'));

        for (const distName of sortedDistricts) {
          const subsSet = distMap.get(distName);
          const sortedSubs = Array.from(subsSet).sort((a, b) => a.localeCompare(b, 'th'));
          const subsStr = sortedSubs.map(s => `'${s}'`).join(', ');
          tsContent += `      { name: '${distName}', subdistricts: [${subsStr}] },\n`;
        }
        tsContent += `    ]\n  },\n`;
      }

      tsContent += `];\n`;

      // Write output
      const outputPath = path.join(__dirname, '..', 'lib', 'thai-address-data.ts');
      fs.writeFileSync(outputPath, tsContent, 'utf8');

      console.log(`Successfully written to ${outputPath}`);
      console.log(`File size: ${(Buffer.byteLength(tsContent, 'utf8') / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error('Error parsing/processing data:', err);
    }
  });
}).on('error', (err) => {
  console.error('Error downloading data:', err.message);
});
