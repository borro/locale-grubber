# locale-grubber

The picker to search and create/edit translate json files.

## Installation
Using npm:
> `$ npm install --dev locale-grubber`

Create config (see config section).

## Using

Run
```bash
$ locale-grubber --help
Usage: index [options] <rootDir> [otherRootDirs...]

Scan <rootDir> and [otherRootDirs] and write locale files

Options:
  -c, --config <config>  Path to config (default: "/home/borro/projects/ng-localizer/locale-grubber.config.json")
  -h, --help             output usage information
  --validate             Validate files instead of rewrite. Logs erroneous files names to console

```
## Config

```json
{
    "includeDirs": [
        "shared/",
        "plugins/*/",
        "plugins/settings/*/"
    ],
    "excludeDirs": [
        "plugins/settings"
    ],
    "fileRules": [
        {
            "include": ["**/*.ts", "**/*.html"],
            "exclude": ["**/*.spec.ts"],
            "grubbers": {
                "regexp": {
                    "keyRules": [
                        "namespace",
                        "camelCase"
                    ],
                    "patterns": [
                        "name: *'(?<token>[.\\w-]+)', *(routerLink|children)",
                        "[`'\"](?<token>[aA-zZ0-9._\\-]*)[`'\"] *\\| *translate",
                        "[`'\"](?<plural>[aA-zZ0-9._\\-]*)[`'\"] *\\| *pluralize[^|]*\\| *translate",
                        "\\.instant\\([`'\"](?<token>[.\\w-]+)[`'\"]+\\)",
                        "__\\([`'\"](?<token>[aA-zZ0-9._\\-]*)[`'\"]\\)",
                        "@translate +[`'\"]?(?<token>[aA-zZ0-9._\\-]*)[`'\"]?"
                    ]
                }
            }
        }
    ],
    "i18nDirName": "i18n",
    "languages": ["ru", "en"],
    "i18nextPlural": "v1"
}
```
* includeDirs — Dirs to scan
* excludeDirs — Dirs for exclude
* fileRules — rules for parsing
    * include — which file to grub
    * exclude — which file to exclude from grubbing
    * grubbers — supported technologies for file parsing (currently regexp only):
        * regexp — grub file by Regexp
            * patterns — use [named group](https://www.npmjs.com/package/named-js-regexp) "token", for capture token, or "plural", for capture token for plural. Examples:
                * `[`'\"](?<token>[aA-zZ0-9._\\-]*)[`'\"] *\\| *translate` → `token.for.translate' | translate`
                * `[`'\"](?<plural>[aA-zZ0-9._\\-]*)[`'\"] *\\| *pluralize[^|]*\\| *translate` → `token.for.pluralize' | pluralize:count | translate`
                * `__\\([`'\"](?<token>[aA-zZ0-9._\\-]*)[`'\"]\\)` → `__('token.for.translate')`
                * `@translate +[`'\"]?(?<token>[aA-zZ0-9._\\-]*)[`'\"]?` → `@translate token.in.comment`
* i18nDirName — name for localization dir
* languages - languages in project (create files and keys for all added languages)
* i18nextPlural - create plural forms for [i18next](https://www.i18next.com/translation-function/plurals), possible values:
    * "v1" — use json version v1, example `token, token_plural_2, token_plural_5`
    * "v2" — use json version v2, example `token_1, token_2, token_5`
    * "v3" — use json version v3, example `token_0, token_1, token_2`
    * "v4" — use json version v4, example `token, token_few, token_other`
    * `false` or not defined — disabled


## Additional
* ignore next line with "locale-ignore-next" comment

