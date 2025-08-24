import TextInput from '../inputs/text-input';
import RadioInput from '../inputs/radio-input';

import cashOnDeliveryIcon from '@/public/assets/checkout/icon-cash-on-delivery.svg';
import Image from 'next/image';

const CheckoutForm = () => {
  return (
    <div className="rounded-lg bg-white p-6 pb-8 md:px-7 md:py-7.5 xl:p-12 xl:pt-13.5">
      <h1 className="mb-8 text-28 text-black uppercase md:mb-10 md:text-32">Checkout</h1>

      <h2 className="mb-4 text-13 text-primary uppercase">Billing details</h2>
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
        <TextInput label="Name" placeholder="Alexei Ward" errorMessage="" />
        <TextInput label="Email Address" placeholder="alexei@mail.com" errorMessage="" />
        <TextInput label="Phone Number" placeholder="+1 202-555-0136" errorMessage="" />
      </div>

      <h2 className="mt-8 mb-4 text-13 text-primary uppercase md:mt-13">shipping info</h2>
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
        <div className="md:col-span-2">
          <TextInput label="Your Address" placeholder="1137 Williams Avenue" errorMessage="" />
        </div>
        <TextInput label="ZIP Code" placeholder="10001" errorMessage="" />
        <TextInput label="City" placeholder="New York" errorMessage="" />
        <TextInput label="Country" placeholder="United States" errorMessage="" />
      </div>

      <h2 className="mt-8 mb-4 text-13 text-primary uppercase md:mt-15">payment details</h2>
      <div className="md:grid md:grid-cols-2">
        <p className={`mb-4 text-12 text-black md:mb-0`}>Payment Method</p>

        <div className="mb-8 grid gap-4 md:mb-6">
          <RadioInput name="paymentMethod" label="e-Money" checked />
          <RadioInput name="paymentMethod" label="e-Money" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:gap-x-4">
        <TextInput label="e-Money Number" placeholder="238521993" errorMessage="" />
        <TextInput label="e-Money PIN" placeholder="6891" errorMessage="" />
      </div>

      <div className="mt-7.5 flex items-center gap-8">
        <Image src={cashOnDeliveryIcon} alt="" />

        <p className="text-15 text-black/50">
          The ‘Cash on Delivery’ option enables you to pay in cash when our delivery courier arrives
          at your residence. Just make sure your address is correct so that your order will not be
          cancelled.
        </p>
      </div>
    </div>
  );
};

export default CheckoutForm;
