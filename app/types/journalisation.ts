import type User from '#models/user'
import type { JournalisationModule } from '#models/journalisation'

export interface CreateJournalisationParams {
  module: JournalisationModule
  message: string
  user?: User
}

export interface FindJournalisationsParams {
  offset?: number
  limit?: number
  module?: JournalisationModule
  startDate?: string
  endDate?: string
}
