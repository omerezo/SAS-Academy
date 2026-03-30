import * as React from "react"

const PHONE_WIDTH = 767
const PHONE_LANDSCAPE_HEIGHT = 430

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setIsMobile(w <= PHONE_WIDTH || h <= PHONE_LANDSCAPE_HEIGHT)
    }

    check()

    window.addEventListener("resize", check)
    screen.orientation?.addEventListener("change", check)

    return () => {
      window.removeEventListener("resize", check)
      screen.orientation?.removeEventListener("change", check)
    }
  }, [])

  return !!isMobile
}
