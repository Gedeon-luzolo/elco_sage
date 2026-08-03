import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'categories/product_categories_page': ExtractProps<(typeof import('../../inertia/pages/categories/product_categories_page.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'journalisations/journalisations_page': ExtractProps<(typeof import('../../inertia/pages/journalisations/journalisations_page.tsx'))['default']>
    'management': ExtractProps<(typeof import('../../inertia/pages/management.tsx'))['default']>
    'rates/rates_page': ExtractProps<(typeof import('../../inertia/pages/rates/rates_page.tsx'))['default']>
    'splash': ExtractProps<(typeof import('../../inertia/pages/splash.tsx'))['default']>
    'users/users_page': ExtractProps<(typeof import('../../inertia/pages/users/users_page.tsx'))['default']>
    'products/product_services_page': ExtractProps<(typeof import('../../inertia/pages/products/product_services_page.tsx'))['default']>
  }
}
