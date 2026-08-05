import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import CashSessionService from '#services/sales/cash_session_service'
import CashSessionTransformer from '#transformers/cash_session_transformer'
import ExchangeRateService from '#services/exchange_rates/exchange_rate_service'
import ExchangeRateTransformer from '#transformers/exchange_rate_transformer'
import UserTransformer from '#transformers/user_transformer'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

const exchangeRateService = new ExchangeRateService()
const cashSessionService = new CashSessionService()

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { session, auth } = ctx as Partial<HttpContext>

    /**
     * Fetching the first error from the flash messages
     */
    const error = session?.flashMessages.get('error') as string
    const success = session?.flashMessages.get('success') as string
    const exchangeRate = auth?.user ? await exchangeRateService.getCurrentRate() : null
    const currentCashSession = auth?.user
      ? await cashSessionService.getOpenSessionForUser(auth.user.id)
      : null

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error,
        success,
      }),
      user: ctx.inertia.always(auth?.user ? UserTransformer.transform(auth.user) : undefined),
      exchangeRate: ctx.inertia.always(
        exchangeRate ? ExchangeRateTransformer.transform(exchangeRate) : undefined
      ),
      currentCashSession: ctx.inertia.always(
        currentCashSession ? CashSessionTransformer.transformSingle(currentCashSession) : undefined
      ),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
