<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <div class="logo" @click="navigateTo('/dashboard')">
          <span class="logo-text">FUSION</span><span class="logo-accent">EMS</span>
          <span class="logo-quantum">QUANTUM</span>
        </div>

        <nav class="nav-menu">
          <NuxtLink to="/dashboard" class="nav-link">
            <span class="nav-icon">📊</span>
            Dashboard
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('cad')" to="/cad" class="nav-link">
            <span class="nav-icon">🚨</span>
            CAD
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('mdt')" to="/mdt" class="nav-link">
            <span class="nav-icon">📱</span>
            MDT
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('epcr')" to="/epcr" class="nav-link">
            <span class="nav-icon">📋</span>
            ePCR
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('transport')" to="/transport" class="nav-link">
            <span class="nav-icon">🚑</span>
            Transport
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('hems')" to="/hems" class="nav-link">
            <span class="nav-icon">🚁</span>
            HEMS
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('fire')" to="/fire" class="nav-link">
            <span class="nav-icon">🔥</span>
            Fire
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('scheduling')" to="/scheduling" class="nav-link">
            <span class="nav-icon">📅</span>
            Schedule
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('billing')" to="/billing" class="nav-link">
            <span class="nav-icon">💰</span>
            Billing
          </NuxtLink>

          <NuxtLink v-if="canAccessModule('hr')" to="/hr" class="nav-link">
            <span class="nav-icon">👥</span>
            HR
          </NuxtLink>
        </nav>

        <div class="header-actions">
          <div class="user-info">
            <span class="user-name">{{ employee?.first_name }} {{ employee?.last_name }}</span>
            <span class="user-role">{{ employee?.position }}</span>
          </div>
          <button @click="handleSignOut" class="btn btn-secondary btn-sm">Sign Out</button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { signOut, employee } = useAuth()
const { canAccessModule } = usePermissions()
const router = useRouter()

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-dark-600);
}

.app-header {
  background: var(--color-dark-400);
  border-bottom: 2px solid var(--color-primary-500);
  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: var(--spacing-4) var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.logo-accent {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  color: #FF6B00;
  letter-spacing: 0.05em;
}

.logo-quantum {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.5rem;
  font-weight: 600;
  color: #DC2626;
  letter-spacing: 0.2em;
  margin-left: 0.25rem;
  align-self: flex-start;
}

.nav-menu {
  display: flex;
  gap: var(--spacing-1);
  flex: 1;
  flex-wrap: wrap;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  color: var(--color-gray-400);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
}

.nav-icon {
  font-size: 1.125rem;
}

.nav-link:hover {
  color: var(--color-primary-500);
  background: rgba(255, 107, 0, 0.1);
}

.nav-link.router-link-active {
  color: var(--color-primary-500);
  background: rgba(255, 107, 0, 0.15);
  border-bottom: 2px solid var(--color-primary-500);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.875rem;
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  text-transform: capitalize;
}

.app-main {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .nav-menu {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: var(--spacing-3) var(--spacing-4);
    gap: var(--spacing-3);
  }

  .user-info {
    display: none;
  }
}
</style>
