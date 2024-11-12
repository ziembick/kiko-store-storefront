// MercadoPago.tsx
'use client'

import { PaymentSession } from "@medusajs/medusa";
import { Button } from "@medusajs/ui";
import { useMercadopago } from "react-sdk-mercadopago";
import { useEffect, useState } from "react";

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

interface MercadoPagoButtonProps {
  session: PaymentSession;
  notReady: boolean;
  dataTestId?: string;
}

const MercadoPagoButton = ({ session, notReady, dataTestId }: MercadoPagoButtonProps) => {
  const mercadoPago = useMercadopago.v2(MERCADOPAGO_PUBLIC_KEY, {
    locale: "pt-BR",
  });
  
  const [checkout, setCheckout] = useState<any | null>(null);

  useEffect(() => {
    if (mercadoPago && session?.data?.preferenceId) {
      const instance = mercadoPago.checkout({
        preference: {
          id: session.data.preferenceId as string,
        },
      });
      setCheckout(instance);
    }
  }, [mercadoPago, session?.data?.preferenceId]);

  const handlePayment = () => {
    if (checkout) {
      checkout.open();
    } else {
      console.error("Erro: checkout não está inicializado corretamente.");
    }
  };

  return (
    <Button onClick={handlePayment} disabled={notReady} data-testid={dataTestId}>
      Pagar com Mercado Pago
    </Button>
  );
};

export default MercadoPagoButton;
