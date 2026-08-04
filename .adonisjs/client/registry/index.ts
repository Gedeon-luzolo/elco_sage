/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'splash': {
    methods: ["GET","HEAD"],
    pattern: '/splash',
    tokens: [{"old":"/splash","type":0,"val":"splash","end":""}],
    types: placeholder as Registry['splash']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'auth.verify_password': {
    methods: ["POST"],
    pattern: '/auth/verify-password',
    tokens: [{"old":"/auth/verify-password","type":0,"val":"auth","end":""},{"old":"/auth/verify-password","type":0,"val":"verify-password","end":""}],
    types: placeholder as Registry['auth.verify_password']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'stock_movements.index': {
    methods: ["GET","HEAD"],
    pattern: '/stock',
    tokens: [{"old":"/stock","type":0,"val":"stock","end":""}],
    types: placeholder as Registry['stock_movements.index']['types'],
  },
  'stock_movements.store': {
    methods: ["POST"],
    pattern: '/stock/movements',
    tokens: [{"old":"/stock/movements","type":0,"val":"stock","end":""},{"old":"/stock/movements","type":0,"val":"movements","end":""}],
    types: placeholder as Registry['stock_movements.store']['types'],
  },
  'stock_movements.validate_physical': {
    methods: ["POST"],
    pattern: '/stock/validate-physical',
    tokens: [{"old":"/stock/validate-physical","type":0,"val":"stock","end":""},{"old":"/stock/validate-physical","type":0,"val":"validate-physical","end":""}],
    types: placeholder as Registry['stock_movements.validate_physical']['types'],
  },
  'management': {
    methods: ["GET","HEAD"],
    pattern: '/management',
    tokens: [{"old":"/management","type":0,"val":"management","end":""}],
    types: placeholder as Registry['management']['types'],
  },
  'journalisations.get_journalisations': {
    methods: ["GET","HEAD"],
    pattern: '/management/journalisations',
    tokens: [{"old":"/management/journalisations","type":0,"val":"management","end":""},{"old":"/management/journalisations","type":0,"val":"journalisations","end":""}],
    types: placeholder as Registry['journalisations.get_journalisations']['types'],
  },
  'users.get': {
    methods: ["GET","HEAD"],
    pattern: '/management/users',
    tokens: [{"old":"/management/users","type":0,"val":"management","end":""},{"old":"/management/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.get']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/management/users',
    tokens: [{"old":"/management/users","type":0,"val":"management","end":""},{"old":"/management/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.update': {
    methods: ["PUT"],
    pattern: '/management/users/:id',
    tokens: [{"old":"/management/users/:id","type":0,"val":"management","end":""},{"old":"/management/users/:id","type":0,"val":"users","end":""},{"old":"/management/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.update']['types'],
  },
  'users.destroy': {
    methods: ["DELETE"],
    pattern: '/management/users/:id',
    tokens: [{"old":"/management/users/:id","type":0,"val":"management","end":""},{"old":"/management/users/:id","type":0,"val":"users","end":""},{"old":"/management/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.destroy']['types'],
  },
  'exchange_rates.get': {
    methods: ["GET","HEAD"],
    pattern: '/management/rates',
    tokens: [{"old":"/management/rates","type":0,"val":"management","end":""},{"old":"/management/rates","type":0,"val":"rates","end":""}],
    types: placeholder as Registry['exchange_rates.get']['types'],
  },
  'exchange_rates.store': {
    methods: ["POST"],
    pattern: '/management/rates',
    tokens: [{"old":"/management/rates","type":0,"val":"management","end":""},{"old":"/management/rates","type":0,"val":"rates","end":""}],
    types: placeholder as Registry['exchange_rates.store']['types'],
  },
  'product_categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/management/product-categories',
    tokens: [{"old":"/management/product-categories","type":0,"val":"management","end":""},{"old":"/management/product-categories","type":0,"val":"product-categories","end":""}],
    types: placeholder as Registry['product_categories.index']['types'],
  },
  'product_categories.store': {
    methods: ["POST"],
    pattern: '/management/product-categories',
    tokens: [{"old":"/management/product-categories","type":0,"val":"management","end":""},{"old":"/management/product-categories","type":0,"val":"product-categories","end":""}],
    types: placeholder as Registry['product_categories.store']['types'],
  },
  'product_categories.update': {
    methods: ["PUT"],
    pattern: '/management/product-categories/:id',
    tokens: [{"old":"/management/product-categories/:id","type":0,"val":"management","end":""},{"old":"/management/product-categories/:id","type":0,"val":"product-categories","end":""},{"old":"/management/product-categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['product_categories.update']['types'],
  },
  'product_categories.destroy': {
    methods: ["DELETE"],
    pattern: '/management/product-categories/:id',
    tokens: [{"old":"/management/product-categories/:id","type":0,"val":"management","end":""},{"old":"/management/product-categories/:id","type":0,"val":"product-categories","end":""},{"old":"/management/product-categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['product_categories.destroy']['types'],
  },
  'product_services.index': {
    methods: ["GET","HEAD"],
    pattern: '/management/product-services',
    tokens: [{"old":"/management/product-services","type":0,"val":"management","end":""},{"old":"/management/product-services","type":0,"val":"product-services","end":""}],
    types: placeholder as Registry['product_services.index']['types'],
  },
  'product_services.store': {
    methods: ["POST"],
    pattern: '/management/product-services',
    tokens: [{"old":"/management/product-services","type":0,"val":"management","end":""},{"old":"/management/product-services","type":0,"val":"product-services","end":""}],
    types: placeholder as Registry['product_services.store']['types'],
  },
  'product_services.update': {
    methods: ["PUT"],
    pattern: '/management/product-services/:id',
    tokens: [{"old":"/management/product-services/:id","type":0,"val":"management","end":""},{"old":"/management/product-services/:id","type":0,"val":"product-services","end":""},{"old":"/management/product-services/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['product_services.update']['types'],
  },
  'product_services.destroy': {
    methods: ["DELETE"],
    pattern: '/management/product-services/:id',
    tokens: [{"old":"/management/product-services/:id","type":0,"val":"management","end":""},{"old":"/management/product-services/:id","type":0,"val":"product-services","end":""},{"old":"/management/product-services/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['product_services.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
