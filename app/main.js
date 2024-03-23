const net = require('net')
const { parseRequest } = require('./redisSerializableParser')
const { getPort, getReplica, performHandshake } = require('./utils')
const { CRLF } = require('./constants')
const commands = require('./commands')

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (query) => {
    try {
      const parsedQuery = parseRequest(query)
      const command = parsedQuery[0]
      const args = parsedQuery.slice(1)
      const resp = commands[command.toLowerCase()](args, connection, query)
      if (resp) connection.write(resp)
    } catch (e) {
      console.error(e)
      connection.write(e.message + CRLF)
    }
  })
  connection.on('close', () => {
    console.log('Connection Closed: ')
    connection.end()
  })
})

const listeningPort = getPort(process.argv)
const replica = getReplica(process.argv)

if (replica) {
  performHandshake(replica.masterHost, replica.masterPort, listeningPort)
}

server.listen(listeningPort, '127.0.0.1')
