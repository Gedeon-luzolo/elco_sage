import { HttpContext } from '@adonisjs/core/http'
import { BaseSerializer } from '@adonisjs/core/transformers'
import { type SimplePaginatorMetaKeys } from '@adonisjs/lucid/types/querybuilder'

// Sérialiseur des réponses de l'API : toutes les réponses JSON sont enveloppées dans { data }
class ApiSerializer extends BaseSerializer<{
  Wrap: 'data'
  PaginationMetaData: SimplePaginatorMetaKeys
}> {
  // Clé sous laquelle toute donnée sérialisée est enveloppée
  wrap: 'data' = 'data'

  // Vérifie que les métadonnées de pagination ont bien la forme attendue par Lucid
  definePaginationMetaData(metaData: unknown): SimplePaginatorMetaKeys {
    if (!this.isLucidPaginatorMetaData(metaData)) {
      throw new Error('Métadonnées de pagination invalides : les clés de pagination Lucid manquent')
    }
    return metaData
  }
}

// Instance unique partagée par toute l'application
const serializer = new ApiSerializer()
const serialize = Object.assign(
  async function (this: HttpContext, ...[data, resolver]: Parameters<ApiSerializer['serialize']>) {
    // null n'est pas sérialisable par les transformers : "pas de donnée" reste un { data: null }
    if (data === null || data === undefined) {
      return { data: null }
    }

    const output = await serializer.serialize(data, resolver ?? this.containerResolver)

    // Les transformers enveloppent déjà leur résultat ; les tableaux et objets simples non.
    // On garantit ainsi un contrat unique { data } pour toute l'API
    const isWrapped =
      typeof output === 'object' && output !== null && 'data' in output && !Array.isArray(output)

    return isWrapped ? output : { data: output }
  } as unknown as ApiSerializer['serialize'],
  {
    withoutWrapping(
      this: HttpContext,
      ...[data, resolver]: Parameters<ApiSerializer['serializeWithoutWrapping']>
    ) {
      return serializer.serializeWithoutWrapping(data, resolver ?? this.containerResolver)
    },
  }
) as ApiSerializer['serialize'] & { withoutWrapping: ApiSerializer['serializeWithoutWrapping'] }

// Ajoute serialize à tous les HttpContext : les contrôleurs écrivent return ctx.serialize(data)
HttpContext.instanceProperty('serialize', serialize)

// Déclare serialize sur HttpContext pour le typage
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    serialize: typeof serialize
  }
}
