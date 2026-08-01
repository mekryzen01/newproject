const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Regex to capture multi-line GOOGLE_SERVICE_ACCOUNT_JSON
const regex = /GOOGLE_SERVICE_ACCOUNT_JSON=\{([\s\S]*?)\}/;
const match = envContent.match(regex);

if (match) {
  const jsonContent = '{' + match[1] + '}';
  try {
    // Let's parse the JSON to make sure it is valid
    const parsed = JSON.parse(jsonContent);
    // Convert to minified single-line string
    const minified = JSON.stringify(parsed);
    
    // Replace in env content. Wrap in single quotes to ensure shell variables parser is safe!
    const replacement = `GOOGLE_SERVICE_ACCOUNT_JSON='${minified.replace(/'/g, "'\\''")}'`;
    const updatedContent = envContent.replace(regex, replacement);
    
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log('Successfully minified GOOGLE_SERVICE_ACCOUNT_JSON in .env!');
  } catch (err) {
    console.error('Failed to parse JSON content:', err);
  }
} else {
  console.log('GOOGLE_SERVICE_ACCOUNT_JSON not found in multi-line format.');
}
