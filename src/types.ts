import type { Component } from 'vue'

export type AppRoute = {
	path: string
	name: string
	component: Component
}

export type Routes = AppRoute[]

