'use client';

import { useState } from 'react';
import TextInput from '../inputs/text-input';
import RadioInput from '../inputs/radio-input';

import cashOnDeliveryIcon from '@/public/assets/checkout/icon-cash-on-delivery.svg';
import Image from 'next/image';

export const CHECKOUT_FORM_ID = 'checkout-form';

type PaymentMethod = 'e-money' | 'cash';

const initialValues = {
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

type FieldName = keyof typeof initialValues;
type Errors = Partial<Record<FieldName, string>>;

const formatRules: Partial<Record<FieldName, RegExp>> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 7–15 digits, optionally separated by spaces, dashes or brackets
  phone: /^\+?(?:[\s()-]*\d){7,15}[\s()-]*$/,
  zip: /^(?=.*[A-Za-z\d])[A-Za-z\d\s-]{3,10}$/,
  eMoneyNumber: /^\d{9}$/,
  eMoneyPin: /^\d{4}$/,
};

const validate = (values: typeof initialValues, paymentMethod: PaymentMethod) => {
  const errors: Errors = {};
  const fields = (Object.keys(values) as FieldName[]).filter(
    (field) => paymentMethod === 'e-money' || !field.startsWith('eMoney')
  );

  for (const field of fields) {
    const value = values[field].trim();
    if (!value) errors[field] = 'Can’t be empty';
    else if (formatRules[field] && !formatRules[field].test(value)) errors[field] = 'Wrong format';
  }
  return errors;
};

type Props = {
  onSubmit: () => void;
};

const CheckoutForm = ({ onSubmit }: Props) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('e-money');

  // Validate on submit, then live after the first attempt so errors clear as the user fixes them
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValues = { ...values, [e.target.name]: e.target.value };
    setValues(nextValues);
    if (hasSubmitted) setErrors(validate(nextValues, paymentMethod));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (hasSubmitted) setErrors(validate(values, method));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasSubmitted(true);

    const nextErrors = validate(values, paymentMethod);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit();
  };

  const fieldProps = (name: FieldName) => ({
    name,
    value: values[name],
    onChange: handleChange,
    errorMessage: errors[name] ?? '',
  });

  return (
    <form
      id={CHECKOUT_FORM_ID}
      noValidate
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-6 pb-8 md:px-7 md:py-7.5 xl:p-12 xl:pt-13.5"
    >
      <h1 className="mb-8 text-28 text-black uppercase md:mb-10 md:text-32">Checkout</h1>

      <h2 className="mb-4 text-13 text-primary uppercase">Billing details</h2>
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
        <TextInput
          label="Name"
          placeholder="Alexei Ward"
          autoComplete="name"
          {...fieldProps('name')}
        />
        <TextInput
          label="Email Address"
          placeholder="alexei@mail.com"
          type="email"
          autoComplete="email"
          {...fieldProps('email')}
        />
        <TextInput
          label="Phone Number"
          placeholder="+1 202-555-0136"
          type="tel"
          autoComplete="tel"
          {...fieldProps('phone')}
        />
      </div>

      <h2 className="mt-8 mb-4 text-13 text-primary uppercase md:mt-13">shipping info</h2>
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
        <div className="md:col-span-2">
          <TextInput
            label="Your Address"
            placeholder="1137 Williams Avenue"
            autoComplete="street-address"
            {...fieldProps('address')}
          />
        </div>
        <TextInput
          label="ZIP Code"
          placeholder="10001"
          autoComplete="postal-code"
          {...fieldProps('zip')}
        />
        <TextInput
          label="City"
          placeholder="New York"
          autoComplete="address-level2"
          {...fieldProps('city')}
        />
        <TextInput
          label="Country"
          placeholder="United States"
          autoComplete="country-name"
          {...fieldProps('country')}
        />
      </div>

      <h2 className="mt-8 mb-4 text-13 text-primary uppercase md:mt-15">payment details</h2>
      <div className="md:grid md:grid-cols-2">
        <p className={`mb-4 text-12 text-black md:mb-0`}>Payment Method</p>

        <div className="mb-8 grid gap-4 md:mb-6">
          <RadioInput
            name="paymentMethod"
            value="e-money"
            label="e-Money"
            checked={paymentMethod === 'e-money'}
            onChange={() => handlePaymentMethodChange('e-money')}
          />
          <RadioInput
            name="paymentMethod"
            value="cash"
            label="Cash on Delivery"
            checked={paymentMethod === 'cash'}
            onChange={() => handlePaymentMethodChange('cash')}
          />
        </div>
      </div>

      {paymentMethod === 'e-money' ? (
        <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
          <TextInput
            label="e-Money Number"
            placeholder="238521993"
            inputMode="numeric"
            {...fieldProps('eMoneyNumber')}
          />
          <TextInput
            label="e-Money PIN"
            placeholder="6891"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            {...fieldProps('eMoneyPin')}
          />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-8 md:mt-7.5">
          <Image src={cashOnDeliveryIcon} alt="" className="shrink-0" />

          <p className="text-15 text-black/50">
            The ‘Cash on Delivery’ option enables you to pay in cash when our delivery courier
            arrives at your residence. Just make sure your address is correct so that your order
            will not be cancelled.
          </p>
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
