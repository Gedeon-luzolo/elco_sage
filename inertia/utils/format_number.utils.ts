// Formate un nombre en utilisant la locale 'fr-CD' avec un maximum de 4 chiffres après la virgule.
export const numberFormatter = new Intl.NumberFormat('fr-CD', {
  maximumFractionDigits: 4,
})
