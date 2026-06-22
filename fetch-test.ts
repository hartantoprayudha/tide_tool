import https from 'https';

https.get('https://repogempa.bmkg.go.id/fdsnws/event/1/query?starttime=2018-09-28T10:00:00&endtime=2018-09-29T10:00:00', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data.substring(0, 500)); });
}).on('error', (err) => {
  console.error("error", err);
});
