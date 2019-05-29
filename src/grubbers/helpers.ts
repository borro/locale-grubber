import {GrubberInterface, GrubberOptionsInterface} from "./grubber";
import {Grubber as RegexpGrubber, GrubberOptions as RegexpGrubberOptions} from "./regexp";
const camelCase = require('lodash.camelcase');


export function createGrubberByName(name: string, options: GrubberOptionsInterface): GrubberInterface {
    switch (name) {
        case 'regexp':
            return new RegexpGrubber(options as RegexpGrubberOptions);
    }
    throw new Error(`Can not have grubber ${name}`);
}

export function normalizeKey(key: string = '', rules: grubber.Rule[] = []): string|null {
    return !key ? null : rules.reduce((result, rule) => applyRule(rule, result), key);
}

export function applyRule(rule: grubber.Rule, key: string): string {
    switch(getRuleName(rule)) {
        case 'camelCase':
            return key.split('.').filter(x => !!x).map(p => camelCase(p)).join('.');
        case 'namespace':
            let parsedKey = key.split('.').filter(x => !!x);
            if (parsedKey[0] !== (rule as grubber.RuleNamespace).namespace) {
                parsedKey.unshift((rule as grubber.RuleNamespace).namespace);
            }
            return parsedKey.join('.');
        default:
            return key;
    }
}

export function getKeyErrors(key: string = '', rules: grubber.Rule[] = []): grubber.RuleError {
    let errors: grubber.RuleKey[] = [];

    if (!key) {
        return [[]];
    }

    let fixedKey = key;

    return [rules.reduce((errors, rule) => {

        if (applyRule(rule, key) !== key) {
            errors.push(getRuleName(rule));
            fixedKey = applyRule(rule, fixedKey);
        }

        return errors;
    }, [] as grubber.RuleKey[]), fixedKey];
}

export function getRuleName(rule: grubber.Rule): grubber.RuleKey {
    return (typeof rule === "object") ? rule.ruleKey : rule;
}
