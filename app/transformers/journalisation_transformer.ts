import type Journalisation from '#models/journalisation'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class JournalisationTransformer extends BaseTransformer<Journalisation> {
  toObject() {
    return {
      id: this.resource.id,
      module: this.resource.module,
      message: this.resource.message,
      createdAt: this.resource.createdAt,
      user: this.resource.user
        ? {
            fullName: this.resource.user.fullName,
          }
        : null,
    }
  }
}
