#!/usr/bin/env node

import * as program from "commander";
import {run} from "./action";

program
    .arguments('<rootDir> [otherRootDirs...]')
    .description('Scan dirs <rootDir> and [otherRootDirs] and write locale files')
    // .option('-p, --preserve-keys', 'For preserve keys in project. Without it will delete unused keys')
    .option('-c, --config <config>', 'Path to config', process.cwd() + '/locale-grubber.config.json')
    .action(function (rootDir: string, otherRootDirs: string[], cmd: program.Command) {
        otherRootDirs.unshift(rootDir);
        process.exit(run(otherRootDirs, cmd.preserveKeys || false, cmd.config));
    });

program.parse(process.argv);
