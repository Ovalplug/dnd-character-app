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
import EncounterCreation from '../components/encounters/EncounterCreation.vue';
import EditEncounter from '../components/encounters/EditEncounter.vue';
import EncounterMain from '../components/encounters/EncounterMain.vue';
import LevelUpView from '../views/LevelUpView.vue';
import TrainingGround from '../views/TrainingGround.vue';
import CreateSpellbook from '../components/spellBooks/CreateSpellbook.vue';
import SpellBookView from '../components/spellBooks/SpellBookView.vue';
import CreateBackpack from '../components/items/CreateBackpack.vue';
import BackpackView from '../components/items/BackpackView.vue';
import { useDataStore } from '../stores/dataStore';

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/characters', name: 'characters', component: AllCharacters },
  { path: '/character/:id', name: 'character', component: CharacterView },
  { path: '/character/:id/levelup', name: 'levelUp', component: LevelUpView },
  { path: '/create', name: 'create', component: CreationView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  { path: '/create/quickCreate', name: 'quickCreate', component: QuickCharCreate },
  {
    path: '/create/fullCreate',
    name: 'fullCreate',
    component: FullCreation,
    props: () => ({ dataStore: useDataStore() }),
  },
  { path: '/create/randomCreate', name: 'randomCreate', component: RandomCreation },
  { path: '/create/itemCreate', name: 'itemCreate', component: PlaceHolder },
  { path: '/create/monsterCreate', name: 'monsterCreate', component: PlaceHolder },
  { path: '/create/spellCreate', name: 'spellCreate', component: PlaceHolder },
  { path: '/create/encounter', name: 'encounterCreate', component: EncounterCreation },
  { path: '/create/spellbook', name: 'spellbookCreate', component: CreateSpellbook },
  { path: '/spellbook/:id', name: 'spellbook', component: SpellBookView },
  { path: '/create/backpack', name: 'backpackCreate', component: CreateBackpack },
  { path: '/backpack/:id', name: 'backpack', component: BackpackView },
  { path: '/encounter/edit', name: 'EditEncounter', component: EditEncounter },
  { path: '/encounter/run', name: 'RunEncounter', component: EncounterMain },
  { path: '/training', name: 'trainingGround', component: TrainingGround },
  { path: '/:pathMatch(.*)*', redirect: '/' }, // catch-all route to redirect to home
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
