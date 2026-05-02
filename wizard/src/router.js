import { createRouter, createWebHashHistory } from 'vue-router'

import Step1Identity from './steps/Step1Identity.vue'
import Step2Language from './steps/Step2Language.vue'
import Step3Brand from './steps/Step3Brand.vue'
import Step4Visual from './steps/Step4Visual.vue'
import Step5Architecture from './steps/Step5Architecture.vue'
import Step6Data from './steps/Step6Data.vue'
import Step7Operational from './steps/Step7Operational.vue'
import Review from './steps/Review.vue'

export const stepDefinitions = [
  { index: 1, key: 'identity', path: '/step/1', name: 'Identity & Purpose', component: Step1Identity },
  { index: 2, key: 'language', path: '/step/2', name: 'Language & Direction', component: Step2Language },
  { index: 3, key: 'brand', path: '/step/3', name: 'Brand Tokens', component: Step3Brand },
  { index: 4, key: 'visual', path: '/step/4', name: 'Visual Language', component: Step4Visual },
  { index: 5, key: 'architecture', path: '/step/5', name: 'Architecture', component: Step5Architecture },
  { index: 6, key: 'data', path: '/step/6', name: 'Data & Visualization', component: Step6Data },
  { index: 7, key: 'operational', path: '/step/7', name: 'Operational', component: Step7Operational },
  { index: 8, key: 'review', path: '/review', name: 'Review', component: Review },
]

const routes = [
  { path: '/', redirect: '/step/1' },
  ...stepDefinitions.map((s) => ({
    path: s.path,
    name: s.key,
    component: s.component,
    meta: { stepIndex: s.index, stepName: s.name },
  })),
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router