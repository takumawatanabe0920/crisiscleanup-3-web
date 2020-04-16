/**
 * socket.js
 * WebSocket Store
 */

import Logger from '@/utils/log';

const Log = Logger({
  name: 'WS',
  middlewares: [
    (result) => {
      result.unshift('[WS]');
      return result;
    },
  ],
});

const getStateDefaults = () => ({
  connected: false,
});

const SocketState = {
  ...getStateDefaults(),
};

const types = {
  SET_CONNECTED: 'SET_CONNECTED',
};

const getters = {
  connected: (state) => state.connected,
};

const actions = {
  async setConnected({ commit }, { connected }) {
    commit(types.SET_CONNECTED, connected);
  },
  async send({ getters: { connected } }, data) {
    if (!connected) {
      Log.debug('not connected!');
      await window.vue.$connect();
    }
    Log.debug('sending message:', data);
    await window.vue.$socket.sendObj(data);
  },
};

const mutations = {
  [types.SET_CONNECTED](state, newState) {
    state.connected = newState;
  },
};

export default {
  namespaced: true,
  state: SocketState,
  getters,
  actions,
  mutations,
};
