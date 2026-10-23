// Lit un champ de formulaire : texte nettoyé, ou undefined quand il est vide.
export function fieldFormData(name: string, formData: FormData) {
  // Valeur absente ou blanche : le champ est considéré comme non renseigné
  return String(formData.get(name) || '').trim() || undefined
}
