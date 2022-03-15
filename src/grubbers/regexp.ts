import {AbstractGrubber, GrubberOptionsInterface, GrubberTokens} from "./grubber";
import namedRegexp = require("named-js-regexp");

export interface GrubberOptions extends GrubberOptionsInterface {
    patterns: string[];
}

// 'access.user.userDeletedFrom' | pluralize:usersData.length | translate

export class Grubber extends AbstractGrubber {

    constructor(protected options: GrubberOptions) {
        super(options);
    }

    public grub(string: string, languages: string[]): GrubberTokens {
        let regexp = namedRegexp(typeof this.options.patterns === "string" ? this.options.patterns : this.options.patterns.join('|'), 'g'),
            token: any,
            tokens: GrubberTokens = {},
            errors: string[] = [];
        for (let language of languages) {
            tokens[language] = [];
        }
        while ((token = regexp.exec(string)) !== null) {
            let key = token.group('token');
            if (key) {
                let violatedRules = this.validateKey(key);
                if (violatedRules[0].length) {
                    errors.push(`Rules are violated in key: ${key} [${violatedRules[0].join(', ')}], possible fix: ${violatedRules[1]}`);
                }
            }

            for (let language of languages) {
                if (key) {
                    const skipKey = key.endsWith('_few') && language === 'en';
                    if (!skipKey) {
                        tokens[language].push(key);
                    }
                }
                if (token.group('plural')) {
                    tokens[language] = tokens[language].concat(
                        this.needPlural(token.group('plural'), language)
                    );
                }
            }
        }

        if (errors.length) {
            throw errors;
        }

        return tokens;
    }
}
