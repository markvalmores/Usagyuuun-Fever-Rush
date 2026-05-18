const https = require('https');
https.get('https://nekos.life/api/v2/img/wallpaper', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', e => console.error(e));
