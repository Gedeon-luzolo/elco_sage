import type { SaleReportTotals } from '~/types/cash_session_types'
import { renderMoneyMap } from '~/utils/money_map.utils'
import { TotalItem } from './total_item_text'

interface SaleReportTotalSectionProps {
  totals: SaleReportTotals
}

export function SaleReportTotalSection({ totals }: SaleReportTotalSectionProps) {
  return (
    <div className="mt-8 border-t-2 border-gray-300 pt-6 print:mt-4 print:pt-3">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 print:mb-2 print:text-sm">
        Totaux généraux
      </h3>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] print:grid-cols-[minmax(0,1fr)_auto] print:gap-4">
        <div className="space-y-3 print:space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 print:text-[10px]">
            <TotalItem label="Cash" value={renderMoneyMap(totals.cashAmounts)} />
            <TotalItem label="Dettes" value={renderMoneyMap(totals.debtAmounts)} accent="debt" />
            <TotalItem label="Récouvrements" value={renderMoneyMap(totals.recoveryAmounts)} />
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-2 border-t pt-2 text-sm text-gray-700 print:text-[10px]">
            <TotalItem label="Revenu théorique" value={renderMoneyMap(totals.theoreticalAmounts)} />
            <TotalItem label="Remise" value={renderMoneyMap(totals.discountAmounts)} accent="bad" />
            <TotalItem
              label="Revenu réel"
              value={renderMoneyMap(totals.realAmounts)}
              accent="good"
            />
          </div>
        </div>

        <div className="flex items-end justify-start lg:justify-end print:justify-end">
          <div className="text-left lg:text-right print:text-right">
            <p className="text-sm font-medium uppercase text-gray-600 print:text-[9px]">
              Total encaissement
            </p>
            <p className="text-3xl font-bold text-gray-900 print:text-base">
              {renderMoneyMap(totals.collectionAmounts)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
