const net = require('net')
const { encodeArray } = require('./redisSerializableParser')
const { parseEvents, getEventSize } = require('./utils')
const commands = require('./commands')

let state = 'connecting'

/**
  It is responsible for establishing a connection to the master server
  and sending the initial PING command as part of the handshake process.

  Here's a breakdown of what's happening:

  performHandshake is a function that takes host and port as arguments,
  representing the master server's address and port.
  Inside the function, net.createConnection is used to create a new TCP connection to the specified host and port.
  When the connection is successfully established, a message is logged to the console confirming the connection.
  Once connected, the client.write method sends a PING command to the master server.
  The PING command is encoded as a RESP Array using the encodeArray function,
  which is then written to the connection stream.
 */
const performHandshake = (host, port, listeningPort) => {
  const client = net.createConnection({ host, port }, () => {
    console.log(`Replica connected to master: ${host}:${port}`)
    state = 'waiting_for_ping_response'

    client.write(encodeArray(['ping']))
  })

  let replicaOffset = 0

  client.on('data', (data) => {
    try {
      const events = parseEvents(data.toString())
      for (const event of events) {
        if (event.type === 'simpleString') {
          const dataSimpleStringParsed = event.command
          if (
            state === 'waiting_for_ping_response' &&
            dataSimpleStringParsed === 'PONG'
          ) {
            state = 'waiting_for_replconf_listening_port_response'
            client.write(
              encodeArray([
                'REPLCONF',
                'listening-port',
                listeningPort.toString()
              ])
            )
          }

          if (
            state === 'waiting_for_replconf_listening_port_response' &&
            dataSimpleStringParsed === 'OK'
          ) {
            state = 'waiting_for_replconf_psync_response'
            client.write(encodeArray(['REPLCONF', 'capa', 'psync2']))
          }

          if (
            state === 'waiting_for_replconf_psync_response' &&
            dataSimpleStringParsed === 'OK'
          ) {
            state = 'waiting_for_psync_response'
            client.write(encodeArray(['PSYNC', '?', '-1']))
          }

          if (
            state === 'waiting_for_psync_response' &&
            dataSimpleStringParsed.startsWith('FULLRESYNC')
          ) {
            state = 'fullresync_complete'
            const replicationId = dataSimpleStringParsed.split(' ')[1]
          }
        }

        if (event.type === 'bulkArray') {
          const command = event.command[0]
          const args = event.command.slice(1)
          if (command.toLowerCase() === 'replconf' && args[0] === 'GETACK') {
            client.write(encodeArray(['REPLCONF', 'ACK', `${replicaOffset}`]))
          } else {
            commands[command.toLowerCase()](args, client, event.command, true)
          }
        }

        replicaOffset += getEventSize(event)

        if (
          event.type === 'bulkString' &&
          event.command.startsWith('REDIS0011')
        ) {
          // Resetting offset
          replicaOffset = 0
        }
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  })
}

module.exports = {
  performHandshake
}
