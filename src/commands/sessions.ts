const fs = require('fs');
const path = require('path')

import { Command, flags } from '@oclif/command'

const picobrew = require('../clients/picobrew');
const { credentials, setupCookieJar } = require('../credentials')

export default class Sessions extends Command {
  static description = 'Command used to export sessions from linked machines from the Picobrew Brewhouse.'

  static examples = [
    `$ picobrew sessions <machineId> --output_folder=sessions/<machineId>`,
    `$ picobrew sessions --number=100`,
    `$ picobrew sessions --session=12345`
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-f, --format=beerxml)
    session: flags.string({
      char: 's',
      description: 'identifier of a specific sessions to export (ie. 60208)'
    }),
    format: flags.string({
      char: 'f',
      description: 'path to output folder as each session is a separate json (with --all defaults to guid of machine)',
      options: ['csv', 'json'],
      default: 'csv'
    }),
    output_folder: flags.string({
      char: 'o',
      description: 'path to output folder as each session is a separate json (with --all defaults to guid of machine)',
      default: 'sessions'
    }),
    number: flags.integer({
      char: 'n',
      description: 'number of recent sessions to export',
      default: 20
    }),
    // flag with no value (-f, --force)
    verbose: flags.boolean({
      char: 'v',
      description: 'enable debugging output',
      default: false
    }),
  }

  static args = [
    { name: 'machineGuid' },
  ]

  async run() {
    const { args, flags } = this.parse(Sessions)

    const verbose = flags.verbose
    let userId: string; // to be determined later (keytar or user prompt)

    this.log('arguments received: ', args);
    this.log('flags received: ', flags);

    const { account, password } = await credentials();
    userId = account
    const cookieJar = await setupCookieJar(password);

    // fetch all recipe GUIDs
    if (args.machineGuid) {
      (async () => {
        try {
          const response = await fetchMachineSessions(args.machineGuid, userId, cookieJar);
          const json = response.body;

          console.log(`found ${json.SessionViews.length} sessions in your BrewHouse`)

          json.SessionViews.forEach(session => {
            const id = session.SessionID
            const machineName = `${session.Alias} ${session.MachineType}`
            this.exportSessionToFile(id, machineName, userId, cookieJar, flags);
          });
        } catch (error) {
          console.log(error);
          this.error('failed to fetch machine sessions')
        }
      })();
    } else {
      try {
        const response = await fetchRecentSessions(userId, flags.number, cookieJar);
        const json = response.body;

        console.log(`found ${json.SessionViews.length} sessions in your BrewHouse`)

        json.SessionViews.forEach(session => {
          const id = session.SessionID
          const machineName = `${session.Alias} ${session.MachineType}`
          this.exportSessionToFile(id, machineName, userId, cookieJar, flags);
        });
      } catch (error) {
        console.log(error);
        this.error('failed to fetch sessions')
      }
    }
  }

  private exportSessionToFile(sessionId: string, machineAlias: string, userId: string, cookieJar: any, flags: { help: void; format: string, output_folder: string; number: number; verbose: boolean; }) {
    (async () => {
      try {
        if (flags.format == 'csv') {
          const response = await fetchSessionRawData(sessionId, userId, cookieJar, flags);
          const datalog = response.body;
          this.writeOutputFile(flags, machineAlias, sessionId, datalog);
        } else if (flags.format == 'json') {
          const response = await fetchSessionDataLog(sessionId, userId, cookieJar, flags);
          const datalog = response.body;
          this.writeOutputFile(flags, machineAlias, sessionId, JSON.stringify(datalog, null, 2));
        }
      }
      catch (error) {
        console.log(error);
        this.error('failed to fetch json recipe');
      }
    })();
  }

  private writeOutputFile(flags: { help: void; format: string; output_folder: string; number: number; verbose: boolean; }, machineAlias: string, sessionId: string, body: any) {
    var filename = `${machineAlias}/${sessionId}.${flags.format}`

    console.log(`writing file ${filename} for session ${sessionId}`);

    ensureDirectoryExistence(`${flags.output_folder}/${filename}`);
    fs.writeFile(`${flags.output_folder}/${filename}`, body, function (err) {
      if (err) {
        return console.log(`failed to write to ${filename}`);
      }
    });
  }
}

function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function fetchRecentSessions(user: string, number: number, cookieJar: any): { body: any; } {
  return picobrew.post(`API/Rest/RestAPI.cshtml?type=BrewHouseSessionRequest&id=${user}`, {
    cookieJar,
    json: {
      ProfileID: `${user}`,
      IncludeZSession: 1,
      IncludePicoSession: 1,
      IncludePicoFermSession: 1,
      IncludeZymaticSession: 1,
      NumResults: number,
      NMostRecent: number
    },
    responseType: 'json'
  });
}

function fetchMachineSessions(machineGuid: string, user: string, cookieJar: any): { body: any; } {
  return picobrew.post(`API/Rest/RestAPI.cshtml?type=BrewHouseMachineSessionRequest&id=${user}`, {
    cookieJar,
    json: {
      ProfileID: user,
      MachineUID: machineGuid,
      MachineType: "2" // TODO: is this tied to the SKU of the machine?
    },
    responseType: 'json'
  });
}

function fetchSessionRawData(sessionId: string, user: string, cookieJar: any, flags: any): { body: any; } {
  return picobrew.post(`Members/Logs/Loghouse2/CsvExport.cshtml?command=generate&filter=ZSessionLogs&id=${sessionId}&output=csv`, {
    cookieJar,
    responseType: 'text'
  });
}

function fetchSessionDataLog(sessionId: string, user: string, cookieJar: any, flags: any): { body: any; } {
  return picobrew.post(`API/Rest/RestAPI.cshtml?type=LogHouseRequest&id=${sessionId}`, {
    cookieJar,
    json: {
      ID: sessionId,
      Type: 3, // TODO: is this related to still vs brew vs fermentation?
      Update: 0,
      Metric: 0,
      LastUpdateID: -1,
      LastUpdateStep: ""
    },
    responseType: 'json'
  });
}
