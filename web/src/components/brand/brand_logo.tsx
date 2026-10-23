import elcoSageLogo from '~/images/elco_sage.png'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return <img src={elcoSageLogo} alt="Elco Sage" className={className} />
}
