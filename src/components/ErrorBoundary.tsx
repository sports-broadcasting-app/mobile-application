import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../constants/designTokens';
import { Button } from './Button';

interface FallbackProps {
  error: Error;
  onRetry: () => void;
}

function DefaultErrorFallback({ error, onRetry }: FallbackProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Algo deu errado
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {error.message}
      </Text>
      <Button
        label="Tentar novamente"
        onPress={onRetry}
        testID="error-boundary-retry"
      />
    </View>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: FallbackProps) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback ?? DefaultErrorFallback;
      return <Fallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.size.body,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
});
