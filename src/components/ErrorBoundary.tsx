import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            background: '#fafafa',
          }}
        >
          <img src="/tabbled-logo-vertical.png" alt="Tabbled" style={{ height: 80, marginBottom: 24 }} />
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111',
              marginBottom: 8,
            }}
          >
            Bir şeyler ters gitti
          </h1>
          <p
            style={{
              color: '#666',
              fontSize: '0.95rem',
              fontWeight: 300,
              marginBottom: 24,
              maxWidth: 400,
            }}
          >
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sayfayı Yenile
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: 24,
                padding: 16,
                background: '#fee',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: '#c00',
                maxWidth: '90vw',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
