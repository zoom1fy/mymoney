// Class pattern reuses the /me prefix so all dashboard routes stay under the same base
class Dashboard {
  private root = '/me'

  HOME = this.root
  SETTINGS = this.root + '/settings'
  AUTH = '/auth'
}

export const dashboardPages = new Dashboard()
