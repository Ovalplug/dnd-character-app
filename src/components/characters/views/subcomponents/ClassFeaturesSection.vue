<template>
  <section v-for="cls in character.classes" :key="cls.name" class="ability-section">
    <div class="section-header">
      <h2 class="section-title">{{ cls.name }}</h2>
      <span class="section-badge">Level {{ classLevel(cls) }}</span>
      <span v-if="getActiveSubclass(cls)" class="subclass-pill">
        {{ getActiveSubclass(cls)?.name }}
      </span>
    </div>

    <div class="feature-list">
      <template v-for="lvl in classLevel(cls)" :key="lvl">
        <FeatureCard
          v-for="feat in classOnlyFeatures(cls.classFeatures, lvl)"
          :key="`${cls.name}-${lvl}-${feat.name}`"
          :name="feat.name"
          :tag="`Lvl ${lvl}`"
        >
          <ResourceEntries v-if="feat.entries?.length" :entries="feat.entries" />
        </FeatureCard>

        <template v-if="getActiveSubclass(cls) && lvl >= cls.subclassAtLvl">
          <FeatureCard
            v-for="sFeat in subclassFeaturesAtLevel(getActiveSubclass(cls)!, lvl)"
            :key="`${cls.name}-sub-${lvl}-${sFeat.name}`"
            :name="sFeat.name"
            :tag="`Lvl ${lvl} · ${getActiveSubclass(cls)?.name}`"
            variant="subclass"
          >
            <ResourceEntries v-if="sFeat.entries?.length" :entries="sFeat.entries" />
          </FeatureCard>
        </template>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
  import type { playerCharacter, CharClass, ClassFeatures, ClassFeature, Subclass } from '../../../../types';
  import { getFeaturesForLevel } from '../../../../helperFunctions';
  import ResourceEntries from '../../../resources/ResourceEntries.vue';
  import FeatureCard from './FeatureCard.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function classLevel(cls: CharClass): number {
    return (
      props.character.classLevels[
        cls.name.toLowerCase() as keyof typeof props.character.classLevels
      ] ?? 0
    );
  }

  function classOnlyFeatures(features: ClassFeatures, level: number): ClassFeature[] {
    return getFeaturesForLevel(features, level).filter(f => !f.gainSubclassFeature);
  }

  function getActiveSubclass(cls: CharClass): Subclass | undefined {
    const subs =
      props.character.subclasses?.[cls.name] ??
      props.character.subclasses?.[cls.name.toLowerCase()];
    return subs?.[0];
  }

  function subclassFeaturesAtLevel(subclass: Subclass, level: number): ClassFeature[] {
    if (!subclass.subclassFeatures) return [];
    return getFeaturesForLevel(subclass.subclassFeatures, level);
  }
</script>

<style scoped>
  .ability-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.08);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
  }

  .subclass-pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    background: rgba(201, 164, 75, 0.18);
    color: #7a5d1a;
    border: 1px solid rgba(201, 164, 75, 0.3);
    white-space: nowrap;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
  }
</style>
