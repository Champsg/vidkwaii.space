import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './lib/analytics';
import { initErrorTracker, reportError } from './lib/errorTracker';

// Boot analytics + error tracking before React mounts
initErrorTracker();
initAnalytics();

/**
 * The admin dashboard and the tracking page are loaded only when their route is
 * opened, so neither ships inside the storefront bundle visitors download.
 */
const AdminApp = lazy(() => import('./AdminApp.tsx'));
const OrderTrackingPage = lazy(() =>
  import('./components/OrderTrackingPage').then((module) => ({ default: module.OrderTrackingPage }))
);

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected UI error:', error, info.componentStack);

    // Auto-recover from dynamic import chunk load errors (happens when new code is deployed)
    const isChunkError =
      /loading chunk|dynamically imported module|failed to fetch|importing a module script/i.test(
        error.message || ''
      );

    if (isChunkError) {
      const alreadyRetried = sessionStorage.getItem('vk_chunk_err_reload') === '1';
      if (!alreadyRetried) {
        sessionStorage.setItem('vk_chunk_err_reload', '1');
        window.location.reload();
        return;
      }
    }

    reportError({
      type: 'uncaught',
      message: error.message,
      stack: error.stack,
      context: { componentStack: info.componentStack?.slice(0, 500) },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <p className="font-serif text-lg font-bold text-stone-900">Something went wrong</p>
          <p className="text-xs text-stone-600">
            Please refresh the page. If it keeps happening, message us on WhatsApp and we&apos;ll take
            your order manually.
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('vk_chunk_err_reload');
              window.location.reload();
            }}
            className="mt-1 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

// Global Vite chunk load error auto-recovery
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const alreadyRetried = sessionStorage.getItem('vk_vite_preload_retry') === '1';
  if (!alreadyRetried) {
    sessionStorage.setItem('vk_vite_preload_retry', '1');
    window.location.reload();
  }
});

const path = window.location.pathname;
const Route = path.startsWith('/admin') ? AdminApp : path.startsWith('/track') ? OrderTrackingPage : App;

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <Route />
    </Suspense>
  </AppErrorBoundary>
);
