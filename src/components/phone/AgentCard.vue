<template>
  <div class="agentcard shadow-crisiscleanup-card">
    <div class="card-edit">
      <ccu-icon
        @click.native="() => forceEdit()"
        size="md"
        :type="icons.edit"
      />
    </div>
    <div class="profile">
      <div class="profile--img">
        <img
          :src="currentUser.profilePictureUrl"
          alt="UserProfile"
          class="rounded-full"
        />
      </div>
      <div class="profile--details">
        <base-text variant="h2" :weight="700">
          {{ currentUser.full_name }}
        </base-text>
        <base-text variant="h1" :weight="400">
          {{ currentUser.mobile }}
        </base-text>
        <base-button
          variant="text"
          class="more-info"
          :action="() => (toggleOpen = !toggleOpen)"
        >
          {{ toggleOpen ? lang.toggle.less : lang.toggle.more }}
        </base-button>
      </div>
    </div>
    <div class="info-card py-3">
      <transition name="fade" mode="out-in">
        <more-info v-if="toggleOpen" />
      </transition>
    </div>
    <div class="action">
      <div class="inline-flex status">
        <span :class="`dot ${currentState.state}`" />
        <base-text :weight="600" variant="body">{{
          currentState.statusText
        }}</base-text>
      </div>
      <base-button
        :disabled="!currentState.enabled"
        :action="toggleAvailable"
        variant="solid"
        size="large"
      >
        {{ currentState.text }}
      </base-button>
    </div>
    <trainings-modal
      :visible="isShowingTrainingModal"
      @onClose="isShowingTrainingModal = false"
      @onComplete="onTrainingComplete"
    ></trainings-modal>
    <agent-edit-card
      :active="editCardActive"
      :request="agentNeeded"
      @user-updated="() => validateAgent()"
    />
  </div>
</template>

<script>
import { IconsMixin, UserMixin, LangMixin, TrainingMixin } from '@/mixins';
import { mapActions, mapGetters } from 'vuex';
import { STATES as CCState, EVENTS as CCEvent } from '@/services/acs.service';
import ContactMoreInfo from '@/components/phone/ContactMoreInfo.vue';
import TrainingsModal from '@/components/phone/TrainingsModal.vue';
import { EventBus } from '@/event-bus';
import CallerIDEditCard from '@/components/phone/CallerIDEditCard.vue';
import { ERRORS as AgentErrors } from '@/models/Agent';

