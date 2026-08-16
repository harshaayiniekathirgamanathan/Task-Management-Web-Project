import React from 'react';
import { Container, Button } from 'react-bootstrap';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5 text-center text-white">
          <div className="glass-card p-5 rounded-4 max-w-lg mx-auto border-secondary border-opacity-20 shadow-lg">
            <h2 className="fw-bold mb-3">Something went wrong</h2>
            <p className="text-muted mb-4 small">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <Button
              className="gradient-btn px-4 py-2 rounded-3 text-white fw-semibold"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/projects';
              }}
            >
              Return to Projects
            </Button>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}
