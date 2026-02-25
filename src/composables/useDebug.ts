import { ref } from 'vue';
import { getDebugSetting as dbGet, setDebugSetting as dbSet } from '../database/db';

const debug = ref(false);
let initialized = false;

export async function initDebug() {
  if (initialized) return;
  try {
    debug.value = await dbGet();
  } catch (e) {
    debug.value = false;
  }
  initialized = true;
}

export async function setDebug(v: boolean) {
  debug.value = v;
  try {
    await dbSet(v);
  } catch (e) {
    // ignore persistence errors for now
  }
}

export function useDebug() {
  return { debug, initDebug, setDebug };
}
