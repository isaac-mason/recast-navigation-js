import { Component } from 'react';
import { ErrorMessage } from './error-message';

export type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorMessage>Uncaught exception: {this.state.errorMessage}</ErrorMessage>;
    }

    return this.props.children;
  }
}
