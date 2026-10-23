// Lit un champ de formulaire : texte nettoye, ou undefined quand il est vide.
export function fieldFormData(name: string, formData: FormData) {
  return String(formData.get(name) || '').trim() || undefined
}
