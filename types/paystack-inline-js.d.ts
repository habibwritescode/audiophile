// @paystack/inline-js ships no types. Only what we use, from the package README (v2.26).
declare module '@paystack/inline-js' {
  type ResumeCallbacks = {
    onSuccess?: (transaction: { id: number; reference: string; message: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
    onLoad?: (transaction: { id: number; accessCode: string }) => void;
  };

  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: ResumeCallbacks): unknown;
  }
}
