import { describe, expect, it } from 'vitest';
import { CheckoutField, CheckoutValues, validateCheckout } from './checkout-validation';

const valid: CheckoutValues = {
  name: 'Alexei Ward',
  email: 'alexei@mail.com',
  phone: '+1 202-555-0136',
  address: '1137 Williams Avenue',
  zip: '10001',
  city: 'New York',
  country: 'United States',
  eMoneyNumber: '238521993',
  eMoneyPin: '6891',
};

const errorFor = (field: CheckoutField, value: string) =>
  validateCheckout({ ...valid, [field]: value }, 'e-money')[field];

describe('validateCheckout', () => {
  it('returns no errors for a fully valid form', () => {
    expect(validateCheckout(valid, 'e-money')).toEqual({});
  });

  it.each(Object.keys(valid) as CheckoutField[])('requires %s', (field) => {
    expect(errorFor(field, '')).toBe('Can’t be empty');
  });

  it('treats whitespace-only values as empty', () => {
    expect(errorFor('name', '   ')).toBe('Can’t be empty');
  });

  it.each<[CheckoutField, string, string]>([
    ['email', 'alexei@mail.com', 'alexei@mail'],
    ['phone', '(202) 555-0136', '-------'],
    ['phone', '2025550136', '12345'],
    ['zip', 'SW1A 1AA', '---'],
    ['zip', '10001', '12'],
    ['eMoneyNumber', '238521993', '23852199'],
    ['eMoneyPin', '6891', '689'],
    ['eMoneyPin', '6891', '68a1'],
  ])('%s accepts "%s" and rejects "%s"', (field, accepted, rejected) => {
    expect(errorFor(field, accepted)).toBeUndefined();
    expect(errorFor(field, rejected)).toBe('Wrong format');
  });

  it('ignores e-Money fields when paying cash on delivery', () => {
    const errors = validateCheckout({ ...valid, eMoneyNumber: '', eMoneyPin: 'x' }, 'cash');

    expect(errors).toEqual({});
  });

  it('still validates the other fields when paying cash on delivery', () => {
    const errors = validateCheckout({ ...valid, email: 'nope' }, 'cash');

    expect(errors).toEqual({ email: 'Wrong format' });
  });
});
