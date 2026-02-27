import type { Component } from 'vue';

export type AppRoute = {
  path: string;
  name: string;
  component: Component;
};

export type Routes = AppRoute[];

export type Feat = {
  name: string;
  description?: string;
  source?: string;
  otherSources?: object[];
  level?: number;
  page?: number;
  prerequisite?: string[];
  entries?: Entries;
};

export type EntryBase = {
  type: string;
  name?: string;
  style?: string;
  entries?: Entry[];
  items?: Entry[];
};

export type EntryItem = {
  type: 'item';
  name?: string;
  entries: Entry[];
};

export type EntryList = {
  type: 'list';
  style?: string;
  items: (EntryItem | string)[];
  entries?: Entry[];
};

export type EntryTable = {
  type: 'table';
  caption?: string;
  head?: string[];
  rows: (string[] | Entry[])[];
  entries?: Entry[];
  colStyles?: string[];
  colLabels?: string[];
};

export type EntrySection = {
  type: 'section';
  title?: string;
  entries?: Entry[];
};

export type Entry = string | EntryItem | EntryList | EntryTable | EntrySection;

export type Entries = Entry[];

export type Feats = Feat[];

export type Ability = Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;

export type LanguageProficiency = Record<string, boolean | number>;

export type SkillProficiencies = Record<string, boolean>;

export type ImageHref = {
  type: string;
  path?: string;
  href?: string;
};

export type Image = {
  type: 'image';
  href: ImageHref;
  title?: string;
};

export type Race = {
  name: string;
  source?: string;
  page?: number;
  size?: string;
  speed?: number;
  ability?: Ability[] | Ability;
  traitTags?: string[];
  languageProficiencies?: LanguageProficiency[];
  skillProficiencies?: SkillProficiencies[];
  entries?: Entries;
  images?: Image[];
};

export type Races = Race[];

export type RaceFluff = {
  name: string;
  source?: string;
  entries?: Entries;
  images?: Image[];
};

export type RaceFluffs = RaceFluff[];