export default {
  name: 'AgentCard',
  mixins: [IconsMixin, LangMixin, UserMixin, TrainingMixin],
  components: {
    moreInfo: ContactMoreInfo,
    'agent-edit-card': CallerIDEditCard,
    TrainingsModal,
  },
  data() {
    return {
      toggleOpen: true,
      isShowingTrainingModal: false,
      editCardActive: false,
      showConnectLogin: false,
      agentNeeded: {
        phone: false,
        lang: false,
      },
      agent: {},
    };
  },
  async mounted() {
    await this.loadTrainingData();
  },
  methods: {
    ...mapActions('phone', ['setAgentState', 'getAgent']),
    forceEdit() {
      this.agentNeeded.phone = true;
      this.agentNeeded.lang = true;
      this.editCardActive = true;
    },
    async authenticate() {
      if (!this.connectReady) {
        await this.validateAgent();
        if (!this.editCardActive) {
          return EventBus.$emit('acs:requestAgent');
        }
        return this.editCardActive;
      }
      return this.editCardActive;
    },
    async validateAgent() {
      this.editCardActive = false;
      this.agentNeeded.phone = false;
      this.agentNeeded.lang = false;
      try {
        this.agent = await this.getAgent();
      } catch (errs) {
        const {
          MOBILE_INVALID,
          MOBILE_NOT_FOUND,
          LANGUAGE_NOT_FOUND,
          LANGUAGE_NOT_SUPPORTED,
        } = AgentErrors;
        const invalidPhone = (el) =>
          [MOBILE_INVALID, MOBILE_NOT_FOUND].includes(el);
        const invalidLang = (el) =>
          [LANGUAGE_NOT_FOUND, LANGUAGE_NOT_SUPPORTED].includes(el);
        this.editCardActive = true;
        if (errs.some(invalidPhone)) {
          this.agentNeeded.phone = true;
        }
        if (errs.some(invalidLang)) {
          this.agentNeeded.lang = true;
        }
      }
    },
    async toggleAvailable() {
      if (!this.allTrainingCompleted) {
        this.isShowingTrainingModal = true;
        return this.isShowingTrainingModal;
      }

      if (!this.connectReady) {
        await this.validateAgent();
        if (!this.editCardActive) {
          this.authenticate();
        }
        return this.editCardActive;
      }

      if (this.currentPage === 'controller') {
        return this.$toasted.error(
          this.$t('~~You must complete the open call to take another!'),
        );
      }

      if (this.agentAvailable) {
        return this.setAgentState(CCState.OFFLINE);
      }
      return this.setAgentState(CCState.ROUTABLE);
    },
    async onTrainingComplete() {
      await this.loadTrainingData();
      this.isShowingTrainingModal = false;
    },
  },
  computed: {
    ...mapGetters('phone', [
      'agentState',
      'agentAvailable',
      'connectReady',
      'popupOpen',
      'currentPage',
    ]),
    lang() {
      return this.getLang({
        start: '~~Start Taking Calls',
        ready: '~~Ready for Next Call',
        stop: '~~Stop Taking Calls',
        train: '~~Start Training',
        authenticate: '~~Authenticate',
        toggle: {
          more: '~~More Info',
          less: '~~Less Info',
        },
        status: {
          offline: '~~Offline',
          available: '~~Available',
          oncall: '~~On Call',
          paused: '~~Paused',
        },
      });
    },
    currentState() {
      if (!this.allTrainingCompleted) {
        return {
          enabled: true,
          text: this.lang.train,
          statusText: this.lang.status.offline,
        };
      }
      if (!this.connectReady) {
        return {
          enabled: true,
          text: this.lang.authenticate,
          statusText: this.lang.status.offline,
        };
      }
      const state = {
        enabled: true,
        key: 'start',
        state: 'offline',
      };
      switch (this.agentState) {
        case CCState.POLLING:
        case CCState.ROUTABLE:
        case CCState.AGENT_CALLING:
          state.key = 'stop';
          state.state = 'available';
          EventBus.$emit(CCEvent.AVAILABLE);
          break;
        case CCState.PENDING_CALL:
        case CCState.INCOMING:
        case CCState.CONNECTING:
        case CCState.AGENT_PENDING:
          state.key = 'ready';
          state.state = 'oncall';
          state.enabled = false;
          break;
        case CCState.ON_CALL:
          state.key = 'ready';
          state.state = 'oncall';
          state.enabled = false;
          EventBus.$emit(CCEvent.ON_CALL);
          break;
        case CCState.PAUSED:
          state.key = 'ready';
          state.state = 'paused';
          EventBus.$emit(CCEvent.PAUSED);
          break;
        case CCState.OFFLINE:
        case CCState.DISCONNECTED:
          break;
        default:
          break;
      }
      state.text = this.lang[state.key];
      state.statusText = this.lang.status[state.state];
      return state;
    },
  },
};
</script>

<style scoped lang="scss">
.agentcard {
  @apply bg-white p-3 px-6;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  /* transition: all 300ms ease; */
  .card-edit {
    display: flex;
    justify-content: flex-end;
  }
  .profile {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-grow: 1;
    &--img {
      @apply shadow-md;
      max-width: 30%;
      object-fit: contain;
      border-radius: 50%;
      position: relative;
    }
    &--details .more-info {
      @apply text-primary-dark;
      text-decoration: underline;
      &:hover {
        @apply text-primary-light;
        background-color: transparent;
      }
      .card {
        transition: 300ms ease;
      }
    }
  }
  .action {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;

    .status {
      align-items: center;
      @apply pb-2;
    }

    .dot {
      @apply shadow-sm;
      height: 0.75rem;
      width: 0.75rem;
      border-radius: 50%;
      display: inline-block;
      @apply mr-2 bg-crisiscleanup-red-500;
      &.available {
        @apply bg-crisiscleanup-green-300;
      }
      &.oncall {
        @apply bg-crisiscleanup-dark-blue;
      }
      &.paused {
        @apply bg-crisiscleanup-yellow-500;
      }
    }
  }
}
</style>
