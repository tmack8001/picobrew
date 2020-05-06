const { promisify } = require('util');
const fs = require('fs');
const path = require('path')

const { CookieJar } = require('tough-cookie');
const picobrew = require('../clients/picobrew');
const keytar = require('keytar')

import { Command, flags } from '@oclif/command'
import cli from 'cli-ux'

export default class Recipes extends Command {
  static description = 'Command used to export different formats of beer recipes from the Picobrew Brewhouse.'

  static examples = [
    `$ picobrew recipes <recipeId> --format=beerxml`,
    `$ picobrew recipes --format=beerxml --output_folder=recipes/xml --all`,
    `$ picobrew recipes --format=json --output_folder=recipes/json --all`,
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-f, --format=beerxml)
    format: flags.string({
      char: 'f',
      description: 'format of recipe output',
      options: ['beerxml', 'json'],
      default: 'beerxml'
    }),
    output_filename: flags.string({
      char: 'o',
      description: 'custom output filename (default is to use name of brew recipe)'
    }),
    output_folder: flags.string({
      description: 'path to output folder (useful for use with `--all`)'
    }),
    // flag with no value (-f, --force)
    all: flags.boolean({
      char: 'a',
      description: '(NOT SUPPORTED YET) export all recipes',
      default: false
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'enable debugging output',
      default: false
    }),
  }

  static args = [
    { name: 'recipeId' },
  ]

  async run() {
    const { args, flags } = this.parse(Recipes)

    if (args.recipeId == undefined && flags.all == false) {
      this.error("invalid usage: either `recipeId` or `--all` is required");
    }

    const format = flags.format
    const verbose = flags.verbose
    let userId: string; // to be determined later (keytar or user prompt)

    this.log('arguments received: ', args);
    this.log('flags received: ', flags);

    this.log(`pulling recipe ${args.recipeId} from Picobrew's BrewHouse`);

    this.log(`checking password managers for picobrew credentials`);
    const credentials = await keytar.findCredentials("picobrew");

    const cookieJar = new CookieJar();
    const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));

    // should we allow selecting a specific user given some people might have more than one account?
    if (!credentials && credentials.length != 1) {
      // prompt for user identifier (ie. 28341) ... TODO find a way to help users discover this
      userId = await cli.prompt('What is your PicoBrew user identifier (ie. 28341)?')

      // prompt for user session cookie `.ASPXAUTH` masking after entered
      const sessionToken = await cli.prompt('What is \'.ASPXAUTH\' cookie value?', { type: 'hide' })

      await setCookie(`.ASPXAUTH=${sessionToken}`, 'https://picobrew.com');

      // store into password manager - TODO prompt if user wants to store for future use
      keytar.setPassword("picobrew", userId, sessionToken);
    } else {
      userId = credentials[0].account;
      await setCookie(`.ASPXAUTH=${credentials[0].password}`, 'https://picobrew.com');
    }

    // fetch all recipe GUIDs
    if (flags.all) {
      (async () => {
        try {
          const response = await fetchAllRecipes(userId, cookieJar);
          const recipes = response.body;

          console.log(`found ${recipes.length} recipes in your BrewHouse`)

          recipes.forEach(recipe => {
            const guid = recipe.GUID
            this.exportRecipeToFile(format, guid, userId, cookieJar, flags);
          });
        } catch (error) {
          console.log(error);
          this.error('failed to fetch json recipe')
        }
      })();
    } else {
      this.exportRecipeToFile(format, args.recipeId, userId, cookieJar, flags);
    }
  }

  private exportRecipeToFile(format: string, recipeId: string, userId: string, cookieJar: any, flags: { help: void; format: string; output_filename: string | undefined; output_folder: string | undefined; all: boolean; verbose: boolean; }) {
    if (format === "json") {
      (async () => {
        try {
          const response = await fetchRecipeJSON(recipeId, userId, cookieJar);
          const recipe = response.body;
          this.writeOutputFile(flags, recipe.VM.Recipe.Name, JSON.stringify(recipe, null, 2));
        }
        catch (error) {
          console.log(error);
          this.error('failed to fetch json recipe');
        }
      })();
    }
    else if (format === "beerxml") {
      (async () => {
        const jsonResponse = await fetchRecipeJSON(recipeId, userId, cookieJar);
        const recipe = jsonResponse.body;
        const xmlResponse = await fetchRecipeXML(JSON.stringify(recipe), cookieJar);
        this.writeOutputFile(flags, recipe.VM.Recipe.Name, xmlResponse.body);
      })();
    }
  }

  private writeOutputFile(flags: { help: void; format: string; output_filename: string | undefined; output_folder: string | undefined; all: boolean; verbose: boolean;}, recipeName: string, body: any) {
    var filename = flags.output_filename || recipeName;

    var re = /(?:\.([^.]+))?$/;
    var ext = re.exec(flags.output_filename)[1];

    if (!ext) {
      filename += flags.format == "json" ? ".json" : ".xml";
    }

    if (ext == "xml" && flags.format == "json" ||
      ext == "json" && flags.format == "beerxml") {
      this.error("flags --format and --output conflict");
    }

    console.log(`writing file ${filename} for recipe ${recipeName}`);

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

function fetchAllRecipes(user: string, cookieJar: any): { body: any; } {
  return picobrew.post(`Z_Crafter/JSON/Z_Recipe_JSON`, {
    cookieJar,
    form: {
      option: 'getRecipes'
    },
    responseType: 'json'
  });
}

function fetchRecipeJSON(recipeId: string, user: string, cookieJar: any): { body: any; } {
  return picobrew.post(`API/Rest/RestAPI.cshtml?type=RecipeVMRequest&id=${user}`, {
    cookieJar,
    json: {
      UseMetric: "false",
      RecipeGUID: `${recipeId}`
    },
    responseType: 'json'
  });
}

function fetchRecipeXML(recipeJson: any, cookieJar: any): { body: any; } {
  const recipe = JSON.parse(recipeJson).VM.Recipe

  return picobrew.post(`z_crafter/json/exportrecipejson`, {
    cookieJar,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: `recipe=${JSON.stringify(recipe)}`,
    responseType: 'text'
  });
}
