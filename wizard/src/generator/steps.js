/**
 * Build the human-readable post-generation instructions shown to the user
 * after a successful scaffold. Returned as a flat string array; the wizard
 * renders them in a copy-friendly list.
 */
export function buildSteps(config) {
  const steps = []
  const isInertia = config.architecture?.integrationModel === 'inertia'

  // Common installs
  const npmDeps = ['vue-i18n@^11', 'tailwindcss@^4', '@tailwindcss/vite@^4', 'tailwindcss-rtl', 'lucide-vue-next', '@tanstack/vue-table@^8']
  if (config.data?.chartsLibrary === 'echarts') npmDeps.push('echarts@^5')
  else if (config.data?.chartsLibrary === 'chartjs') npmDeps.push('chart.js@^4')
  // Always install both adapters' deps so swapping is a config flip — alternative is also added.
  if (config.data?.chartsLibrary !== 'echarts') npmDeps.push('echarts@^5')
  if (config.data?.chartsLibrary !== 'chartjs') npmDeps.push('chart.js@^4')

  if (isInertia) {
    npmDeps.push('@inertiajs/vue3', '@vitejs/plugin-vue')
  } else {
    npmDeps.push('vue@^3', 'vue-router@^4', 'axios')
  }
  if (config.data?.realTime === 'websockets') npmDeps.push('laravel-echo', 'pusher-js')

  steps.push(`Install Node deps:\n  npm install ${npmDeps.join(' ')}`)

  // Composer
  const composer = []
  if (isInertia) composer.push('inertiajs/inertia-laravel')
  if ((config.architecture?.auth || '').startsWith('sanctum')) composer.push('laravel/sanctum')
  if (config.data?.realTime === 'websockets') composer.push('laravel/reverb')
  if (composer.length) steps.push(`Install Composer deps:\n  composer require ${composer.join(' ')}`)

  if (isInertia) {
    steps.push('Register dashboard routes — add to your `routes/web.php`:\n  require __DIR__.\'/dashboard.php\';')
    steps.push('Wire Inertia in `resources/js/app.js` if you haven\'t already (see https://inertiajs.com/client-side-setup).')
  } else {
    steps.push('Mount the SPA — in your `src/main.js`:\n  import router from \'./router.js\'\n  app.use(router)')
  }

  if ((config.architecture?.auth || '').startsWith('sanctum')) {
    steps.push('Publish + migrate Sanctum:\n  php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"\n  php artisan migrate')
  }
  if (config.architecture?.auth === 'sanctum-cookie') {
    steps.push(`Set in .env:\n  SANCTUM_STATEFUL_DOMAINS=${config.identity?.domain || 'your.domain'}\n  SESSION_DOMAIN=.${config.identity?.domain || 'your.domain'}`)
  }

  if (config.data?.realTime === 'websockets') {
    steps.push('Configure Reverb:\n  php artisan reverb:install\n  php artisan reverb:start')
  }

  // Fonts
  const fonts = [config.brand?.fontLatin, config.brand?.fontArabic].filter(Boolean)
  if (config.brand?.fontHosting === 'self' && fonts.length) {
    steps.push(`Self-host fonts: download ${fonts.join(', ')} from a licensed source and place in \`public/fonts/\`. Update \`tokens.css\` font-family stacks if needed.`)
  } else if (fonts.length) {
    steps.push(`Add to your <head>:\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts[0]).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">`)
  }

  // i18n
  steps.push(`Wire i18n in your app entry:\n  import { i18n } from '@/i18n/index.js'\n  app.use(i18n)`)

  // Build
  steps.push('Build assets:\n  npm run build')

  if (config.architecture?.multiTenant) {
    steps.push(`Multi-tenant: AppLayout has \`data-tenant-strategy="${config.architecture.tenancyStrategy || 'path'}"\`. Implement actual tenancy in your host app (route binding, scopes, middleware).`)
  }

  steps.push('Re-run the wizard anytime — `php artisan dashboard:scaffold` reads `dashboard.config.json` and re-generates with your latest choices.')

  return steps
}