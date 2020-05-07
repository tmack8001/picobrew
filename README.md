picobrew-cli
============

Command line interface (CLI) used to communicate to Picobrew

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/picobrew-cli.svg)](https://npmjs.org/package/picobrew-cli)
[![Downloads/week](https://img.shields.io/npm/dw/picobrew-cli.svg)](https://npmjs.org/package/picobrew-cli)
[![License](https://img.shields.io/npm/l/picobrew-cli.svg)](https://github.com/tmack8001/picobrew-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g picobrew-cli
$ picobrew COMMAND
running command...
$ picobrew (-v|--version|version)
picobrew-cli/0.2.0 darwin-x64 node-v12.6.0
$ picobrew --help [COMMAND]
USAGE
  $ picobrew COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`picobrew hello [FILE]`](#picobrew-hello-file)
* [`picobrew help [COMMAND]`](#picobrew-help-command)
* [`picobrew recipes [RECIPEID]`](#picobrew-recipes-recipeid)
* [`picobrew sessions [MACHINEGUID]`](#picobrew-sessions-machineguid)

## `picobrew hello [FILE]`

describe the command here

```
USAGE
  $ picobrew hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ picobrew hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/tmack8001/picobrew-cli/blob/v0.2.0/src/commands/hello.ts)_

## `picobrew help [COMMAND]`

display help for picobrew

```
USAGE
  $ picobrew help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `picobrew recipes [RECIPEID]`

Command used to export different formats of beer recipes from the Picobrew Brewhouse.

```
USAGE
  $ picobrew recipes [RECIPEID]

OPTIONS
  -a, --all                              export all recipes
  -f, --format=beerxml|json              [default: beerxml] format of recipe output
  -h, --help                             show CLI help
  -o, --output_filename=output_filename  custom output filename (default is to use name of brew recipe)
  -v, --verbose                          enable debugging output
  --output_folder=output_folder          [default: recipes] path to output folder (useful for use with `--all`)

EXAMPLES
  $ picobrew recipes <recipeId> --format=beerxml
  $ picobrew recipes --format=beerxml --output_folder=recipes/xml --all
  $ picobrew recipes --format=json --output_folder=recipes/json --all
```

_See code: [src/commands/recipes.ts](https://github.com/tmack8001/picobrew-cli/blob/v0.2.0/src/commands/recipes.ts)_

## `picobrew sessions [MACHINEGUID]`

Command used to export sessions from linked machines from the Picobrew Brewhouse.

```
USAGE
  $ picobrew sessions [MACHINEGUID]

OPTIONS
  -f, --format=csv|json              [default: csv] path to output folder as each session is a separate json (with --all
                                     defaults to guid of machine)

  -h, --help                         show CLI help

  -n, --number=number                [default: 20] number of recent sessions to export

  -o, --output_folder=output_folder  [default: sessions] path to output folder as each session is a separate json (with
                                     --all defaults to guid of machine)

  -s, --session=session              identifier of a specific sessions to export (ie. 60208)

  -v, --verbose                      enable debugging output

EXAMPLES
  $ picobrew sessions <machineId> --output_folder=sessions/<machineId>
  $ picobrew sessions --number=100
  $ picobrew sessions --session=12345
```

_See code: [src/commands/sessions.ts](https://github.com/tmack8001/picobrew-cli/blob/v0.2.0/src/commands/sessions.ts)_
<!-- commandsstop -->
