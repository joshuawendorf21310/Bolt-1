import { a as useNuxtApp } from "../server.mjs";
import { toRef, isRef } from "vue";
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useAuth = () => {
  const { $supabase } = useNuxtApp();
  const user = useState("user", () => null);
  const employee = useState("employee", () => null);
  const checkSession = async () => {
    const { data: { session } } = await $supabase.auth.getSession();
    if (session?.user) {
      user.value = session.user;
      const { data: employeeData } = await $supabase.from("employees").select("*").eq("user_id", session.user.id).maybeSingle();
      employee.value = employeeData;
    }
  };
  const signIn = async (email, password) => {
    const { data, error } = await $supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    user.value = data.user;
    const { data: employeeData } = await $supabase.from("employees").select("*").eq("user_id", data.user.id).maybeSingle();
    employee.value = employeeData;
    return data;
  };
  const signOut = async () => {
    await $supabase.auth.signOut();
    user.value = null;
    employee.value = null;
  };
  return {
    user,
    employee,
    checkSession,
    signIn,
    signOut
  };
};
export {
  useAuth as u
};
//# sourceMappingURL=useAuth-BbjuGs-d.js.map
