/**
 * Takes an array argv, which represents command-line arguments.
 * This function creates an empty object flagsMap to store the flags and their corresponding values.
 * It then loops through the argv array, checking if an element starts with --, which indicates it's a flag.
 * If it finds a flag, it removes the -- prefix, converts the flag to lowercase, and assigns the next element in the array as the flag's value in the flagsMap object.
 * After processing all arguments, the function returns the flagsMap object containing all the parsed flags and their values
 */
const filterFlags = (argv) => {
  const flagsMap = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      flagsMap[argv[i].toLowerCase().split('--')[1]] = argv[i + 1]
    }
  }
  return flagsMap
}

const getSysInfo = (parsedArguments) => {
  return {
    role: parsedArguments.hasOwnProperty('replicaof') ? 'slave' : 'master',
    connected_slaves: 0,
    master_replid: '8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb',
    master_repl_offset: 0
  }
}

module.exports = { filterFlags, getSysInfo }
