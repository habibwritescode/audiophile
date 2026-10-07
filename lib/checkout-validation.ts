export type PaymentMethod = 'e-money' | 'cash';

export const initialCheckoutValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  zip: '',
  city: '',
  country: '',
  eMoneyNumber: '',
  eMoneyPin: '',
};

export type CheckoutValues = typeof initialCheckoutValues;
export type CheckoutField = keyof CheckoutValues;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

const eMoneyFields: CheckoutField[] = ['eMoneyNumber', 'eMoneyPin'];

const formatRules: Partial<Record<CheckoutField, RegExp>> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 7–15 digits, optionally separated by spaces, dashes or brackets
  phone: /^\+?(?:[\s()-]*\d){7,15}[\s()-]*$/,
  zip: /^(?=.*[A-Za-z\d])[A-Za-z\d\s-]{3,10}$/,
  eMoneyNumber: /^\d{9}$/,
  eMoneyPin: /^\d{4}$/,
};

export const validateCheckout = (values: CheckoutValues, paymentMethod: PaymentMethod) => {
  const errors: CheckoutErrors = {};
  const fields = (Object.keys(values) as CheckoutField[]).filter(
    (field) => paymentMethod === 'e-money' || !eMoneyFields.includes(field)
  );

  for (const field of fields) {
    const value = values[field].trim();
    if (!value) errors[field] = 'Can’t be empty';
    else if (formatRules[field] && !formatRules[field].test(value)) errors[field] = 'Wrong format';
  }
  return errors;
};
