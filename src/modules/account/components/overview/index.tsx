import { Customer, Order } from "@medusajs/medusa"
import { Container } from "@medusajs/ui"
import { formatAmount } from "@lib/util/prices"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type OverviewProps = {
  customer: Omit<Customer, "password_hash"> | null
  orders: Order[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4">
          <span data-testid="welcome-message" data-value={customer?.first_name}>Olá, {customer?.first_name}!</span>
          <span className="text-small-regular text-ui-fg-base">
            Signed in as:{" "}
            <span className="font-semibold" data-testid="customer-email" data-value={customer?.email}>{customer?.email}</span>
          </span>
        </div>
        <div className="flex flex-col py-8 border-t border-gray-200">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="flex items-start gap-x-16 mb-6">
              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Perfil</h3>
                <div className="flex items-end gap-x-2">
                  <span className="text-3xl-semi leading-none" data-testid="customer-profile-completion" data-value={getProfileCompletion(customer)}>
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Completo
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Endereços</h3>
                <div className="flex items-end gap-x-2">
                  <span className="text-3xl-semi leading-none" data-testid="addresses-count" data-value={customer?.shipping_addresses?.length || 0}>
                    {customer?.shipping_addresses?.length || 0}
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Salvo
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <h3 className="text-large-semi">Pedidos recentes</h3>
              </div>
              <ul className="flex flex-col gap-y-4" data-testid="orders-wrapper">
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    return (
                      <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                        <LocalizedClientLink
                          href={`/account/orders/details/${order.id}`}
                        >
                          <Container className="bg-gray-50 flex justify-between items-center p-4">
                            <div className="grid grid-cols-3 grid-rows-2 text-small-regular gap-x-4 flex-1">
                              <span className="font-semibold">Data do pedido</span>
                              <span className="font-semibold">
                                Número do pedido
                              </span>
                              <span className="font-semibold">
                                Valor total
                              </span>
                              <span data-testid="order-created-date">
                                {new Date(order.created_at).toDateString()}
                              </span>
                              <span data-testid="order-id" data-value={order.display_id}>#{order.display_id}</span>
                              <span data-testid="order-amount">
                                {formatAmount({
                                  amount: order.total,
                                  region: order.region,
                                  includeTaxes: false,
                                })}
                              </span>
                            </div>
                            <button className="flex items-center justify-between" data-testid="open-order-button">
                              <span className="sr-only">
                                Ir para o pedido #{order.display_id}
                              </span>
                              <ChevronDown className="-rotate-90" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <span data-testid="no-orders-message">Nenhum pedido recente.</span>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (
  customer: Omit<Customer, "password_hash"> | null
) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  if (customer.billing_address) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
