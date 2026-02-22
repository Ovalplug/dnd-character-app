import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CharacterView from '../views/CharacterView.vue'

const routes: Array<RouteRecordRaw> = [
    { path: '/', name: 'home', component: HomeView },
    { path: '/character/:id', name: 'character', component: CharacterView },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})