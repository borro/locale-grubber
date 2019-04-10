import {mkdirSync, readFileSync, writeFileSync} from "fs";
import {sync as globSync} from "glob";
import {basename, dirname} from "path";
import {GrubberInterface, GrubberTokens} from "./grubbers/grubber";
import {createGrubberByName} from "./grubbers/helpers";


export type ConfigurationFileRule = {
    include: string[], //glob pattern
    exclude?: string[],
    grubbers: {
        [grubberName: string]: { [option: string]: string | string[]; }
    }
}

export type Configuration = {
    includeDirs: string[], //glob pattern
    excludeDirs?: string[],
    fileRules: ConfigurationFileRule[],
    i18nDirName: string,
    languages: string[],
    i18nextPlural?: "v1" | "v2" | "v3" | false
};

type Tokens = {
    [token: string]: string | null
};


interface TokensOnLanguages {
    [languages: string]: Tokens
}

function getConfiguration(config: string): Configuration {
    return JSON.parse(readFileSync(config, 'utf8'));
}

function arrayToTokens(array: string[]): Tokens {
    let tokens: Tokens = {};
    for (let token of array.sort()) {
        tokens[token] = null;
    }

    return tokens;
}

function getDirsForI18n(dirs: string[], configuration: Configuration): string[] {
    let dirsForI18n: string[] = [];
    for (let dir of dirs) {
        dirsForI18n = dirsForI18n.concat(globSync(`{${configuration.includeDirs.join(',')}}`, {
            ignore: configuration.excludeDirs,
            cwd: `${process.cwd()}/${dir}/`,
            absolute: true
        }));
    }
    return dirsForI18n;
}

function grubTokensByDir(dir: string, fileRules: ConfigurationFileRule[], languages: string[], i18nextPlural: string | null): TokensOnLanguages {
    let tokens: GrubberTokens = {},
        tokensOnLanguages: TokensOnLanguages = {};
    for (let lang of languages) {
        tokens[lang] = [];
    }
    for (let rule of fileRules) {
        let filesForGrub = globSync(`{${rule.include.join(',')}}`, {
            cwd: dir,
            ignore: rule.exclude,
            absolute: true
        });

        let grubbers: GrubberInterface[] = [];
        for (let grubberName in rule.grubbers) {
            let options = Object.assign({
                languages: languages,
                i18nextPlural: i18nextPlural
            }, rule.grubbers[grubberName]);
            grubbers.push(createGrubberByName(grubberName, options));
        }

        for (let file of filesForGrub) {
            let data = readFileSync(file, 'utf8');
            for (let grubber of grubbers) {
                let tmp = grubber.grub(data, languages);
                for (let lang of languages) {
                    tokens[lang] = tokens[lang].concat(tmp[lang]);
                }
            }
        }
    }
    for (let lang of languages) {
        tokensOnLanguages[lang] = arrayToTokens(tokens[lang]);
    }

    return tokensOnLanguages;
}

function getModuleName(dir: string): string {
    return basename(dir).replace(/[^\w-]/g, '');
}

function getOldTokens(dir: string, i18nDirName: string, languages: string[]): TokensOnLanguages {
    let result: TokensOnLanguages = {};
    for (let language of languages) {
        let path = `${dir}/${i18nDirName}/${getModuleName(dir)}.${language}.json`;
        try {
            result[language] = treeObjectToTokens(JSON.parse(
                readFileSync(path, 'utf8')
            ));
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.info(`File ${path} not found`);
            } else {
                console.error(error)
            }
        }
    }

    return result;
}

function treeObjectToTokens(object: any, name: string = ''): Tokens {
    let tokens: Tokens = {};
    for (let key in object) if (object.hasOwnProperty(key)) {
        let tokenName = name ? `${name}.${key}` : key;
        if (typeof object[key] === "object") {
            Object.assign(tokens, treeObjectToTokens(object[key], tokenName));
        } else {
            tokens[tokenName] = object[key];
        }
    }
    return tokens;
}

function set(object: any, token: string, value: string | null) {
    let
        tokenKeys = token.split('.'),
        nested = object,
        index = -1,
        length = tokenKeys.length,
        lastIndex = length - 1;

    while (nested != null && ++index < length) {
        let key = tokenKeys[index];
        if (typeof nested === "object") {
            if (index == lastIndex) {
                nested[key] = value;
            } else if (nested[key] == null) {
                nested[key] = {};
            }
        }
        nested = nested[key];
    }
}


function tokensToTreeObject(tokens: Tokens): any {
    let object: any = {};

    for (let token in tokens) {
        set(object, token, tokens[token]);
    }

    return object;
}

function mergeTokens(object: Tokens, source: Tokens): Tokens {
    let result: Tokens = {};
    for (let key in object) if (object.hasOwnProperty(key)) {
        if (source[key] !== undefined) {
            result[key] = source[key];
        } else if ([null, '', {}, []].indexOf(object[key]) === -1) {
            result[key] = object[key]
        } else {
            result[key] = `! ${key}`;
        }
    }
    return result;
}

function writeI18nFiles(dir: string, i18nDirName: string, tokensOnLanguages: TokensOnLanguages) {
    for (let language in tokensOnLanguages) {
        let fileName = `${dir}/${i18nDirName}/${getModuleName(dir)}.${language}.json`;
        try {
            mkdirSync(dirname(fileName), {recursive: true});
        } catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
        let jsonString = JSON.stringify(tokensToTreeObject(tokensOnLanguages[language]), null, 2);
        writeFileSync(fileName, jsonString + "\n");
    }
}

export function run(dirs: string[], preserveKeys: boolean, config: string): number {
    let configuration = getConfiguration(config);
    let i18nDirs = getDirsForI18n(dirs, configuration);
    console.info('Dirs for i18n:');
    let invalid = false;

    for (let dir of i18nDirs) {
        console.info(dir);
        let grubbedTokens = grubTokensByDir(dir, configuration.fileRules, configuration.languages, configuration.i18nextPlural || null);
        let oldTokens = getOldTokens(dir, configuration.i18nDirName, configuration.languages);
        let newTokens: TokensOnLanguages = {};
        for (let language of configuration.languages) {
            newTokens[language] = mergeTokens(
                grubbedTokens[language],
                oldTokens[language] !== undefined ? oldTokens[language] : {}
            );
        }
        if (program.validate){
            const equal = JSON.stringify(newTokens) === JSON.stringify(oldTokens);
            if (!equal) {
                invalid = true;
                console.error(`Translations must be fixed for folder: ${dir}/${configuration.i18nDirName}`);
            }
        } else writeI18nFiles(dir, configuration.i18nDirName, newTokens);

    }

    return invalid ? -1 : 0;
}
