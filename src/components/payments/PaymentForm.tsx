import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { formatPrice } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { StripeCardElementChangeEvent } from "@stripe/stripe-js";
import { SUPPORT_CONTACT_EMAIL } from "@/config/brand";

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  disabled = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    address: {
      line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
    },
  });

  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe has not loaded yet.");
      return;
    }

    if (!cardComplete) {
      setCardError("Please complete your card details.");
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          address: billingDetails.address,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create payment intent via Supabase edge function
      const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          amount: Math.round(amount * 100), // cents
          currency: currency.toLowerCase(),
          paymentMethodId: paymentMethod!.id,
          billingDetails,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Payment intent creation failed");
      }

      const clientSecret = (data as { clientSecret?: string } | null)?.clientSecret;
      if (!clientSecret) {
        throw new Error("Payment intent creation failed: missing client secret");
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod!.id,
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id, amount });
        toast({
          title: "Payment Successful",
          description: `Your payment of ${formatPrice(amount)} has been processed.`,
        });
        onSuccess(paymentIntent.id);
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      logger.error("Payment failed", { error: errorMessage, amount });
      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={billingDetails.name}
            onChange={e => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={billingDetails.email}
            onChange={e => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
            required
            placeholder={SUPPORT_CONTACT_EMAIL}
          />
        </div>

        <div>
          <Label>Card Information</Label>
          <div className="mt-1 p-3 border rounded-md bg-white">
            <CardElement
              options={cardElementOptions}
              onChange={handleCardChange}
              className="min-h-[40px]"
            />
          </div>
          {cardError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{cardError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              value={billingDetails.address.line1}
              onChange={e =>
                setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value },
                }))
              }
              required
              placeholder="123 Main St"
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              value={billingDetails.address.city}
              onChange={e =>
                setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value },
                }))
              }
              required
              placeholder="New York"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              type="text"
              value={billingDetails.address.state}
              onChange={e =>
                setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value },
                }))
              }
              required
              placeholder="NY"
            />
          </div>

          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              type="text"
              value={billingDetails.address.postal_code}
              onChange={e =>
                setBillingDetails(prev => ({
                  ...prev,
                  address: { ...prev.address, postal_code: e.target.value },
                }))
              }
              required
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">Secure payment powered by Stripe</span>
        </div>
        <div className="text-lg font-semibold">{formatPrice(amount)}</div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || !cardComplete || isProcessing || disabled}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatPrice(amount)}
          </>
        )}
      </Button>
    </form>
  );
};
