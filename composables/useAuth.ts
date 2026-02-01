export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const user = useState<any>('user', () => null)
  const employee = useState<any>('employee', () => null)

  const checkSession = async () => {
    const { data: { session } } = await $supabase.auth.getSession()

    if (session?.user) {
      user.value = session.user

      const { data: employeeData } = await $supabase
        .from('employees')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      employee.value = employeeData
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await $supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    user.value = data.user

    const { data: employeeData } = await $supabase
      .from('employees')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle()

    employee.value = employeeData

    return data
  }

  const signOut = async () => {
    await $supabase.auth.signOut()
    user.value = null
    employee.value = null
  }

  return {
    user,
    employee,
    checkSession,
    signIn,
    signOut
  }
}
