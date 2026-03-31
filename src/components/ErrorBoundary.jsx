import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          margin: 32, padding: 24, background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 10, fontFamily: 'monospace',
        }}>
          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 16, marginBottom: 12 }}>
            Page Error
          </div>
          <pre style={{ color: '#7f1d1d', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '6px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
