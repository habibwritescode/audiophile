import { fulfillCardPayment, recordRefundOutcome } from '@/lib/orders';
import { isPaymentReference } from '@/lib/payments';
import { PaystackConfigError, isValidWebhookSignature } from '@/lib/paystack';

// Paystack posts events here (Test Webhook URL in the Paystack dashboard). It retries until it gets
// a 200, so internal failures answer 500 on purpose, and fulfilment is safe to repeat.
export const POST = async (request: Request) => {
  const rawBody = await request.text();

  try {
    if (!isValidWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) {
      return new Response('Invalid signature', { status: 401 });
    }
  } catch (error) {
    if (error instanceof PaystackConfigError) {
      return new Response('Payments not configured', { status: 503 });
    }
    throw error;
  }

  let event: { event?: unknown; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  try {
    if (event.event === 'charge.success' && isPaymentReference(event.data?.reference)) {
      // The signature proves the sender; fulfilment still re-verifies the payment with Paystack
      const result = await fulfillCardPayment(event.data.reference);
      if (result.outcome === 'refunding' && !result.refundRequested) {
        // Answering 500 makes Paystack redeliver, and each delivery asks for the refund again
        return new Response('Refund not requested yet', { status: 500 });
      }
    } else if (
      (event.event === 'refund.processed' || event.event === 'refund.failed') &&
      isPaymentReference(event.data?.transaction_reference)
    ) {
      await recordRefundOutcome(
        event.data.transaction_reference,
        event.event === 'refund.processed' ? 'processed' : 'failed'
      );
    }
    // Anything else (other events, references from other systems) is acknowledged and ignored
  } catch (error) {
    console.error(`Paystack webhook ${String(event.event)} failed: ${(error as Error).message}`);
    return new Response('Processing failed', { status: 500 });
  }

  return new Response('OK');
};
