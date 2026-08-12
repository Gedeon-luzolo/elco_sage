import { useRef, type FC, type ReactNode } from 'react'
import { useReactToPrint } from 'react-to-print'

interface UseSimplePrintOptions {
  orientation?: 'landscape' | 'portrait'
  margin?: string
}

interface UseSimplePrintReturn {
  PrintContainer: FC<{ children: ReactNode }>
  handlePrint: () => void
}

export function useSimplePrint(options: UseSimplePrintOptions = {}): UseSimplePrintReturn {
  const { orientation = 'landscape', margin = '1cm 1.2cm' } = options
  const contentRef = useRef<HTMLDivElement>(null)

  // react-to-print clone uniquement le noeud ciblé par cette ref.
  const handlePrint = useReactToPrint({ contentRef })

  const PrintContainer: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="hidden print:block">
      <style>{`
        /* Les rapports ELCO restent en A4; les options ne changent que l'orientation et les marges. */
        @page {
          size: A4 ${orientation};
          margin: ${margin};
        }
      `}</style>
      <div
        ref={contentRef}
        className="min-h-150 bg-white p-2 font-sans text-[10px] leading-tight text-black"
        style={{ colorScheme: 'light' }}
      >
        {children}
      </div>
    </div>
  )

  return {
    PrintContainer,
    handlePrint,
  }
}
