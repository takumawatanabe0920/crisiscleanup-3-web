<template>
  <div class="flex flex-grow training-item">
    <div class="flex flex-row justify-between flex-grow p-3">
      <!--- media/picture --->
      <div class="w-1/6">
        <img :src="imagePath" alt="Video Preview" class="shadow" />
      </div>
      <div class="w-4/6 pl-4">
        <!--- body blurb --->
        <base-text variant="bodysm" class="justify-between">
          {{ description }}
        </base-text>
        <div class="flex flex-row justify-start">
          <div class="flex flex-col">
            <img src="@/assets/tempclockicon.jpg" class="h-5" />
          </div>
          <div class="flex flex-col">
            <!--- Date --->
            <base-text
              variant="bodysm"
              class="justify-between text-crisiscleanup-grey-800 alight-left"
            >
              {{ timeToComplete }}
            </base-text>
          </div>
        </div>
      </div>
      <div class="flex w-2/6 items-center">
        <!--- Training Start Button --->
        <base-button
          class="bg-crisiscleanup-yellow-300 hover:bg-crisiscleanup-yellow-100 text-black px-4 py-1"
          href="https://crisiscleanup.zendesk.com/hc/en-us/articles/360033226251-Mandatory-Phone-System-Training"
          :action="() => startTraining()"
        >
          {{ completed ? 'Review' : lang.actions.start.text }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<script>
import VueTypes from 'vue-types';

export default {
  name: 'TrainingsCard',
  props: {
    completed: VueTypes.bool,
    imagePath: VueTypes.string,
    description: VueTypes.string,
    timeToComplete: VueTypes.string,
  },
  data() {
    return {
      isShowingTrainingModal: false,
    };
  },
  computed: {
    lang() {
      return {
        actions: {
          start: {
            text: this.$t('~~Start'),
          },
        },
      };
    },
  },
  methods: {
    startTraining() {
      this.$emit('onTrainingSelected', true);
    },
  },
};
</script>

<style lang="scss" scoped>
.training-item {
  position: relative;
  &:after {
    content: '';
    position: absolute;
    height: 1px;
    width: calc(100% - 0.75rem * 2);
    bottom: 0;
    left: 0.75rem;
    opacity: 0.2;
    background-color: #979797;
  }
}
</style>
