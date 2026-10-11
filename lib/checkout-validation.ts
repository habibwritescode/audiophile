export type PaymentMethod = 'card' | 'cash';

export const initialCheckoutValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  zip: '',
  city: '',
  country: '',
};

export type CheckoutValues = typeof initialCheckoutValues;
export type CheckoutField = keyof CheckoutValues;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

/** What the checkout needs from the form to place the order */
export type CheckoutSubmission = {
  paymentMethod: PaymentMethod;
  customer: CheckoutValues;
};

const formatRules: Partial<Record<CheckoutField, RegExp>> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 7–15 digits, optionally separated by spaces, dashes or brackets
  phone: /^\+?(?:[\s()-]*\d){7,15}[\s()-]*$/,
  zip: /^(?=.*[A-Za-z\d])[A-Za-z\d\s-]{3,10}$/,
};

// One limit for the form and the server, which both run validateCheckout. Addresses get more room:
// with landmark directions ("Opposite …, Beside …") they run past 200 characters.
const maxLengths: Record<CheckoutField, number> = {
  name: 200,
  email: 200,
  phone: 200,
  address: 300,
  zip: 200,
  city: 200,
  country: 200,
};

export const isValidEmail = (value: string) => formatRules.email!.test(value.trim());

// Card details are entered in Paystack's popup, so the form's fields are the same for both methods
export const validateCheckout = (values: CheckoutValues) => {
  const errors: CheckoutErrors = {};

  for (const field of Object.keys(values) as CheckoutField[]) {
    const value = values[field].trim();
    if (!value) errors[field] = 'Can’t be empty';
    else if (value.length > maxLengths[field])
      errors[field] = `Max ${maxLengths[field]} characters`;
    else if (formatRules[field] && !formatRules[field].test(value)) errors[field] = 'Wrong format';
  }
  return errors;
};
