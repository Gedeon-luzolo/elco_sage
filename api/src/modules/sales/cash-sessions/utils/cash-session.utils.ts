import { toDateKey, toTimeLabel } from '../../../../common/utils/date.utils.js';
import { normalizeMoneyMap } from '../../../../common/utils/money-map.utils.js';
import { getUserDisplayName } from '../../../users/utils/user.utils.js';
import type { CashSession } from '../entities/cash-session.entity.js';

/**
 * Ce que l'API expose d'une session : dates découpées à l'heure de Kinshasa et noms des utilisateurs.
 */
export function toCashSessionResponse(session: CashSession) {
  return {
    id: session.id,
    openedById: session.openedById,
    closedById: session.closedById,
    status: session.status,
    openedAt: session.openedAt,
    // Jour et heure locaux, prêts à afficher.
    openingDate: toDateKey(session.openedAt),
    openingTime: toTimeLabel(session.openedAt),
    closedAt: session.closedAt,
    closingDate: session.closedAt ? toDateKey(session.closedAt) : null,
    closingTime: session.closedAt ? toTimeLabel(session.closedAt) : null,
    // Les montants attendus valent 0 tant que la session n'est pas clôturée.
    systemAmounts: normalizeMoneyMap(session.systemAmounts),
    closingAmounts: session.closingAmounts
      ? normalizeMoneyMap(session.closingAmounts)
      : null,
    differenceAmounts: session.differenceAmounts
      ? normalizeMoneyMap(session.differenceAmounts)
      : null,
    // Les relations ne partent jamais telles quelles : un utilisateur porte son mot de passe haché.
    openedByName: getUserDisplayName(session.openedBy),
    closedByName: getUserDisplayName(session.closedBy),
  };
}
