export const usePermissions = () => {
  const { employee } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!employee.value) return false

    const credentials = employee.value.credentials || []
    return credentials.includes(permission)
  }

  const hasRole = (roleName: string): boolean => {
    if (!employee.value) return false

    return employee.value.position?.toLowerCase().includes(roleName.toLowerCase())
  }

  const canAccessModule = (module: string): boolean => {
    if (!employee.value) return false

    const modulePermissions: Record<string, string[]> = {
      cad: ['dispatcher', 'admin', 'supervisor'],
      mdt: ['paramedic', 'emt', 'firefighter', 'admin', 'supervisor'],
      epcr: ['paramedic', 'emt', 'admin', 'supervisor'],
      transport: ['dispatcher', 'admin', 'supervisor'],
      hems: ['pilot', 'flight_medic', 'admin', 'supervisor'],
      fire: ['firefighter', 'fire_chief', 'admin', 'supervisor'],
      scheduling: ['admin', 'supervisor', 'hr'],
      crewlink: ['all'],
      billing: ['billing', 'admin', 'finance'],
      hr: ['hr', 'admin']
    }

    const allowedRoles = modulePermissions[module.toLowerCase()] || []

    if (allowedRoles.includes('all')) return true

    const position = employee.value.position?.toLowerCase() || ''
    return allowedRoles.some(role => position.includes(role))
  }

  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  const isSupervisor = (): boolean => {
    return hasRole('supervisor') || isAdmin()
  }

  return {
    hasPermission,
    hasRole,
    canAccessModule,
    isAdmin,
    isSupervisor
  }
}
