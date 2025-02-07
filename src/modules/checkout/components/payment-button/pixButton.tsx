// import React, { useState } from 'react'
//    import Medusa from "@medusajs/medusa-js"

//    const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })

//    function CustomPaymentButton({ cartId }: any) {
//      const [loading, setLoading] = useState(false)

//      const handlePayment = async () => {
//        setLoading(true)
//        try {
//          // Create a payment session
//          await medusa.carts.createPaymentSessions(cartId)

//          // Update the cart with your payment provider
//         //  await medusa.carts.updatePaymentSession(cartId, "your-provider-id", {
//         //    // Any data required by your payment provider
//         //  })

//          // Complete the cart to create an order
//          const { order } = await medusa.carts.complete(cartId)

//          // Handle successful payment
//          console.log("Order created:", order)
//        } catch (error) {
//          console.error("Payment failed:", error)
//        }
//        setLoading(false)
//      }
// return (
//        <button onClick={handlePayment} disabled={loading}>
//          {loading ? "Processing..." : "Pay Now"}
//        </button>
//      )
//    }

//    export default CustomPaymentButton