
const fs = require('fs');
const path = require('path')

import { Command, flags } from '@oclif/command'

const picobrew = require('../clients/picobrew');
const { credentials, setupCookieJar } = require('../credentials')

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
      description: 'path to output folder (useful for use with `--all`)',
      default: 'recipes'
    }),
    // flag with no value (-f, --force)
    all: flags.boolean({
      char: 'a',
      description: 'export all recipes',
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
    
    const {account, password} = await credentials();
    userId = account
    const cookieJar = await setupCookieJar(password);

    // fetch all recipe GUIDs
    if (flags.all) {
      (async () => {
        try {
          const response = await fetchAllRecipes(userId, cookieJar);
          const recipes = response.body;

          console.log(recipes)

          console.log(`found ${recipes.length} recipes in your BrewHouse`)

          recipes.forEach((recipe: any) => {
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
    let ext;
    if (flags.output_filename) {
      var matches = re.exec(flags.output_filename)
      if (matches && matches.length > 0) {
        ext = matches[1];
      }
    } 

    if (!ext) {
      filename += flags.format == "json" ? ".json" : ".xml";
    }

    if (ext == "xml" && flags.format == "json" ||
      ext == "json" && flags.format == "beerxml") {
      this.error("flags --format and --output conflict");
    }

    console.log(`writing file ${filename} for recipe ${recipeName}`);

    ensureDirectoryExistence(`${flags.output_folder}/${filename}`);
    fs.writeFile(`${flags.output_folder}/${filename}`, body, function (err: Error) {
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
