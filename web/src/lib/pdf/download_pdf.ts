import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

// Délai avant de libérer le lien temporaire : le navigateur a lancé le téléchargement.
const REVOKE_DELAY_MS = 1000

/**
 * Télécharge un fichier généré dans le navigateur (PDF, CSV…) sous le nom donné.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

/**
 * Nom de fichier sans espaces ni « / » : (« Facture proforma », « 001/10/26 », « pdf »)
 * donne « Facture_proforma_001-10-26.pdf ».
 */
export function toFileName(parts: string[], extension: string) {
  const name = parts.map((part) => part.trim().replaceAll(' ', '_').replaceAll('/', '-')).join('_')

  return `${name}.${extension}`
}

/**
 * Génère un PDF dans le navigateur et le télécharge.
 * Le moteur PDF est lourd : il n'est chargé qu'au premier appel. loadDocument charge lui aussi
 * son gabarit à la demande et renvoie l'élément <Document> à rendre.
 */
export async function downloadPdf(
  loadDocument: () => Promise<ReactElement<DocumentProps>>,
  fileName: string
) {
  const [{ pdf }, document] = await Promise.all([import('@react-pdf/renderer'), loadDocument()])
  const blob = await pdf(document).toBlob()

  downloadBlob(blob, fileName)
}
