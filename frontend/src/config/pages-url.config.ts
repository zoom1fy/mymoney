// Class pattern reuses the /me prefix so all dashboard routes stay under the same base
class DASHBOARD {
  private root = '/me'

  HOME = this.root
  SETTINGS = this.root + '/settings'
  AUTH = '/auth'
}

export const DASHBOARD_PAGES = new DASHBOARD()
