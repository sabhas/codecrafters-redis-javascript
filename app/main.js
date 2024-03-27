const net = require('net')
const { getPort, getReplica, parseEvents } = require('./utils')
const { CRLF } = require('./constants')
const commands = require('./commands')
const { performHandshake } = require('./replicaClient')

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (event) => {
    try {
      const events = parseEvents(event)
      for (const event of events) {
        if (event.type === 'bulkArray') {
          const command = event.command[0]
          const args = event.command.slice(1)
          console.log('command :>> ', command)
          const resp = commands[command.toLowerCase()](
            args,
            connection,
            event.command
          )
          console.log('resp :>> ', resp)
          if (resp) connection.write(resp)
        }
      }
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
