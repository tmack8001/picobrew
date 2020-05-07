const { promisify } = require('util');

const { CookieJar } = require('tough-cookie');
const keytar = require('keytar')

import cli from 'cli-ux'

async function credentials() {
    let userId, sessionToken;

    const credentials = await keytar.findCredentials("picobrew");

    // should we allow selecting a specific user given some people might have more than one account?
    if (!credentials && credentials.length != 1) {
      // prompt for user identifier (ie. 28341) ... TODO find a way to help users discover this
      userId = await cli.prompt('What is your PicoBrew user identifier (ie. 28341)?')

      // prompt for user session cookie `.ASPXAUTH` masking after entered
      const sessionToken = await cli.prompt('What is \'.ASPXAUTH\' cookie value?', { type: 'hide' })

      // store into password manager - TODO prompt if user wants to store for future use
      keytar.setPassword("picobrew", userId, sessionToken);
    } else {
      userId = credentials[0].account;
      sessionToken = credentials[0].password;
    }
    return {account: userId, password: sessionToken}
}

async function setupCookieJar(session: string) {
    const cookieJar = new CookieJar();
    const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));

    await setCookie(`.ASPXAUTH=${session}`, 'https://picobrew.com');
    return cookieJar;
}

module.exports = {
    credentials,
    setupCookieJar
};