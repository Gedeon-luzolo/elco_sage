import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COMPANY } from '~/constants/company'
import elcoPrintLogo from '~/images/elco_print.png'
import { businessDateKey, formatDateLabel } from '~/utils/date'
import { formatNumber } from '~/utils/format_number.utils'
import type { InvoiceDocument } from '~/utils/invoices/invoice.utils'

// Couleurs relevées sur la facture papier d'Elco Print.
const NAVY = '#1f2a5c'
const RULE_BLUE = '#2443a8'
const HEADER_FILL = '#bdd7ee'
const TOTAL_FILL = '#9dc3e6'

// Largeurs des colonnes du tableau (N°, désignation, quantité, prix unitaire, prix total).
const COLUMNS = { index: '8%', designation: '46%', quantity: '10%', unitPrice: '17%', total: '19%' }

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 90,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#111111',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  logo: { width: 104, height: 104, objectFit: 'contain' },
  legal: { fontFamily: 'Times-Bold', fontSize: 13, color: NAVY, lineHeight: 1.3 },
  headerRule: { marginTop: 4, width: 330, borderBottomWidth: 2, borderBottomColor: RULE_BLUE },
  title: {
    marginTop: 58,
    flexDirection: 'row',
    justifyContent: 'center',
    fontFamily: 'Times-Bold',
    fontSize: 19,
  },
  titleUnderlined: { textDecoration: 'underline' },
  customer: { marginTop: 34, marginBottom: 30, fontSize: 13 },
  customerLabel: { fontFamily: 'Helvetica-Bold' },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000000' },
  row: { flexDirection: 'row' },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  headerCell: { backgroundColor: HEADER_FILL, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  totalCell: { backgroundColor: TOTAL_FILL, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  signature: { marginTop: 34, alignSelf: 'flex-end', alignItems: 'center', fontSize: 12 },
  signatureRole: { marginTop: 8, fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 56,
    right: 56,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 9.5,
    color: NAVY,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  footerEmail: { textDecoration: 'underline', color: RULE_BLUE },
})

interface InvoicePdfDocumentProps {
  invoice: InvoiceDocument
}

// Facture A4 (vente ou proforma), reprise de la facture papier d'Elco Print.
export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  const currencySymbol = invoice.currency === 'USD' ? '$' : 'FC'
  const hasDiscount = invoice.discountAmount > 0

  return (
    <Document title={`${invoice.title} ${invoice.reference}`} author="Elco Print">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={elcoPrintLogo} style={styles.logo} />
          <View>
            <Text style={styles.legal}>R.C.C.M {COMPANY.rccm}</Text>
            <Text style={styles.legal}>ID. NAT.: {COMPANY.idNat}</Text>
            <Text style={styles.legal}>IMPOT: {COMPANY.taxNumber}</Text>
          </View>
        </View>
        <View style={styles.headerRule} />

        {/* Espace insécable : une espace simple en début de bloc serait supprimée */}
        <View style={styles.title}>
          <Text style={styles.titleUnderlined}>{invoice.title}</Text>
          <Text>{` N°${invoice.reference}`}</Text>
        </View>

        <Text style={styles.customer}>
          <Text style={styles.customerLabel}>Nom du Client : </Text>
          {invoice.customerName?.toUpperCase() ?? '-'}
        </Text>

        <View style={styles.table}>
          <View style={styles.row} fixed>
            <HeaderCell width={COLUMNS.index} label="N°" />
            <HeaderCell width={COLUMNS.designation} label="Désignation" align="center" />
            <HeaderCell width={COLUMNS.quantity} label="Qté." />
            <HeaderCell width={COLUMNS.unitPrice} label={`P.U (${currencySymbol})`} />
            <HeaderCell width={COLUMNS.total} label={`P.T (${currencySymbol})`} />
          </View>

          {invoice.lines.map((item) => (
            <View key={item.position} style={styles.row} wrap={false}>
              <View style={[styles.cell, { width: COLUMNS.index }]}>
                <Text style={styles.center}>{item.position}</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS.designation }]}>
                <Text>{item.designation}</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS.quantity }]}>
                <Text style={styles.right}>{formatNumber(item.quantity)}</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS.unitPrice }]}>
                <Text style={styles.right}>{formatNumber(item.unitPrice)}</Text>
              </View>
              <View style={[styles.cell, { width: COLUMNS.total }]}>
                <Text style={styles.right}>{formatNumber(item.totalPrice)}</Text>
              </View>
            </View>
          ))}

          {/* Une remise ajoute le sous-total et la remise au-dessus du total */}
          {hasDiscount && (
            <>
              <TotalRow label="SOUS-TOTAL" amount={invoice.theoreticalAmount} />
              <TotalRow label="REMISE" amount={invoice.discountAmount} />
            </>
          )}
          <TotalRow label="TOTAL" amount={invoice.totalAmount} />
        </View>

        <View style={styles.signature} wrap={false}>
          <Text>
            Fait à {COMPANY.city}, Le {formatDateLabel(businessDateKey(invoice.issuedAt))}
          </Text>
          <Text style={styles.signatureRole}>Caisse</Text>
        </View>

        {/* Pied de page répété sur chaque page */}
        <View style={styles.footer} fixed>
          <Text>{COMPANY.address}</Text>
          <Text>
            {COMPANY.phone} E-mail : <Text style={styles.footerEmail}>{COMPANY.email}</Text>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function HeaderCell({
  width,
  label,
  align = 'left',
}: {
  width: string
  label: string
  align?: 'left' | 'center'
}) {
  return (
    <View style={[styles.cell, styles.headerCell, { width }]}>
      <Text style={align === 'center' ? styles.center : undefined}>{label}</Text>
    </View>
  )
}

// Ligne de total : le libellé occupe les quatre premières colonnes, le montant la dernière.
function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.row} wrap={false}>
      <View style={[styles.cell, styles.totalCell, { width: '81%' }]}>
        <Text style={styles.center}>{label}</Text>
      </View>
      <View style={[styles.cell, styles.totalCell, { width: COLUMNS.total }]}>
        <Text style={styles.right}>{formatNumber(amount)}</Text>
      </View>
    </View>
  )
}
