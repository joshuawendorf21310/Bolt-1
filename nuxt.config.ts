// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY
    }
  },

  app: {
    head: {
      title: 'FusionEMS Quantum',
      meta: [
        { name: 'description', content: 'Next-generation unified emergency operations platform' },
        { name: 'theme-color', content: '#FF6B00' }
      ]
    }
  }
})
