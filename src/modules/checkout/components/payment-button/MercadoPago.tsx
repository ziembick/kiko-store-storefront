'use client'

import { PaymentSession } from "@medusajs/medusa";
import { Button } from "@medusajs/ui";
import { useMercadopago } from "react-sdk-mercadopago";

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

const MercadoPagoButton = ({ session }: { session: PaymentSession }) => {
  const mercadoPago = useMercadopago.v2(MERCADOPAGO_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  const checkout = mercadoPago?.checkout({
    preference: {
      id: session.data.preferenceId, //preference ID
    },
  });

  return (
    <Button

      onClick={() => checkout.open()}
    >
      Pagar
    </Button>
  );
};


export default MercadoPagoButton