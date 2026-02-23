import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import CharacterView from '../views/CharacterView.vue';
import AllCharacters from '../views/AllCharacters.vue';
import CreationView from '../views/CreationView.vue';
import SettingsView from '../views/SettingsView.vue';
import ResourcesView from '../views/ResourcesView.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/characters', name: 'characters', component: AllCharacters },
  { path: '/character/:id', name: 'character', component: CharacterView },
  { path: '/create', name: 'create', component: CreationView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/resources', name: 'resources', component: ResourcesView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
