// Valeurs sérialisables en JSON (remplace le type du package Adonis côté frontend).
export type JSONDataTypes =
  string | number | boolean | null | undefined | JSONDataTypes[] | { [key: string]: JSONDataTypes }
