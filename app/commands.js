const {
  encodeSingleString,
  encodeBulkString,
  encodeArray
} = require('./redisSerializableParser')
const { setKeyInMap, getKeyFromMap } = require('./memObj')
const { getRedisInfo, getSysInfo, getRole } = require('./utils')
const { EMPTY_RDB_FILE_HEX, CRLF } = require('./constants')

const replicas = {}

const relayCommandToReplicas = (command) => {
  for (const replica of Object.values(replicas)) {
    if (replica?.state === 'psync_completed') {
      const replicaConnection = replica.connection
      replicaConnection.write(encodeArray(command))
    }
  }
}

module.exports = {
  ping: () => encodeSingleString('PONG'),
  echo: (args) => args.map((str) => encodeBulkString(str)).join(),
  set: (args, connection, command, receivedFromMaster = false) => {
    const resp = setKeyInMap(args)

    if (!receivedFromMaster) {
      connection.write(encodeSingleString(resp))
    }

    const role = getRole(process.argv)

    if (role === 'master') {
      relayCommandToReplicas(command)
    }
  },
  get: (args) => encodeSingleString(getKeyFromMap(args[0])),
  info: () => encodeBulkString(getRedisInfo(process.argv)),
  replconf: (args, connection) => {
    if (args[0] === 'listening-port') {
      replicas[`${connection.remoteAddress}:${connection.remotePort}`] = {
        connection,
        state: 'listening_port_set'
      }
    } else if (args[0] === 'capa') {
      replicas[`${connection.remoteAddress}:${connection.remotePort}`].state =
        'capa_received'
    }

    return encodeSingleString('OK')
  },
  psync: (args, connection) => {
    const sysInfo = getSysInfo(process.argv)

    connection.write(
      encodeSingleString(
        `FULLRESYNC ${sysInfo.master_replid} ${sysInfo.master_repl_offset}`
      )
    )

    // converts the hexadecimal string of the empty RDB file into a binary buffer
    const RDB_File_Binary = Buffer.from(EMPTY_RDB_FILE_HEX, 'hex')

    // concatenating a bulk string header (which includes the length of the binary data followed by \r\n) with the binary RDB file content.
    // The Buffer.concat method is used to merge the header and the file content into a single buffer, which is then written to the connection
    connection.write(
      Buffer.concat([
        Buffer.from(`$${RDB_File_Binary.length}\r\n`),
        RDB_File_Binary
      ])
    )

    replicas[`${connection.remoteAddress}:${connection.remotePort}`].state =
      'psync_completed'
  }
}
