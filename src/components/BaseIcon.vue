<template>
  <div
    :class="`flex items-center base-icon ${iconSelector} ${
      withText ? 'with-text' : ''
    } `"
  >
    <img
      v-if="!fa"
      :class="styles"
      :src="iconMap[type]"
      :alt="alt"
      :title="alt"
    />
    <font-awesome-icon
      v-else
      :class="[styles]"
      :icon="type"
      :alt="alt"
      :title="alt"
      :size="size"
    />
    <slot></slot>
  </div>
</template>

<script>
/* eslint-disable global-require */
import { kebabCase } from 'lodash';
import VueTypes from 'vue-types';
import { ICON_MAP, ICONS, ICON_SIZES } from '@/constants';

export default {
  name: 'BaseIcon',
  props: {
    type: VueTypes.oneOfType([
      VueTypes.oneOf(Object.values(ICONS)),
      VueTypes.string,
    ]),
    fa: VueTypes.bool.def(false),
    alt: VueTypes.string,
    size: VueTypes.oneOf(ICON_SIZES).def('large'),
    selector: VueTypes.string,
    withText: VueTypes.bool.def(false),
    invertColor: VueTypes.bool.def(false),
  },
  data() {
    return {
      iconMap: ICON_MAP,
      styles: {
        'ccu-icon': true,
        'cursor-pointer': true,
        large: ['lg', 'large'].includes(this.size),
        medium: ['md', 'medium'].includes(this.size),
        small: ['sm', 'small'].includes(this.size),
        xs: this.size === 'xs',
        xxs: this.size === 'xxs',
        xl: this.size === 'xl',
        text: this.withText === true,
        inverted: this.invertColor === true,
      },
    };
  },
  computed: {
    iconSelector() {
      return this.selector || `js-${kebabCase(this.alt)}`;
    },
  },
};
</script>

<style scoped>
.ccu-icon {
  height: 30px;
  width: 30px;
}
.ccu-icon.medium {
  height: 20px;
  width: 20px;
}
.ccu-icon.xl {
  height: 35px;
  width: 35px;
}
.ccu-icon.small {
  height: 16px;
  width: 16px;
}
.ccu-icon.xs {
  height: 10px;
  width: 10px;
}

.ccu-icon.xxs {
  height: 7px;
  width: 7px;
}

.ccu-icon.inverted {
  filter: brightness(0) invert(1);
}

.base-icon.with-text p {
  @apply pl-2;
}

.filter-gray {
  filter: invert(84%) sepia(0%) saturate(30%) hue-rotate(209deg)
    brightness(107%) contrast(90%);
}
.filter-yellow {
  filter: invert(92%) sepia(21%) saturate(3995%) hue-rotate(346deg)
    brightness(98%) contrast(106%);
}
</style>
