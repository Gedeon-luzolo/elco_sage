import { useRoutes } from 'react-router-dom'
import { usePrefetchSalesData } from '~/hooks/sales/usePrefetchSalesData'
import CashSessionDetailPage from '~/pages/sales/cash_session_detail_page'
import CashSessionsPage from '~/pages/sales/cash_sessions_page'
import DebtsPage from '~/pages/sales/debts_page'
import ProformaFormPage from '~/pages/sales/proforma_form_page'
import ProformasPage from '~/pages/sales/proformas_page'
import RecoveriesPage from '~/pages/sales/recoveries_page'
import SalesHistoryPage from '~/pages/sales/sales_history_page'
import CashSessionOpeningPage from '~/pages/sales/cash_session_opening_page'
import SaleCreatePage from '~/pages/sales/sale_create_page'
import SalesPage from '~/pages/sales/sales_page'

// Table de routes interne au module Ventes, téléchargée uniquement avec lui.
const salesRoutes = [
  { index: true, element: <SalesPage /> },
  { path: 'session/open', element: <CashSessionOpeningPage /> },
  { path: 'create', element: <SaleCreatePage /> },
  { path: 'history', element: <SalesHistoryPage /> },
  { path: 'proformas', element: <ProformasPage /> },
  { path: 'proformas/create', element: <ProformaFormPage /> },
  { path: 'proformas/:id/edit', element: <ProformaFormPage /> },
  { path: 'debts', element: <DebtsPage /> },
  { path: 'recoveries', element: <RecoveriesPage /> },
  { path: 'sessions', element: <CashSessionsPage /> },
  { path: 'sessions/:id', element: <CashSessionDetailPage /> },
]

// Entrée du module Ventes montée depuis la route de base /sales/*.
export function SalesRoutesModule() {
  // Les données du module sont mises en cache dès son ouverture, sans attendre la visite des pages
  usePrefetchSalesData()

  return useRoutes(salesRoutes)
}
