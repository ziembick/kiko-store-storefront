"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Cart } from "@medusajs/medusa"
import { PricedShippingOption } from "@medusajs/medusa/dist/types/pricing"
import { Button, Heading, Text, clx, useToggleState } from "@medusajs/ui"
import { formatAmount } from "@lib/util/prices"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import Spinner from "@modules/common/icons/spinner"
import ErrorMessage from "@modules/checkout/components/error-message"
import { setShippingMethod } from "@modules/checkout/actions"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type ShippingProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  availableShippingMethods: PricedShippingOption[] | null
}

const ModalFrete = ({ isOpen, onClose, onFreteCalculado }: { isOpen: boolean, onClose: () => void, onFreteCalculado: (valor: number) => void }) => {
  const [resultado, setResultado] = useState<{
    distanciaKm: string
    pesoGramas: number
    custoFrete: string
  } | null>(null)

  const [enderecoEntrega, setEnderecoEntrega] = useState("")

  const baseLat = -23.561684
  const baseLng = -46.655981
  const peso = 400 // gramas

  useEffect(() => {
    if (isOpen) {
      const frete2 = document.querySelector('.shippingAddress2')?.textContent || ""
      const frete3 = document.querySelector('.shippingAddress3')?.textContent || ""
      const frete4 = document.querySelector('.shippingAddress4')?.textContent || ""
      const endereco = `${frete2} ${frete3} ${frete4}`.trim()
      setEnderecoEntrega(endereco)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && enderecoEntrega && resultado === null) {
      calcularFrete(enderecoEntrega)
    }
  }, [isOpen, enderecoEntrega])

  const calcularFrete = async (endereco: string) => {
    try {
      const geoRes = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248dd99b764d5c348f89d1da663615dcc05&text=${encodeURIComponent(endereco)}`)
      const geoData = await geoRes.json()
      if (!geoData.features.length) return

      const destinoLng = geoData.features[0].geometry.coordinates[0]
      const destinoLat = geoData.features[0].geometry.coordinates[1]

      const rotaRes = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: {
          'Authorization': '5b3ce3597851110001cf6248dd99b764d5c348f89d1da663615dcc05',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            [baseLng, baseLat],
            [destinoLng, destinoLat]
          ]
        })
      })

      const rotaData = await rotaRes.json()
      const distanciaMetros = rotaData.features[0].properties.summary.distance
      const distanciaKm = distanciaMetros / 1000
      const custoFrete = (distanciaKm * 1.5) + (peso * 0.01)

      setResultado({
        distanciaKm: distanciaKm.toFixed(2),
        pesoGramas: peso,
        custoFrete: custoFrete.toFixed(2)
      })
      onFreteCalculado(custoFrete * 100) // Passa o valor em centavos
    } catch (error) {
      console.error("Erro ao calcular frete:", error)
      setResultado(null)
    }
  }

  if (!isOpen) return null

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
            <p className="resultadoFrete"><strong>Frete total calculado:</strong> R$ {resultado.custoFrete}</p>
          </div>
        ) : (
          <p>Calculando frete...</p>
        )}
      </div>
    </div>
  )
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalFreteOpen, setIsModalFreteOpen] = useState(false)
  const [freteCalculado, setFreteCalculado] = useState(false)
  const [valorFreteCalculado, setValorFreteCalculado] = useState<number | null>(null)
  

  const openModalFrete = () => {
    setIsModalFreteOpen(true)
  }

  const closeModalFrete = () => {
    setIsModalFreteOpen(false)
  }

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    setIsLoading(true)
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod(id)
      .then(() => {
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.toString())
        setIsLoading(false)
      })
  }

  const handleChange = (value: string) => {
    set(value)
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
                !isOpen && cart.shipping_methods.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && cart.shipping_methods.length > 0 && <CheckCircleSolid />}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup
              value={cart.shipping_methods[0]?.shipping_option_id}
              onChange={(value: string) => handleChange(value)}
            >
              {availableShippingMethods ? (
                availableShippingMethods.map((option) => {
                  return (
                    <RadioGroup.Option
                      key={option.id}
                      value={option.id}
                      data-testid="delivery-option-radio"
                      className={clx(
                        "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                        {
                          "border-ui-border-interactive":
                            option.id ===
                            cart.shipping_methods[0]?.shipping_option_id,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <Radio
                          checked={
                            option.id ===
                            cart.shipping_methods[0]?.shipping_option_id
                          }
                        />
                        <span className="text-base-regular">{option.name}</span>
                      </div>
                        <span className={`shippingAmount justify-self-end text-ui-fg-base ${!freteCalculado ? 'hidden' : ''}`}>
                        {formatAmount({
                          amount: valorFreteCalculado || 0,
                          region: cart?.region,
                          includeTaxes: false,
                        })}
                      </span>
                    </RadioGroup.Option>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-ui-fg-base">
                  <Spinner />
                </div>
              )}
            </RadioGroup>
          </div>
          <Button
            size="large"
            className="botaoFrete mt-6 mr-[10px]"
            onClick={openModalFrete}
            isLoading={isLoading}
          >
            Simular Frete
          </Button>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods[0]}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
        
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_methods.length > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1 hidden">
                  Method
                </Text>
                <Text className="txt-medium text-ui-fg-subtle hidden">
                  {cart.shipping_methods[0].shipping_option.name} (
                  {formatAmount({
                    amount: cart.shipping_methods[0].price,
                    region: cart.region,
                    includeTaxes: false,
                  })
                    .replace(/,/g, "")
                    .replace(/\./g, ",")}
                  )
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
      <ModalFrete isOpen={isModalFreteOpen} onClose={closeModalFrete} onFreteCalculado={(valor) => {
        setFreteCalculado(true)
        setValorFreteCalculado(valor)
      }} />
    </div>
  )
}

export default Shipping
