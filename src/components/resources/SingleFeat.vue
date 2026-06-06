<template>
  <div>
    <p v-if="featMeta" class="source-line">{{ featMeta }}</p>
    <Prerequisites v-if="prerequisitesData.length" :prerequisites="prerequisitesData" />
    <ResourceEntries v-if="renderedEntries.length" :entries="renderedEntries" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type {
    Ability,
    ChooseAbilityBonus,
    Entries,
    Feat,
    Prerequisite,
    Prerequisites as FeatPrerequisites,
  } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';
  import Prerequisites from './Prerequisites.vue';

  const ABILITY_LABELS = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  } as const;

  const props = defineProps<{
    feat: Feat;
  }>();

  const featMeta = computed(() => {
    const parts: string[] = [];
    if (props.feat.source) parts.push(`Source: ${props.feat.source}`);
    if (props.feat.page) parts.push(`p. ${props.feat.page}`);
    return parts.join(' — ');
  });

  const featEntries = computed<Entries>(() => props.feat.entries ?? []);
  const abilityEntries = computed<Entries>(() => formatAbilityEntries(props.feat.ability));
  const renderedEntries = computed<Entries>(() => [...abilityEntries.value, ...featEntries.value]);

  const prerequisitesData = computed<FeatPrerequisites>(() =>
    (props.feat.prerequisite ?? []).map(normalizePrerequisite)
  );

  function normalizePrerequisite(prerequisite: Prerequisite): Exclude<Prerequisite, string> {
    return typeof prerequisite === 'string'
      ? { type: 'prerequisite', feat: prerequisite }
      : prerequisite;
  }

  function formatAbilityEntries(ability: Feat['ability']): Entries {
    if (!ability) return [];

    const bonuses = Array.isArray(ability) ? ability : [ability];
    return bonuses.flatMap(formatAbilityBonus).filter((entry): entry is string => !!entry);
  }

  function formatAbilityBonus(bonus: Ability): string[] {
    if ('choose' in bonus) {
      return [formatChooseAbilityBonus(bonus)];
    }

    return Object.entries(bonus)
      .filter(([, value]) => typeof value === 'number')
      .map(([abilityName, value]) => {
        const label = formatAbilityName(abilityName);
        return `Increase your ${label} score by ${value}, to a maximum of 20.`;
      });
  }

  function formatChooseAbilityBonus(bonus: ChooseAbilityBonus): string {
    const { choose } = bonus;
    if (choose.entry) return choose.entry;

    const amount = choose.amount ?? choose.count ?? 1;
    const labels = choose.from.map(formatAbilityName);

    if (labels.length === 1) {
      return `Increase your ${labels[0]} score by ${amount}, to a maximum of 20.`;
    }

    const target =
      labels.length === 6
        ? `${amount === 1 ? 'one ability score' : `${amount} ability scores`} of your choice`
        : `${amount === 1 ? 'one of' : `${amount} of`} your ${joinWithOr(labels)} scores`;

    return `Increase ${target} by ${amount}, to a maximum of 20.`;
  }

  function formatAbilityName(abilityName: string): string {
    return ABILITY_LABELS[abilityName as keyof typeof ABILITY_LABELS] ?? abilityName;
  }

  function joinWithOr(values: string[]): string {
    if (values.length <= 1) return values[0] ?? '';
    if (values.length === 2) return `${values[0]} or ${values[1]}`;

    return `${values.slice(0, -1).join(', ')}, or ${values[values.length - 1]}`;
  }
</script>

<style scoped>
  .source-line {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--color-muted);
  }
</style>
