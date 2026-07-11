const Jimp = require('jimp');
const path = require('path');

const sourceImage = 'C:\\Users\\akula\\.gemini\\antigravity\\brain\\6db66638-a152-4c4c-b48f-a87731695f04\\nexspend_app_icon_1783780017157.png';
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  try {
    const image = await Jimp.read(sourceImage);
    
    // Generate 192x192
    await image.clone().resize(192, 192).writeAsync(path.join(publicDir, 'pwa-192x192.png'));
    console.log('Generated pwa-192x192.png');
    
    // Generate 512x512
    await image.clone().resize(512, 512).writeAsync(path.join(publicDir, 'pwa-512x512.png'));
    console.log('Generated pwa-512x512.png');
    
    // Generate Apple Touch Icon 180x180
    await image.clone().resize(180, 180).writeAsync(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
