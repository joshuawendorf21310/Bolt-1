<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="logo-text">FUSION</span><span class="logo-accent">EMS</span>
          <span class="logo-quantum">QUANTUM</span>
        </div>
        <p>Next-Generation Emergency Operations Platform</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signIn } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await signIn(email.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Failed to sign in'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at top, #1a1a1a 0%, #000000 100%);
  background-image:
    radial-gradient(ellipse at top, #1a1a1a 0%, #000000 100%),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 107, 0, 0.03) 2px, rgba(255, 107, 0, 0.03) 4px);
  padding: var(--spacing-4);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 107, 0, 0.1) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.login-card {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 107, 0, 0.1);
  padding: var(--spacing-10);
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.logo {
  margin-bottom: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(255, 107, 0, 0.5);
}

.logo-accent {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-primary-500);
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(255, 107, 0, 0.8);
}

.logo-quantum {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-error-500);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-top: var(--spacing-1);
}

.login-header p {
  color: var(--color-gray-400);
  font-size: 0.875rem;
  font-weight: 300;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.error-message {
  padding: var(--spacing-3);
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid var(--color-error-500);
  color: var(--color-error-500);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
}

.btn-lg {
  width: 100%;
  margin-top: var(--spacing-4);
}
</style>
