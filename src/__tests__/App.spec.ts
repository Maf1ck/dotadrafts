import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import i18n from '../i18n'
import { createPinia } from 'pinia'

describe('App', () => {
  it('mounts renders properly', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [i18n, pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
