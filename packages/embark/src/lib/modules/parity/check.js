const WebSocket = require("ws");
const http = require("http");

const LIVENESS_CHECK=`{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":42}`;

const parseAndRespond = (data, cb) => {
  const resp = JSON.parse(data);
  const [_, version, __] = resp.result.split('/');
  cb(null, version);
}

const rpc = (host, port, cb) => {
  const options = {
    hostname: host, // TODO(andremedeiros): get from config
    port: port, // TODO(andremedeiros): get from config
    method: "POST",
    timeout: 1000,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(LIVENESS_CHECK)
    }
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data = data + chunk);
    res.on("end", () => parseAndRespond(data, cb));
  });
  req.on("error", (e) => cb(e));
  req.write(LIVENESS_CHECK);
  req.end();
}

const ws = (host, port, cb) => {
  const conn = new WebSocket("ws://" + host + ":" + port);
  conn.on("message", (data) => {
    parseAndRespond(data, cb)
    conn.close();
  });
  conn.on("open", () => conn.send(LIVENESS_CHECK));
  conn.on("error", (e) => cb(e));
}

module.exports = {
  ws,
  rpc
}
