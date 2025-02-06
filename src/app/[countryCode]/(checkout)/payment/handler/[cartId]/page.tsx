"use client"

import { placeOrder } from "@modules/checkout/actions"
import RefreshButton from "@modules/payment/components/refresh-button"
import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useState } from "react"

export default function PaymentHandler() {
  const params = useParams<{ cartId?: string }>()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    placeOrder(params.cartId).catch(() => {
      setIsLoading(false)
    })
  }, [params.cartId])

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      {isLoading ? (
        <div>Verifying payment...</div>
      ) : (
        <div>
          <div>Unable to verify payment, Please try again after some time</div>
          <div className="mt-4">
            <RefreshButton />
          </div>
        </div>
      )}
    </div>
  )
}
