import * as i18next from 'i18next';
import { getKeyErrors, getRuleName, normalizeKey } from './helpers';

export interface GrubberTokens {
    [language: string]: string[],
}

export interface GrubberInterface {
    grub(string: string, languages: string[]): GrubberTokens;

    needPlural(string: string, language: string): string[];

    validateKey(str: string): grubber.RuleError;
}

export interface GrubberOptionsInterface {
    cwd: string;
    keyRules?: grubber.RuleKey[];
    languages: string[];
    i18nextPlural: string | null;
}

export abstract class AbstractGrubber implements GrubberInterface {
    private i18nextRules: { [language: string]: { numbers: number[] } } = {};
    private i18nextPlural: string | null = null;
    private pluralStandartMap = new Map([
        [1,  ""],
        [2, "_few"],
        [5, "_other"],
    ]);

    protected constructor(private _options: GrubberOptionsInterface) {
        if (_options.i18nextPlural) {
            this.initI18Next(_options.languages, _options.i18nextPlural);
        }
    }

    abstract grub(string: string, languages: string[]): GrubberTokens;

    public needPlural(string: string, language: string): string[] {
        return this.detectSuffixes(language, this.i18nextPlural, string);
    }

    public validateKey(key: string): grubber.RuleError {
        return getKeyErrors(key, this._getRules());
    }

    private _getRules(): grubber.Rule[] {
        let rules = this._options.keyRules;

        if (!rules) {
            return [];
        }

        return rules.map(rule => {
            if (typeof rule === 'string' && getRuleName(rule) === 'namespace') {
                return <grubber.Rule>{
                    ruleKey: 'namespace',
                    namespace: normalizeKey(
                        this._options.cwd.split('/').pop(),
                        rules!.filter(x => getRuleName(x) !== 'namespace')
                    )
                }
            } else {
                return rule;
            }
        }).sort(r => (getRuleName(r) === 'namespace') ? 0 : -1);
    }

    private initI18Next(languages: string[], i18nextPlural: string | null): void {
        if (JSON.stringify(this.i18nextRules) === '{}') {
            // @ts-ignore https://stackoverflow.com/questions/42477112/uncaught-typeerror-i18next-init-is-not-a-function
            i18next.init();
            for (let lang of languages) {
                // @ts-ignore https://stackoverflow.com/questions/42477112/uncaught-typeerror-i18next-init-is-not-a-function
                this.i18nextRules[lang] = i18next.services.pluralResolver.getRule(lang);
            }
            this.i18nextPlural = i18nextPlural;
        }
    }

    private detectSuffixes(lng: string, version: string | null, token: string): string[] {
        if (!this.i18nextRules[lng]) {
            return [token];
        } else if (this.i18nextRules[lng].numbers.length === 2) {
            if (version === 'v4') {
                return [token, `${token}_other`];
            }
            return [token, `${token}_plural`];
        } else {
            return this.i18nextRules[lng].numbers.reduce((red: string[], n: number, i: number) => {
                switch(version) {
                    case 'v4':
                        const newKey = token + this.pluralStandartMap.get(n);
                        return [...red, newKey];
                    case 'v3':
                        return [...red, `${token}_${i}`];
                    case 'v2':
                        if (this.i18nextRules[lng].numbers.length === 1) {
                            return [...red, token]
                        } else {
                            return [...red, `${token}_${n}`];
                        }
                    default:
                        return red;
                }
            }, []);
        }
    }
}


