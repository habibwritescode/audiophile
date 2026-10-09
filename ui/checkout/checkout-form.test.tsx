import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CheckoutForm, { CHECKOUT_FORM_ID } from './checkout-form';

// The page's submit button lives in the order summary, outside the form, linked by `form`
const renderForm = ({ cardAvailable = true } = {}) => {
  const onSubmit = vi.fn();
  render(
    <>
      <CheckoutForm onSubmit={onSubmit} cardAvailable={cardAvailable} />
      <button type="submit" form={CHECKOUT_FORM_ID}>
        Continue & Pay
      </button>
    </>
  );
  return { onSubmit, user: userEvent.setup() };
};

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Continue & Pay' }));

const fillShared = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Name'), 'Alexei Ward');
  await user.type(screen.getByLabelText('Email Address'), 'alexei@mail.com');
  await user.type(screen.getByLabelText('Phone Number'), '+1 202-555-0136');
  await user.type(screen.getByLabelText('Your Address'), '1137 Williams Avenue');
  await user.type(screen.getByLabelText('ZIP Code'), '10001');
  await user.type(screen.getByLabelText('City'), 'New York');
  await user.type(screen.getByLabelText('Country'), 'United States');
};

describe('CheckoutForm', () => {
  it('shows inline errors, focuses the first invalid field and does not submit when empty', async () => {
    const { onSubmit, user } = renderForm();

    await submit(user);

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Can’t be empty');
    expect(screen.getByLabelText('Country')).toHaveAccessibleDescription('Can’t be empty');
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears a field’s error as soon as it is fixed after a failed submit', async () => {
    const { user } = renderForm();
    await submit(user);

    await user.type(screen.getByLabelText('Email Address'), 'alexei@mail');
    expect(screen.getByLabelText('Email Address')).toHaveAccessibleDescription('Wrong format');

    await user.type(screen.getByLabelText('Email Address'), '.com');
    expect(screen.getByLabelText('Email Address')).not.toHaveAccessibleDescription();
  });

  it('submits the card method and the customer details when every field is valid', async () => {
    const { onSubmit, user } = renderForm();

    await fillShared(user);
    await submit(user);

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({
      paymentMethod: 'card',
      customer: { name: 'Alexei Ward', email: 'alexei@mail.com', phone: '+1 202-555-0136' },
    });
  });

  it('explains the Paystack window for card, and the cash message for Cash on Delivery', async () => {
    const { onSubmit, user } = renderForm();
    expect(screen.getByText(/Paystack’s secure window/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('Cash on Delivery'));
    expect(screen.queryByText(/Paystack’s secure window/)).not.toBeInTheDocument();
    expect(screen.getByText(/pay in cash when our delivery courier arrives/)).toBeInTheDocument();

    await fillShared(user);
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'cash' }));
  });

  it('offers only Cash on Delivery when card payments are unavailable', () => {
    renderForm({ cardAvailable: false });

    expect(screen.getByLabelText('Card')).toBeDisabled();
    expect(screen.getByLabelText('Cash on Delivery')).toBeChecked();
    expect(screen.getByText(/Card payments are unavailable/)).toBeInTheDocument();
  });
});
