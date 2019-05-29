import { getRuleName, applyRule, getKeyErrors, normalizeKey } from './helpers';

describe('Helpers', () => {

    describe('Rules', () => {
        it('should get rule name', () => {
            const ruleKey: grubber.RuleKey = 'namespace';
            expect(getRuleName({
            ruleKey: ruleKey
            } as grubber.Rule)).toBe(ruleKey as grubber.RuleKey);

            expect(getRuleName(ruleKey)).toBe(ruleKey);
        });

        it('should return all violation keys, and propose fixed key', () => {
            let errors = getKeyErrors('@tm-shared.bad_key', [{ ruleKey: 'namespace', namespace: 'global'}, "camelCase"]);
            expect(errors[0]).toEqual(['namespace', 'camelCase']);
            expect(errors[1]).toBe('global.tmShared.badKey');
        });

        it('should normalize key', () => {
            expect(normalizeKey('@tm-shared.strange_key.000_0.', [
                {
                    ruleKey: 'namespace',
                    namespace: 'tmShared'
                },
                "camelCase"
            ])).toBe('tmShared.strangeKey.0000');
        });

        describe('namespace', () => {
            it('should return key if key is valid', () => {
                expect(applyRule({
                    ruleKey: 'namespace',
                    namespace: '@tm-shared'
                }, '@tm-shared.key001_0.suffix')).toBe('@tm-shared.key001_0.suffix');
            })

            it('should append namespace if namespace is wrong', () => {
                const FORCE_NAMESPACE = 'NAMESPACE';
                expect(applyRule({
                    ruleKey: 'namespace',
                    namespace: FORCE_NAMESPACE
                }, '@tm-shared.strange_key.withFaults00_1..')).toBe(`${FORCE_NAMESPACE}.${'@tm-shared.strange_key.withFaults00_1'}`);
            })
        });

        describe('camelCase', () => {
            it('should return key if key is valid', () => {
                expect(applyRule('camelCase', 'tmShared.camelCasedKey')).toBe('tmShared.camelCasedKey');
            })

            it('should transform key', () => {
                expect(applyRule('camelCase', '@tm-shared.bad_key.000...')).toBe('tmShared.badKey.000');
            })
        });
    });
});
