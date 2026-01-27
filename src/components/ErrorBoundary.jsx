import { Component } from 'react'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 400px;
  text-align: center;
`

const ErrorTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.error || '#ef4444'};
  margin-bottom: 1rem;
`

const ErrorMessage = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.5rem;
  max-width: 600px;
`

const ErrorDetails = styled.pre`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.text.tertiary};
  background-color: ${props => props.theme.colors.background};
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  max-width: 100%;
  text-align: left;
  margin-bottom: 1.5rem;
`

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.cardBackground};
  background-color: ${props => props.theme.colors.accent};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accentHover};
    transform: translateY(-2px);
  }
`

/**
 * ErrorBoundary - Catches React errors in component tree
 * 
 * Usage:
 * <ErrorBoundary fallback={<CustomErrorComponent />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    })

    // TODO: Log to error reporting service (e.g., Sentry) in production
    // if (import.meta.env.PROD) {
    //   logErrorToService(error, errorInfo)
    // }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </ErrorMessage>
          
          {import.meta.env.DEV && this.state.error && (
            <ErrorDetails>
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack && (
                <>
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </>
              )}
            </ErrorDetails>
          )}
          
          <RetryButton onClick={this.handleReset}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

/**
 * TreeErrorBoundary - Specialized error boundary for tree components
 * Provides tree-specific error handling
 */
export class TreeErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('TreeErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Tree Loading Error</ErrorTitle>
          <ErrorMessage>
            There was a problem loading the family tree. This might be due to missing data or a connection issue.
          </ErrorMessage>
          {import.meta.env.DEV && this.state.error && (
            <ErrorDetails>
              {this.state.error.toString()}
            </ErrorDetails>
          )}
          <RetryButton onClick={this.handleReset}>
            Reload Tree
          </RetryButton>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}
