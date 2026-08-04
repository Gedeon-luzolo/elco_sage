import User, { UserRole, UserStatus } from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class AdminSeeder extends BaseSeeder {
  /**
   * Cree ou met a jour le compte administrateur initial.
   * Le seed reste idempotent grace a updateOrCreate.
   * Ce compte sert au premier acces apres migration.
   */
  async run() {
    // L'email est la cle stable pour eviter les doublons au prochain seed.
    await User.updateOrCreate(
      { email: 'admin@gmail.com' },
      {
        fullName: 'Administrateur Elco Sage',
        email: 'admin@gmail.com',
        password: '12345678',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
      }
    )
  }
}
