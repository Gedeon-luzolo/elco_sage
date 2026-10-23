import { configApp } from '@adonisjs/eslint-config'

// Le frontend (web/) a son propre outillage.
export default configApp({ ignores: ['web/**'] })
