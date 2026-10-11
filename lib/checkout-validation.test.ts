import { describe, expect, it } from 'vitest';
import {
  CheckoutField,
  CheckoutValues,
  isValidEmail,
  validateCheckout,
} from './checkout-validation';

const valid: CheckoutValues = {
  name: 'Alexei Ward',
  email: 'alexei@mail.com',
  phone: '+1 202-555-0136',
  address: '1137 Williams Avenue',
  zip: '10001',
  city: 'New York',
  country: 'United States',
};

const errorFor = (field: CheckoutField, value: string) =>
  validateCheckout({ ...valid, [field]: value })[field];

describe('validateCheckout', () => {
  it('returns no errors for a fully valid form', () => {
    expect(validateCheckout(valid)).toEqual({});
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
  ])('%s accepts "%s" and rejects "%s"', (field, accepted, rejected) => {
    expect(errorFor(field, accepted)).toBeUndefined();
    expect(errorFor(field, rejected)).toBe('Wrong format');
  });

  // Addresses with landmark directions run long; the other fields don't
  it.each<[CheckoutField, number]>([
    ['address', 300],
    ['name', 200],
    ['city', 200],
  ])('accepts %s up to %i characters, and says so beyond', (field, max) => {
    expect(errorFor(field, 'x'.repeat(max))).toBeUndefined();
    expect(errorFor(field, 'x'.repeat(max + 1))).toBe(`Max ${max} characters`);
  });

  it('counts length after trimming', () => {
    expect(errorFor('name', ` ${'x'.repeat(200)} `)).toBeUndefined();
  });
});

describe('isValidEmail', () => {
  it('uses the same rule as the form', () => {
    expect(isValidEmail(' alexei@mail.com ')).toBe(true);
    expect(isValidEmail('alexei@mail')).toBe(false);
  });
});
