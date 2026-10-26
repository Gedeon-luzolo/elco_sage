// Fuseau de la caisse : Kinshasa est en UTC+1 toute l'année, sans heure d'été.
export const BUSINESS_TIME_ZONE = 'Africa/Kinshasa';
const BUSINESS_UTC_OFFSET = '+01:00';

// Formateurs créés une seule fois : jour en YYYY-MM-DD et heure en HH:mm, à l'heure de Kinshasa.
const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeLabelFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Jour métier d'un instant, au format YYYY-MM-DD (le serveur tourne en UTC).
 */
export function toDateKey(date: Date) {
  return dateKeyFormatter.format(date);
}

/**
 * Heure métier d'un instant, au format HH:mm.
 */
export function toTimeLabel(date: Date) {
  return timeLabelFormatter.format(date);
}

/**
 * Instants de début et de fin couvrant des journées complètes à Kinshasa.
 */
export function dayRange(startDateKey: string, endDateKey = startDateKey) {
  return {
    // Minuit au début du premier jour, dernière milliseconde du dernier.
    start: new Date(`${startDateKey}T00:00:00.000${BUSINESS_UTC_OFFSET}`),
    end: new Date(`${endDateKey}T23:59:59.999${BUSINESS_UTC_OFFSET}`),
  };
}

/**
 * Jour courant à Kinshasa, au format YYYY-MM-DD.
 */
export function todayKey() {
  return toDateKey(new Date());
}

/**
 * Premier jour du mois d'une clé YYYY-MM-DD.
 */
export function monthStartKey(dateKey: string) {
  return `${dateKey.slice(0, 7)}-01`;
}

/**
 * Chaque jour d'une période, bornes comprises, au format YYYY-MM-DD.
 */
export function eachDayKey(startDateKey: string, endDateKey: string) {
  const days: string[] = [];
  // Les clés sont des jours sans heure : on les parcourt en UTC, sans effet de fuseau.
  const cursor = new Date(`${startDateKey}T00:00:00.000Z`);
  const end = new Date(`${endDateKey}T00:00:00.000Z`);

  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

/**
 * Libellé français d'un jour : « 26/10/2026 », ou « 26/10 » sans l'année.
 */
export function toDayLabel(dateKey: string, withYear = true) {
  const [year, month, day] = dateKey.split('-');

  return withYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

/**
 * Date et heure lisibles d'un instant, par exemple « 26/10/2026 à 14:05 ».
 */
export function toDateTimeLabel(date: Date) {
  return `${toDayLabel(toDateKey(date))} à ${toTimeLabel(date)}`;
}
