
const fs = require('fs');
const path = require('path')

import { Command, flags } from '@oclif/command'

const { wipeCredentials } = require('../credentials')

export default class Clean extends Command {
  static description = 'Command used to clean environment connected to Picobrew Brewhouse.'

  static examples = [
    `$ picobrew clean`,
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({
      char: 'v',
      description: 'enable debugging output',
      default: false
    }),
  }

  async run() {
    const { args, flags } = this.parse(Clean)
    const verbose = flags.verbose

    if (verbose) {
      this.log('arguments received: ', args);
      this.log('flags received: ', flags);
    }

    await wipeCredentials()
  }
}