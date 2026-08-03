import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exchange_rates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('usd_to_cdf_buy_rate', 'exchange_rate')
      table.renameColumn('usd_to_cdf_sell_rate', 'sell_rate')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('exchange_rate', 'usd_to_cdf_buy_rate')
      table.renameColumn('sell_rate', 'usd_to_cdf_sell_rate')
    })
  }
}
