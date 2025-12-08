import React from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

interface StripeProviderProps {
  children: React.ReactNode
  options?: {
    fonts?: any[]
    locale?: string
  }
}

export const StripeProvider: React.FC<StripeProviderProps> = ({
  children,
  options = {}
}) => {
  const [stripePromise, setStripePromise] = React.useState<Promise<any> | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const initializeStripe = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const stripe = await getStripe()
        if (stripe) {
          setStripePromise(Promise.resolve(stripe))
        } else {
          throw new Error('Stripe initialization returned null')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Failed to initialize Stripe', { error: errorMessage })
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    initializeStripe()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading payment system...</span>
      </div>
    )
  }

  if (error || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-destructive mb-2">Payment system unavailable</div>
        <div className="text-sm text-muted-foreground">
          {error || 'Stripe could not be initialized. Please refresh the page.'}
        </div>
      </div>
    )
  }

  const defaultOptions = {
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Inter:400,500,600'
      }
    ],
    locale: 'en',
    ...options
  }

  return (
    <Elements stripe={stripePromise} options={defaultOptions}>
      {children}
    </Elements>
  )
}

// Higher-order component for wrapping components that need Stripe
export const withStripeProvider = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <StripeProvider>
      <Component {...props} />
    </StripeProvider>
  )
}
