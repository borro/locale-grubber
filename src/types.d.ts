declare namespace grubber {
    type RuleKey = 'camelCase' | 'namespace';

    type RuleError<Solution = string> = [grubber.RuleKey[], Solution?];

    interface RuleWithOptions {
        ruleKey: RuleKey;
    }

    interface RuleNamespace extends RuleWithOptions {
        namespace: string;
    }

    type Rule = RuleNamespace | RuleKey;
}
