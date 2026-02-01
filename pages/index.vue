<template>
  <div class="landing">
    <nav class="navbar">
      <div class="container">
        <div class="logo">
          <span class="logo-main">FusionEMS</span>
        </div>
        <div class="nav-links">
          <NuxtLink to="/login" class="btn-primary">Sign In</NuxtLink>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Emergency Medical Services Management Platform</h1>
          <p class="hero-subtitle">
            Complete EMS operations software for dispatch, patient care, billing, and fire services
          </p>
          <div class="hero-actions">
            <NuxtLink to="/login" class="btn-primary btn-lg">Get Started</NuxtLink>
            <NuxtLink to="/dashboard" class="btn-secondary btn-lg">View Demo</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2>Complete Platform</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚨</div>
            <h3>CAD / Dispatch</h3>
            <p>Real-time call management and unit tracking</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏥</div>
            <h3>Patient Care (ePCR)</h3>
            <p>Complete electronic patient care reporting</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>Billing & Revenue</h3>
            <p>Automated insurance verification and claims</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚒</div>
            <h3>Fire Operations</h3>
            <p>Incident command and personnel management</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 FusionEMS. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
}

.navbar {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 107, 0, 0.2);
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-main {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Orbitron', sans-serif;
  color: #FF6B00;
}

.hero {
  padding: 8rem 0 6rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #FF6B00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #9ca3af;
  margin-bottom: 3rem;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  padding: 6rem 0;
  background: rgba(255, 107, 0, 0.03);
}

.features h2 {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 4rem;
  color: #ffffff;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(255, 107, 0, 0.05);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 107, 0, 0.1);
  border-color: rgba(255, 107, 0, 0.4);
  transform: translateY(-8px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.feature-card p {
  color: #9ca3af;
  line-height: 1.6;
}

.footer {
  background: #000000;
  border-top: 1px solid rgba(255, 107, 0, 0.2);
  padding: 3rem 0;
  text-align: center;
}

.footer p {
  color: #6b7280;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features h2 {
    font-size: 2rem;
  }
}
</style>
