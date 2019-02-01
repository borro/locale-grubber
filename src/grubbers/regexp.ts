import {AbstractGrubber, GrubberOptionsInterface, GrubberTokens} from "./grubber";
import namedRegexp = require("named-js-regexp");

export interface GrubberOptions extends GrubberOptionsInterface {
    patterns: string[]
}

// 'access.user.userDeletedFrom' | pluralize:usersData.length | translate

export class Grubber extends AbstractGrubber {

    constructor(protected options: GrubberOptions) {
        super(options);
    }

    public grub(string: string, languages: string[]): GrubberTokens {
        let regexp = namedRegexp(typeof this.options.patterns === "string" ? this.options.patterns : this.options.patterns.join('|'), 'g'),
            token: any,
            tokens: GrubberTokens = {};
        for (let language of languages) {
            tokens[language] = [];
        }
        while ((token = regexp.exec(string)) !== null) {
            for (let language of languages) {
                if (token.group('token')) {
                    tokens[language].push(token.group('token'));
                }
                if (token.group('plural')) {
                    tokens[language] = tokens[language].concat(
                        this.needPlural(token.group('plural'), language)
                    );
                }
            }
        }
        return tokens;
    }
}
