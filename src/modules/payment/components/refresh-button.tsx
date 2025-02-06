"use client"

import React from "react"
import { Button } from "@medusajs/ui"

const RefreshButton = () => {
  return (
    <Button variant="secondary" onClick={() => window.location.reload()}>
      Check again
    </Button>
  )
}

export default RefreshButton
