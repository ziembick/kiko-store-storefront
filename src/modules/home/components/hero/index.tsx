import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span className="w-full">
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            <Image src="https://kiko-store-production.up.railway.app/uploads/banner_gato.png" alt="Image banner" fill/>
          </Heading>
          {/* <Heading
            level="h2"
            className="text-3xl leading-10 text-ui-fg-subtle font-normal"
          >
            Powered by Medusa and Next.js
          </Heading> */}
        </span>
        <a
          href="https://github.com/medusajs/nextjs-starter-medusa"
          target="_blank"
        >
          {/* <Button variant="secondary">
            View on GitHub
            <Github />
          </Button> */}
        </a>
      </div>
    </div>
  )
}

export default Hero
