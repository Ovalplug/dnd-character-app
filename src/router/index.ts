import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import CharacterView from '../views/CharacterView.vue';
import AllCharacters from '../views/AllCharacters.vue';
import CreationView from '../views/CreationView.vue';
import SettingsView from '../views/SettingsView.vue';
import ResourcesView from '../views/ResourcesView.vue';
import PlaceHolder from '../components/PlaceHolder.vue';
import QuickCharCreate from '../components/creation/QuickCharCreate.vue';
import FullCreation from '../components/creation/FullCreation.vue';
import RandomCreation from '../components/creation/RandomCreation.vue';
import { useDataStore } from '../stores/dataStore';

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/characters', name: 'characters', component: AllCharacters },
  { path: '/character/:id', name: 'character', component: CharacterView },
  { path: '/create', name: 'create', component: CreationView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  { path: '/create/quickCreate', name: 'quickCreate', component: QuickCharCreate },
  { path: '/create/fullCreate', name: 'fullCreate', component: FullCreation, props: route => ({ dataStore: useDataStore() }) },
  { path: '/create/randomCreate', name: 'randomCreate', component: RandomCreation },
  { path: '/create/itemCreate', name: 'itemCreate', component: PlaceHolder },
  { path: '/create/monsterCreate', name: 'monsterCreate', component: PlaceHolder },
  { path: '/create/spellCreate', name: 'spellCreate', component: PlaceHolder },
  { path: '/:pathMatch(.*)*', redirect: '/' }, // catch-all route to redirect to home
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
