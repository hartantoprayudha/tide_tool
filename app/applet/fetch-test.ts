import https from 'https';

const options = {
  hostname: 'data.bmkg.go.id',
  port: 443,
  path: '/DataMKG/TEWS/gempaterkini.xml',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data.substring(0, 300)));
});

req.on('error', error => console.error(error));
req.end();
