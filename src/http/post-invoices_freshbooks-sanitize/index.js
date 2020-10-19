// learn more about HTTP functions here: https://arc.codes/primitives/http
let begin = require('@architect/functions')

export const handler = async function http (req) {
  let requestBody = begin.http.helpers.bodyParser(req);
  return {
    statusCode: 200,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: JSON.stringify({
      context: context,
      requestBody: requestBody,
      "name": "jables",
      "testing": "serverless",
      "number": 23
    })
  }
}