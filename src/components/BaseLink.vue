<template>
  <component
    :is="linkComponent"
    :to="to"
    :href="href"
    class="link"
    :target="target"
  >
    <base-text :variant="textVariant">
      <slot />
    </base-text>
  </component>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'BaseLink',
  props: {
    href: VueTypes.string,
    textVariant: VueTypes.string.def('body'),
    to: VueTypes.string,
    target: VueTypes.string,
  },
  computed: {
    linkComponent() {
      return this.to ? 'router-link' : 'a';
    },
  },
};
</script>

<style scoped lang="scss">
.link {
  @apply text-primary-dark;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
}
</style>
