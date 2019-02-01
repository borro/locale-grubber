import * as i18next from 'i18next';

export interface GrubberTokens {
    [language: string]: string[],
}

export interface GrubberInterface {
    grub(string: string, languages: string[]): GrubberTokens;

    needPlural(string: string, language: string): string[];
}

export interface GrubberOptionsInterface {
    languages: string[];
    i18nextPlural: string | null;

    [option: string]: string | string[] | null;
}

export abstract class AbstractGrubber implements GrubberInterface {
    private i18nextRules: { [language: string]: { numbers: number[] } } = {};
    private i18nextPlural: string | null = null;

    protected constructor(options: GrubberOptionsInterface) {
        if (options.i18nextPlural) {
            this.initI18Next(options.languages, options.i18nextPlural);
        }
    }

    abstract grub(string: string, languages: string[]): GrubberTokens;

    needPlural(string: string, language: string): string[] {
        return this.detectSuffixes(language, this.i18nextPlural, string);
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
            return [token, `${token}_plural`];
        } else {
            return this.i18nextRules[lng].numbers.reduce((red: string[], n: number, i: number) => {
                if (version === 'v3') {
                    red.push(`${token}_${i}`);
                } else if (version === 'v2') {
                    if (this.i18nextRules[lng].numbers.length === 1) {
                        red.push(token);
                    } else {
                        red.push(`${token}_${this.i18nextRules[lng].numbers[i]}`);
                    }
                } else {
                    if (this.i18nextRules[lng].numbers[i] === 1) {
                        red.push(token);
                    } else {
                        red.push(`${token}_plural_${this.i18nextRules[lng].numbers[i]}`);
                    }
                }
                return red;
            }, []);
        }
    }
}


