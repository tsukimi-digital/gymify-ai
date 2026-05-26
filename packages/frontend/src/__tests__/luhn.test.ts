import { luhnCheck } from '../lib/luhn';

test('valid Visa test card', () => expect(luhnCheck('4111111111111111')).toBe(true));
test('valid Mastercard', () => expect(luhnCheck('5500005555555559')).toBe(true));
test('invalid card', () => expect(luhnCheck('1234567890123456')).toBe(false));
test('wrong length', () => expect(luhnCheck('41111111111111')).toBe(false));
