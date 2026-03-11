<template>
  <div class="prerequisites-parchment">
    <p>Prerequisites:</p>
    <div v-if="formattedPrerequisites.length">
      <ul>
        <li v-for="(item, idx) in formattedPrerequisites" :key="idx">
          {{ item }}
        </li>
      </ul>
    </div>
    <div v-else>
      <em>None</em>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import type { Prerequisites } from '../../types';
  import { computed } from 'vue';

  const props = defineProps<{
    prerequisites: Prerequisites;
  }>();

  // Format prerequisites for display
  const formattedPrerequisites = computed(() => {
    if (!Array.isArray(props.prerequisites)) return [];

    // Collect class requirements separately
    const classReqs: string[] = [];
    const otherReqs: string[] = [];

    props.prerequisites.forEach(prereq => {
      // Handle class requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'class' in prereq &&
        typeof prereq.class === 'object'
      ) {
        const cls = prereq.class as { name?: string; level?: number };
        // Check for prereqLevel type
        if (
          'type' in prereq &&
          (prereq as { type?: string }).type === 'prereqLevel' &&
          'level' in prereq
        ) {
          const level = (prereq as { level?: number }).level;
          if (level) {
            classReqs.push(`Level ${level}`);
            return;
          }
          otherReqs.push('Level requirement');
        }
        if (cls.name && cls.level) {
          classReqs.push(`${cls.name} (Level ${cls.level})`);
        } else if (cls.name) {
          classReqs.push(cls.name);
        } else {
          classReqs.push('Class requirement');
        }
        return;
      }
      //Handle ability score requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'ability' in prereq &&
        Array.isArray(prereq.ability)
      ) {
        const abilities = prereq.ability
          .map((ability: Record<string, number>) => {
            const [key, value] = Object.entries(ability)[0] || [];
            if (key && value) {
              return `${key.charAt(0).toUpperCase() + key.slice(1)} ${value}`;
            }
            return null;
          })
          .filter(Boolean);

        if (abilities.length) {
          otherReqs.push(abilities.join(', '));
        } else {
          otherReqs.push('Ability score requirement');
        }
        return;
      }
      // Handle race requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'race' in prereq &&
        Array.isArray(prereq.race)
      ) {
        const races = prereq.race.map((race: { name?: string }) => race.name).filter(Boolean);
        if (races.length) {
          otherReqs.push(`Race: ${races.join(', ')}`);
        } else {
          otherReqs.push('Race requirement');
        }
        return;
      }
      // Handle pact requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'type' in prereq &&
        (prereq as { type?: string }).type === 'prereqPact' &&
        'entry' in prereq
      ) {
        const pactEntry = (prereq as { entry?: string }).entry;
        if (pactEntry) {
          otherReqs.push(`Pact of the ${pactEntry}`);
        } else {
          otherReqs.push('Pact requirement');
        }
        return;
      }
      // Handle level requirements without class
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'type' in prereq &&
        (prereq as { type?: string }).type === 'prereqLevel' &&
        'level' in prereq
      ) {
        const level = (prereq as { level?: number }).level;
        if (level) {
          otherReqs.push(`Level ${level}`);
        } else {
          otherReqs.push('Level requirement');
        }
        return;
      }
      // Handle special requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'type' in prereq &&
        (prereq as { type?: string }).type === 'prereqSpecial' &&
        ('entry' in prereq || 'entrySummary' in prereq)
      ) {
        const entry = (prereq as { entry?: string; entrySummary?: string }).entry;
        const entrySummary = (prereq as { entry?: string; entrySummary?: string }).entrySummary;
        if (entrySummary) {
          otherReqs.push(entrySummary);
        } else if (entry) {
          otherReqs.push(entry);
        } else {
          otherReqs.push('Special requirement');
        }
        return;
      }
      // Handle item requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'type' in prereq &&
        (prereq as { type?: string }).type === 'prereqItem' &&
        'entries' in prereq &&
        Array.isArray((prereq as { entries?: string[] }).entries)
      ) {
        const entriesArr = (prereq as { entries?: string[] }).entries ?? [];
        otherReqs.push(entriesArr.join(', '));
        return;
      }
      // Handle spellcasting: true
      if (typeof prereq === 'object' && prereq !== null) {
        if ('spellcasting' in prereq && prereq.spellcasting === true) {
          otherReqs.push('Spellcasting');
          return;
        }
        if ('background' in prereq && typeof prereq.background === 'object') {
          const bg = prereq.background as { displayEntry?: string; name?: string };
          otherReqs.push(bg.displayEntry || bg.name || 'Background');
          return;
        }
        if ('proficiency' in prereq && Array.isArray(prereq.proficiency)) {
          otherReqs.push(
            prereq.proficiency
              .map((prof: Record<string, string>) => {
                if ('weapon' in prof) {
                  return `${prof.weapon.charAt(0).toUpperCase() + prof.weapon.slice(1)} weapons`;
                }
                return Object.entries(prof)
                  .map(
                    ([key, value]) =>
                      `${value.charAt(0).toUpperCase() + value.slice(1)} ${
                        key.charAt(0).toUpperCase() + key.slice(1)
                      }s`
                  )
                  .join(', ');
              })
              .join('; ')
          );
          return;
        }
        // Only render generic object formatting if not a known type
        if (!('type' in prereq)) {
          otherReqs.push(
            Object.entries(prereq)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          );
          return;
        }
      }
      // Handle spell requirements
      if (
        typeof prereq === 'object' &&
        prereq !== null &&
        'type' in prereq &&
        (prereq as { type?: string }).type === 'prereqSpell' &&
        'entries' in prereq &&
        Array.isArray((prereq as { entries?: string[] }).entries)
      ) {
        const entriesArr = (prereq as { entries?: string[] }).entries ?? [];
        otherReqs.push('Spell: ' + entriesArr.join(', '));
        return;
      }
      otherReqs.push(String(prereq));
    });

    // Combine class requirements with 'or' if more than one
    let classReqStr = '';
    if (classReqs.length === 1) {
      classReqStr = classReqs[0] ?? '';
    } else if (classReqs.length > 1) {
      classReqStr =
        classReqs.slice(0, -1).join(' or ') + ' or ' + (classReqs[classReqs.length - 1] ?? '');
    }

    // Return combined array
    return [...(classReqStr ? [classReqStr] : []), ...otherReqs];
  });
</script>

<style scoped>
  .prerequisites-parchment {
    background: linear-gradient(135deg, #f5e6c2 0%, #e9d7b1 100%);
    border: 1px solid #d2b48c;
    border-radius: 8px;
    padding: 0.5em 0.8em;
    margin: 0.4em 0;
    font-size: 0.85em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    color: #5a4632;
    font-family: 'Georgia', 'Times New Roman', serif;
  }
  .prerequisites-parchment ul {
    margin: 0.1em 0 0 0;
    padding-left: 0.8em;
    list-style: none;
  }
  .prerequisites-parchment li {
    margin-bottom: 0.08em;
    position: relative;
    padding-left: 1.1em;
  }
  .prerequisites-parchment li::before {
    content: '\2192'; /* Unicode right arrow */
    position: absolute;
    left: 0;
    top: 0.1em;
    font-size: 0.95em;
    color: #a67c52;
    font-family: 'Georgia', 'Times New Roman', serif;
  }
  .prerequisites-parchment p {
    font-weight: bold;
    margin-bottom: 0.2em;
    font-size: 1em;
    letter-spacing: 0.02em;
  }
  .prerequisites-parchment em {
    color: #a67c52;
  }
</style>
