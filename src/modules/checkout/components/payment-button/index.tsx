"use client"

import { Cart, PaymentSession } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { placeOrder } from "@modules/checkout/actions"
import React, { useEffect, useState } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
// import { useMercadopago } from "react-sdk-mercadopago"
import { useMercadopago } from "react-sdk-mercadopago";

type PaymentButtonProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    cart.shipping_methods.length < 1
      ? true
      : false

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  if (paidByGiftcard) {
    return <GiftCardPaymentButton />
  }

  const paymentSession = cart.payment_session as PaymentSession

  switch (paymentSession.provider_id) {
    case "stripe":
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case "manual":
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case "paypal":
      return (
        <PayPalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )

    case "pag-bank-payment":
      return (
        <PagBankPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )

    // case "mercadopago":
    //   return (
    //     <MercadoPagoButton session={}/>
    //   )
    default:
      return <Button disabled>Selecione o método de pagamento</Button>
  }
}

const PagBankPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
  "data-testid"?: string
}) => {
  // redirect to pagbank
  const session = cart.payment_session as PaymentSession
  const pagbankUrl = session.data.payment_url as string

  return (
    <Button
      size="large"
      onClick={() => (window.location.href = pagbankUrl)}
      disabled={notReady}
      data-testid={dataTestId}
    >
      Pagar com PagBank
    </Button>
  )
}

// const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

// const MercadoPagoButton = ({ session }: { session: PaymentSession }) => {
//   const mercadoPago = useMercadopago.v2(MERCADOPAGO_PUBLIC_KEY, {
//     locale: "es-PE",
//   });

//   const checkout = mercadoPago?.checkout({
//     preference: {
//       id: session.data.preferenceId, //preference ID
//     },
//   });

//   return (
//     <Button
//       onClick={() => checkout.open()}
//     >
//       Pagar
//     </Button>
//   );
// };

// const MercadoPagoButton = ({
//   session,
//   notReady,
//   "data-testid": dataTestId,
// }: {
//   session: PaymentSession;
//   notReady: boolean;
//   "data-testid"?: string;
// }) => {
//   const [submitting, setSubmitting] = useState(false);

//   const handlePayment = async () => {
//     if (!session?.data?.preferenceId) {
//       console.error("Preference ID do Mercado Pago não encontrado.");
//       return;
//     }

//     const preferenceId = session.data.preferenceId as string;

//     try {
//       setSubmitting(true);
//       const mercadoPagoUrl = `https://sandbox.mercadopago.com.br/checkout/v1/redirect?preference-id=${preferenceId}`;
//       window.location.href = mercadoPagoUrl; // Redireciona para o Mercado Pago
//     } catch (error) {
//       console.error("Erro ao redirecionar para o Mercado Pago:", error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Button
//       disabled={notReady || submitting}
//       onClick={handlePayment}
//       isLoading={submitting}
//       data-testid={dataTestId}
//     >
//       Pagar com Mercado Pago
//     </Button>
//   );
// };

// const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

// const MercadoPagoButton = ({
//   session,
//   notReady,
// }: {
//   session: PaymentSession;
//   notReady: boolean
// }) => {
//   const [submitting, setSubmitting] = useState(false)
//   const mercadoPago = useMercadopago.v2(MERCADOPAGO_PUBLIC_KEY, {
//     locale: 'pt-BR'
//   })

//   const checkout = mercadoPago?.checkout({
//     preference: {
//       id: session.data.preferenceId
//     }
//   })

//   const handleClick = () => {
//     checkout.open()
//     setSubmitting(true)
//   }

//   return (
//     <Button disabled={notReady || submitting} onClick={handleClick}>
//       Pagar
//     </Button>
//   )
// }

const GiftCardPaymentButton = () => {
  const [submitting, setSubmitting] = useState(false)

  const handleOrder = async () => {
    setSubmitting(true)
    await placeOrder()
  }

  return (
    <Button
      onClick={handleOrder}
      isLoading={submitting}
      data-testid="submit-order-button"
    >
      Confirmar pedido
    </Button>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch(() => {
      setErrorMessage("An error occurred, please try again.")
      setSubmitting(false)
    })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_session as PaymentSession

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address.first_name +
              " " +
              cart.billing_address.last_name,
            address: {
              city: cart.billing_address.city ?? undefined,
              country: cart.billing_address.country_code ?? undefined,
              line1: cart.billing_address.address_1 ?? undefined,
              line2: cart.billing_address.address_2 ?? undefined,
              postal_code: cart.billing_address.postal_code ?? undefined,
              state: cart.billing_address.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const PayPalPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch(() => {
      setErrorMessage("An error occurred, please try again.")
      setSubmitting(false)
    })
  }

  const session = cart.payment_session as PaymentSession

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    actions?.order
      ?.authorize()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setErrorMessage(`An error occurred, status: ${authorization.status}`)
          return
        }
        onPaymentCompleted()
      })
      .catch(() => {
        setErrorMessage(`An unknown error occurred, please try again.`)
        setSubmitting(false)
      })
  }

  const [{ isPending, isResolved }] = usePayPalScriptReducer()

  if (isPending) {
    return <Spinner />
  }

  if (isResolved) {
    return (
      <>
        <PayPalButtons
          style={{ layout: "horizontal" }}
          createOrder={async () => session.data.id as string}
          onApprove={handlePayment}
          disabled={notReady || submitting || isPending}
          data-testid={dataTestId}
        />
        <ErrorMessage
          error={errorMessage}
          data-testid="paypal-payment-error-message"
        />
      </>
    )
  }
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch((err) => {
      setErrorMessage(err.toString())
      setSubmitting(false)
    })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
