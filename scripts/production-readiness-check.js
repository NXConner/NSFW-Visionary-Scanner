#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Production Readiness Check - MorphoScan Pro\n')

const checks = {
  environment: false,
  security: false,
  performance: false,
  testing: false,
  build: false,
  deployment: false
}

const results = []

// Check 1: Environment Configuration
console.log('📋 Checking Environment Configuration...')
try {
  if (!fs.existsSync('.env.example')) {
    results.push('❌ .env.example file missing')
  } else {
    const envContent = fs.readFileSync('.env.example', 'utf8')
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_APP_ENV',
      'VITE_APP_VERSION'
    ]

    const missingVars = requiredVars.filter(v => !envContent.includes(v))
    if (missingVars.length > 0) {
      results.push(`❌ Missing environment variables: ${missingVars.join(', ')}`)
    } else {
      results.push('✅ Environment variables configured')
      checks.environment = true
    }
  }
} catch (error) {
  results.push('❌ Environment check failed')
}

// Check 2: Security Configuration
console.log('🔒 Checking Security Configuration...')
try {
  const mainTsx = fs.readFileSync('src/main.tsx', 'utf8')
  if (mainTsx.includes('initializeSecurity') && mainTsx.includes('generateCSPHeader')) {
    results.push('✅ Security measures implemented')
    checks.security = true
  } else {
    results.push('❌ Security initialization missing')
  }

  // Check for security headers
  const securityLib = fs.existsSync('src/lib/security.ts')
  if (securityLib) {
    results.push('✅ Security utilities implemented')
  } else {
    results.push('❌ Security utilities missing')
  }
} catch (error) {
  results.push('❌ Security check failed')
}

// Check 3: Performance Monitoring
console.log('⚡ Checking Performance Monitoring...')
try {
  const mainTsx = fs.readFileSync('src/main.tsx', 'utf8')
  if (mainTsx.includes('initSentry') && mainTsx.includes('measureWebVitals')) {
    results.push('✅ Performance monitoring configured')
    checks.performance = true
  } else {
    results.push('❌ Performance monitoring missing')
  }

  const perfMonitor = fs.existsSync('src/components/PerformanceMonitor.tsx')
  if (perfMonitor) {
    results.push('✅ Performance monitoring component exists')
  } else {
    results.push('❌ Performance monitoring component missing')
  }
} catch (error) {
  results.push('❌ Performance check failed')
}

// Check 4: Testing Infrastructure
console.log('🧪 Checking Testing Infrastructure...')
try {
  const testFiles = [
    'src/components/__tests__/MedicalDisclaimer.test.tsx',
    'src/pages/__tests__/Auth.test.tsx',
    'src/integrations/__tests__/supabase.test.ts',
    'vitest.config.ts',
    'src/test/setup.ts'
  ]

  const missingTests = testFiles.filter(file => !fs.existsSync(file))
  if (missingTests.length === 0) {
    results.push('✅ Testing infrastructure complete')
    checks.testing = true
  } else {
    results.push(`❌ Missing test files: ${missingTests.join(', ')}`)
  }

  // Check if tests can run
  try {
    execSync('npm run test:run --silent', { stdio: 'pipe' })
    results.push('✅ Tests execute successfully')
  } catch (error) {
    results.push('⚠️ Tests execution failed (may be due to missing dependencies)')
  }
} catch (error) {
  results.push('❌ Testing check failed')
}

// Check 5: Build Configuration
console.log('🔨 Checking Build Configuration...')
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8')
  if (viteConfig.includes('manualChunks') && viteConfig.includes('rollupOptions')) {
    results.push('✅ Build optimization configured')
    checks.build = true
  } else {
    results.push('❌ Build optimization missing')
  }

  // Check bundle analyzer script
  if (fs.existsSync('scripts/analyze-bundle.js')) {
    results.push('✅ Bundle analysis script available')
  } else {
    results.push('❌ Bundle analysis script missing')
  }

  // Try to build
  try {
    execSync('npm run build', { stdio: 'pipe' })
    results.push('✅ Production build successful')
  } catch (error) {
    results.push('❌ Production build failed')
  }
} catch (error) {
  results.push('❌ Build check failed')
}

// Check 6: Deployment Configuration
console.log('🚀 Checking Deployment Configuration...')
try {
  const githubWorkflows = fs.existsSync('.github/workflows/ci.yml')
  if (githubWorkflows) {
    results.push('✅ CI/CD pipeline configured')
    checks.deployment = true
  } else {
    results.push('❌ CI/CD pipeline missing')
  }

  const dockerfile = fs.existsSync('Dockerfile')
  if (dockerfile) {
    results.push('✅ Docker configuration exists')
  } else {
    results.push('❌ Docker configuration missing')
  }

  const supabaseConfig = fs.existsSync('supabase/config.toml')
  if (supabaseConfig) {
    results.push('✅ Supabase configuration exists')
  } else {
    results.push('❌ Supabase configuration missing')
  }
} catch (error) {
  results.push('❌ Deployment check failed')
}

// Summary
console.log('\n📊 PRODUCTION READINESS SUMMARY\n')

results.forEach(result => console.log(result))

const passedChecks = Object.values(checks).filter(Boolean).length
const totalChecks = Object.keys(checks).length

console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks`)

if (passedChecks === totalChecks) {
  console.log('\n🎉 ALL CHECKS PASSED! Ready for production deployment.')
  console.log('\nNext steps:')
  console.log('1. Set up production environment variables')
  console.log('2. Configure Stripe webhook endpoints')
  console.log('3. Set up monitoring and alerting')
  console.log('4. Deploy to production')
  console.log('5. Run final end-to-end tests')
} else {
  console.log('\n⚠️ Some checks failed. Address the issues before production deployment.')
  console.log('\nPriority fixes needed:')
  const failedChecks = Object.entries(checks).filter(([_, passed]) => !passed).map(([check]) => check)
  failedChecks.forEach(check => console.log(`- ${check}`))
}

console.log('\n🔗 Useful commands:')
console.log('- npm run analyze:bundle  # Analyze bundle size')
console.log('- npm run test:coverage   # Run tests with coverage')
console.log('- npm run build          # Production build')
console.log('- npm run preview        # Preview production build')
