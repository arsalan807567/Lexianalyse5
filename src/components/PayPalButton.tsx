import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface PayPalButtonProps {
  planName: string;
  amount: string;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ planName, amount, onSuccess, onError }) => {
  const { user } = useAuth();
  const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="p-4 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-100">
        PayPal Client ID not configured. Please set VITE_PAYPAL_CLIENT_ID in Settings.
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: clientId, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "pay" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: `${planName} Subscription - LexiAnalyse`,
                amount: {
                  currency_code: "USD",
                  value: amount.replace(/[^0-9.]/g, ''), // Extract numeric value, assuming USD for PayPal
                },
              },
            ],
            application_context: {
              shipping_preference: 'NO_SHIPPING'
            }
          } as any);
        }}
        onApprove={async (data, actions) => {
          if (user) {
            try {
              const response = await fetch("/api/paypal/capture", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderID: data.orderID,
                  planName: planName,
                  userId: user.uid,
                }),
              });

              const result = await response.json();
              
              if (result.status === "COMPLETED") {
                if (onSuccess) onSuccess();
              } else {
                throw new Error(result.error || "Capture failed");
              }
            } catch (err) {
              console.error("Capture call error:", err);
              if (onError) onError(err);
            }
          }
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          if (onError) onError(err);
        }}
      />
    </PayPalScriptProvider>
  );
};
