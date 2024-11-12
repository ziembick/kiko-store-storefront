// MercadoPagoButton.tsx
"use client";

import { useMercadopago } from "react-sdk-mercadopago";
import { Button } from "@medusajs/ui";
import React, { useEffect } from "react";

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

interface MercadoPagoButtonProps {
  preferenceId: string;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({ preferenceId }) => {
  const mercadopago = useMercadopago.v2(MERCADOPAGO_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  useEffect(() => {
    if (mercadopago) {
      mercadopago.checkout({
        preference: {
          id: preferenceId,
        },
      });
    }
  }, [mercadopago, preferenceId]);

  return (
    <Button
      onClick={() => {
        try {
          mercadopago?.checkout({ preference: { id: preferenceId } }).open();
        } catch (error) {
          console.error("Erro ao abrir o checkout:", error);
          alert("Ocorreu um erro ao iniciar o pagamento. Tente novamente.");
        }
      }}
    >
      Pagar com Mercado Pago
    </Button>
  );
};

export default MercadoPagoButton;
