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
  level?: number;
  prerequisite?: string[];
};

export type Feats = Feat[];
