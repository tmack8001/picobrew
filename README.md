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
picobrew-cli/0.1.0 darwin-x64 node-v12.6.0
$ picobrew --help [COMMAND]
USAGE
  $ picobrew COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`picobrew recipes [RECIPEID]`](#picobrew-hello-recipe-identifier)
* [`picobrew help [COMMAND]`](#picobrew-help-command)

## `picobrew recipes [RECIPEID]`

Common used to export different formats of beer recipes from the Picobrew Brewhouse.

```
USAGE
  $ picobrew recipes [RECIPEID]

OPTIONS
  -f, --format=beerxml|json  [default: beerxml] format of recipe output
  -h, --help                 show CLI help
  -o, --output=output        path to output file
  -v, --verbose              enable debugging output

EXAMPLE
  $ picobrew recipes --format=beerxml
```

_See code: [src/commands/hello.ts](https://github.com/tmack8001/picobrew-cli/blob/v0.1.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
