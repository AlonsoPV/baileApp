import { Component, ReactNode } from 'react';

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, { error?: any }> {
  state = { error: undefined as any };

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[GlobalErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh',
          background: '#0E0E0E',
          color: 'white',
          padding: 24
        }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Algo salió mal</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
