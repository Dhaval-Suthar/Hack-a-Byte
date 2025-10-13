const cashfreeLoaderPromises: Partial<Record<'sandbox' | 'production', Promise<void>>> = {};

const CASHFREE_SCRIPT_URLS: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js',
  production: 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js'
};

declare global {
  interface Window {
    Cashfree?: new (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (payload: { paymentSessionId: string; redirectTarget?: '_self' | '_blank' }) => Promise<{ redirect?: string }>;
    };
  }
}

async function loadCashfreeScript(mode: 'sandbox' | 'production'): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!cashfreeLoaderPromises[mode]) {
    cashfreeLoaderPromises[mode] = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CASHFREE_SCRIPT_URLS[mode];
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.body.appendChild(script);
    });
  }

  await cashfreeLoaderPromises[mode];
}

export async function openCashfreeCheckout(paymentSessionId: string, mode: 'sandbox' | 'production' = 'sandbox'): Promise<void> {
  if (!paymentSessionId) return;

  await loadCashfreeScript(mode);

  if (!window.Cashfree) {
    throw new Error('Cashfree SDK not available');
  }

  const cashfree = new window.Cashfree({ mode });
  await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
}
