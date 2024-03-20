const net = require('net')
const {
  encodeSingleString,
  encodeBulkString,
  parseRequest
} = require('./redisSerializableParser')

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here:')

const handlers = {
  ping: () => encodeSingleString('PONG'),
  echo: (args) => args.map((str) => encodeBulkString(str)).join()
}

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (query) => {
    try {
      const parsedQuery = parseRequest(query)
      const command = parsedQuery[0]
      const args = parsedQuery.slice(1)
      const resp = handlers[command](args)
      connection.write(resp)
    } catch (e) {
      console.error(e)
      connection.write(e.message + '\r\n')
    }
  })
  connection.on('close', () => {
    console.log('Connection Closed: ')
    connection.end()
  })
})

server.listen(6379, '127.0.0.1')
