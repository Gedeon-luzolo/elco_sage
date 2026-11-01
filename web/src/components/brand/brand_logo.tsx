interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return <img src="/images/elco_sage.png" alt="Elco Sage" className={className} />
}
