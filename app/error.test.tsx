import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from './error';

describe('error page', () => {
  it('retries with reset, and shows the server reference', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    const reset = vi.fn();
    render(
      <ErrorPage error={Object.assign(new Error('boom'), { digest: '4120934951' })} reset={reset} />
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByText('Reference: 4120934951')).toBeInTheDocument();
    // The message itself (possibly internal detail) is never shown
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });
});
