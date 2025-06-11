"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Cart } from "@medusajs/medusa"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, Tooltip, clx } from "@medusajs/ui"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import PaymentContainer from "@modules/checkout/components/payment-container"
import { setPaymentMethod } from "@modules/checkout/actions"
import { paymentInfoMap } from "@lib/constants"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"


const ModalFrete = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null

  const [resultado, setResultado] = useState<{
    distanciaKm: string
    pesoGramas: number
    custoFrete: string
  } | null>(null)

  // Pegando o endereço do cliente do DOM
  const frete2 = document.querySelector('.shippingAddress2')?.textContent || ""
  const frete3 = document.querySelector('.shippingAddress3')?.textContent || ""
  const frete4 = document.querySelector('.shippingAddress4')?.textContent || ""
  const enderecoEntrega = `${frete2} ${frete3} ${frete4}`.trim()

  // Coordenadas fixas da base operacional
  const baseLat = -23.561684
  const baseLng = -46.655981

  // Peso total da compra (em gramas)
  const peso = 400

  async function calcularFrete() {
    try {
      // Consulta ao Nominatim para obter coordenadas do endereço
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoEntrega)}`, {
        headers: { 'User-Agent': 'frete-ecommerce' }
      })
      const data = await response.json()
      if (!data.length) {
        setResultado(null)
        return
      }

      const destinoLat = parseFloat(data[0].lat)
      const destinoLng = parseFloat(data[0].lon)

      // Cálculo da distância com fórmula de Haversine:
      const R = 6371 // Raio da Terra em km

      // Converte diferença de latitude para radianos
      const dLat = (destinoLat - baseLat) * Math.PI / 180

      // Converte diferença de longitude para radianos
      const dLon = (destinoLng - baseLng) * Math.PI / 180

      // Fórmula de Haversine: calcula o valor de 'a' com base nas diferenças angulares
      const a =
        Math.sin(dLat / 2) ** 2 + // seno²(Δlat/2)
        Math.cos(baseLat * Math.PI / 180) * // cos(lat base em rad)
        Math.cos(destinoLat * Math.PI / 180) * // cos(lat destino em rad)
        Math.sin(dLon / 2) ** 2 // seno²(Δlon/2)

      // 'c' é o arco central da esfera (em radianos)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      // Distância final entre os dois pontos
      const distanciaKm = R * c

      // Lógica do frete: R$1.5 por km + R$0.01 por grama
      const custoFrete = (distanciaKm * 1.5) + (peso * 0.01)

      setResultado({
        distanciaKm: distanciaKm.toFixed(2),
        pesoGramas: peso,
        custoFrete: custoFrete.toFixed(2)
      })
    } catch (error) {
      console.error("Erro ao calcular frete:", error)
      setResultado(null)
    }
  }

  calcularFrete()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        <h1 className="text-xl font-bold mb-4">Simulação de Frete</h1>
        {resultado ? (
          <div className="space-y-2 text-sm">
            <p><strong>Distância até o destino:</strong> {resultado.distanciaKm} km</p>
            <p><strong>Peso do pedido:</strong> {resultado.pesoGramas} g</p>
            <p><strong>Frete total calculado:</strong> R$ {resultado.custoFrete}</p>
          </div>
        ) : (
          <p>Calculando frete...</p>
        )}
      </div>
    </div>
  )
}




const Modal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null

  const totalValue = document.querySelector('.totalValue')
  const total = totalValue?.textContent?.replace('R$', '').replace(',', '.').trim()
  const valorTotal = total ? parseFloat(total) : 0

  function obterTaxaJuros(valor: number, parcelas: number): number {
    // Taxa dinâmica baseada no valor e parcelas
    if (parcelas <= 3) return 0 // Sem juros até 3x
    
    // Faixa de valor baixo (até R$ 500)
    if (valor <= 500) {
      switch (parcelas) {
        case 6: return 1.99
        case 9: return 2.49
        case 12: return 2.99
        default: return 3.49
      }
    }
    
    // Faixa de valor médio (R$ 500 - R$ 1500)
    if (valor <= 1500) {
      switch (parcelas) {
        case 6: return 1.79
        case 9: return 2.29
        case 12: return 2.79
        default: return 3.29
      }
    }
    
    // Faixa de valor alto (acima de R$ 1500)
    switch (parcelas) {
      case 6: return 1.49
      case 9: return 1.99
      case 12: return 2.49
      default: return 2.99
    }
  }

  function calcularParcelamentoComJuros(valor: number, parcelas: number, taxaJurosMensal: number) {
    const i = taxaJurosMensal / 100
    const parcela = valor * (i / (1 - Math.pow(1 + i, -parcelas)))
    return parseFloat(parcela.toFixed(2))
  }

  function handleParcelamento(parcelas: number) {
    const taxaJuros = obterTaxaJuros(valorTotal, parcelas)
    
    const valorParcela = parcelas <= 3
      ? parseFloat((valorTotal / parcelas).toFixed(2))
      : calcularParcelamentoComJuros(valorTotal, parcelas, taxaJuros)

    const textoJuros = parcelas <= 3 ? "sem juros" : `com juros de ${taxaJuros}% a.m.`
    alert(`${parcelas}x de R$ ${valorParcela.toFixed(2)} ${textoJuros}`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4">Simulação de Parcelamento</h2>
                  <div className="space-y-3">
            <p className="text-gray-600">Valor total: R$ {valorTotal.toFixed(2)}</p>
            <p className="text-gray-600">Escolha o número de parcelas:</p>
            <div className="space-y-2">
              {[1, 2, 3, 6, 9, 12].map((parcela) => {
                const taxaJuros = obterTaxaJuros(valorTotal, parcela)
                const valorParcela = parcela <= 3
                  ? parseFloat((valorTotal / parcela).toFixed(2))
                  : calcularParcelamentoComJuros(valorTotal, parcela, taxaJuros)
                
                return (
                  <div 
                    key={parcela}
                    className="p-3 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => handleParcelamento(parcela)}
                  >
                    <span className="font-medium">{parcela}x de R$ {valorParcela.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">
                      {parcela <= 3 ? "sem juros" : `${taxaJuros}% a.m.`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
      </div>
    </div>
  )
}



const Payment = ({
  cart,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalFreteOpen, setIsModalFreteOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const isStripe = cart?.payment_session?.provider_id === "stripe"
  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (cart?.payment_session && cart?.shipping_methods.length !== 0) ||
    paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      // @ts-ignore
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const set = async (providerId: string) => {
    setIsLoading(true)
    await setPaymentMethod(providerId)
      .catch((err) => setError(err.toString()))
      .finally(() => {
        if (providerId === "paypal") return
        setIsLoading(false)
      })
  }

  const handleChange = (providerId: string) => {
    setError(null)
    set(providerId)
  }


  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openModalFrete = () => {
    setIsModalFreteOpen(true)
  }

  const closeModalFrete = () => {
    setIsModalFreteOpen(false)
  }

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = () => {
    setIsLoading(true)
    router.push(pathname + "?" + createQueryString("step", "review"), {
      scroll: false,
    })
  }

  useEffect(() => {
    setIsLoading(false)
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && cart?.payment_sessions?.length ? (
            <>
              <RadioGroup
                value={cart.payment_session?.provider_id || ""}
                onChange={(value: string) => handleChange(value)}
              >
                {cart.payment_sessions
                  .sort((a, b) => {
                    return a.provider_id > b.provider_id ? 1 : -1
                  })
                  .map((paymentSession) => {
                    return (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentSession={paymentSession}
                        key={paymentSession.id}
                        selectedPaymentOptionId={
                          cart.payment_session?.provider_id || null
                        }
                      />
                    )
                  })}
              </RadioGroup>
              {isStripe && stripeReady && (
                <div className="mt-5 transition-all duration-150 ease-in-out">
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Enter your card details:
                  </Text>

                  <CardElement
                    options={useOptions as StripeCardElementOptions}
                    onChange={(e) => {
                      setCardBrand(
                        e.brand &&
                          e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                      )
                      setError(e.error?.message || null)
                      setCardComplete(e.complete)
                    }}
                  />
                </div>
              )}
            </>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-ui-fg-base">
              <Spinner />
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />
          <div>
            
          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripe && !cardComplete) ||
              (!cart?.payment_session && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            Continue to review
          </Button>
          <Button
            size="large"
            className="mt-6"
            onClick={openModal}
            isLoading={isLoading}
          >
            Simular Parcelamento
          </Button>
          <Button
            size="large"
            className="mt-6"
            onClick={openModalFrete}
            isLoading={isLoading}
          >
            Simular Frete
          </Button>
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && cart.payment_session ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[cart.payment_session.provider_id]?.title ||
                    cart.payment_session.provider_id}
                </Text>
                {process.env.NODE_ENV === "development" &&
                  !Object.hasOwn(
                    paymentInfoMap,
                    cart.payment_session.provider_id
                  ) && (
                    <Tooltip content="You can add a user-friendly name and icon for this payment provider in 'src/modules/checkout/components/payment/index.tsx'" />
                  )}
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[cart.payment_session.provider_id]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {cart.payment_session.provider_id === "stripe" && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
      <Modal isOpen={isModalOpen} onClose={closeModal} />
      <ModalFrete isOpen={isModalFreteOpen} onClose={closeModalFrete} />
    </div>
  )
}

export default Payment
