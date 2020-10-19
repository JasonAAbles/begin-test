// learn more about HTTP functions here: https://arc.codes/primitives/http
let begin = require('@architect/functions')

exports.handler = async function http (req) {
  let parsedBody = begin.http.helpers.bodyParser(req);
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    },
    body: JSON.stringify({
      "name": "jables",
      "testing": "serverless or not",
      "number": 23,
      "hello": parsedBody.hello,
      "why": "me",
      // "key": body.key,
      "requestBody": parsedBody,
      rawRequest: req
    })
  }
}