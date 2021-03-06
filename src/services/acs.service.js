/**
 * acs.service.js
 * Amazon Connect Streams Service
 *
 */

import { AuthService } from '@/services/auth.service.js';
import * as SSO from '@/services/sso.service';
import Logger from '@/utils/log';

const Log = Logger({
  name: 'acs.service',
  middlewares: [
    (result) => {
      result.unshift('[ACS] ');
      return result;
    },
  ],
});

export const EVENTS = (() => {
  const ev = (e) => `acs:${e}`;
  const st = (e) => `${ev('status')}:${e}`;
  return {
    INIT: ev('initialize'),
    REQUEST: ev('requestAgent'),
    INBOUND: ev('inbound'),
    AVAILABLE: st('available'),
    ON_CALL: st('oncall'),
    PAUSED: st('paused'),
    OFF_CALL: st('offcall'),
    CASE_SAVED: ev('caseSaved'),
  };
})();

export const ConnectConfig = async () => ({
  // reference @crisiscleanup/amazon-connect-streams
  // for custom options
  ccpUrl: process.env.VUE_APP_AWS_CCP_URL,
  region: process.env.VUE_APP_AWS_CCP_REGION,
  softphone: {
    allowFramedSoftphone: true,
  },
  loginPopup: false,
  loginPopupAutoClose: true,
  loginUrl: await SSO.authenticate(AuthService.getToken()),
});

export const initConnect = async ({
  htmlEl,
  config,
  onAuth,
  onTerminate,
  onTimeout,
}) => {
  // Bind and initialize connect
  const connectConfig = await ConnectConfig();
  const finalConf = { ...connectConfig, ...config };
  Log.debug('initializing ACS service with config:');
  Log.debug(finalConf);
  connect.core.initCCP(htmlEl, finalConf);
  const eventBus = connect.core.getEventBus();
  const upstream = connect.core.getUpstream();
  if (onAuth) {
    const handleOnAuth = (e) => {
      Log.debug(`got authentication event: ${e}`);
      return onAuth();
    };
    eventBus.subscribe(connect.EventType.INIT, () =>
      handleOnAuth(connect.EventType.INIT),
    );
    eventBus.subscribe(connect.EventType.ACKNOWLEDGE, () =>
      handleOnAuth(connect.EventType.ACKNOWLEDGE),
    );
    eventBus.subscribe(connect.AgentEvents.INIT, () =>
      handleOnAuth(connect.AgentEvents.INIT),
    );
    upstream.onUpstream(connect.EventType.ACKNOWLEDGE, () =>
      handleOnAuth(connect.EventType.ACKNOWLEDGE),
    );
  }
  if (onTerminate) {
    // Bind handler to session terminiation
    eventBus.subscribe(connect.EventType.TERMINATED, () => {
      Log.info('session has terminated!');
      return onTerminate();
    });
  }
  if (onTimeout) {
    // Bind handler to ACK timeout (need login refresh)
    eventBus.subscribe(connect.EventType.ACK_TIMEOUT, () => {
      Log.info('ACK timeout!');
      return onTimeout();
    });
  }
};

export const setPopup = async ({ open } = { open: true }) => {
  if (!open) {
    // clear state (kept in localStorage)
    Log.debug('closing popup manager...');
    connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
    if (connect.core.loginWindow) {
      connect.core.loginWindow.close();
      connect.core.loginWindow = null;
    }
    return false;
  }
  connect.core.getPopupManager().clear(connect.MasterTopics.LOGIN_POPUP);
  const { loginUrl, loginPopup } = await ConnectConfig();
  connect.core.loginWindow = connect.core
    .getPopupManager()
    .open(loginUrl, connect.MasterTopics.LOGIN_POPUP, loginPopup);
  return true;
};

export const STATES = Object.freeze({
  OFFLINE: 'offline',
  ROUTABLE: 'routable',
  INCOMING: 'incoming',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AGENT_PENDING: 'pending',
  AGENT_CALLING: 'CallingCustomer',
  DISCONNECTED: 'disconnected',
  PENDING_CALL: 'PendingBusy',
  POLLING: 'polling',
  ON_CALL: 'Busy',
  PAUSED: 'AfterCallWork',
  STATIC: 'static',
});

const LOCKED_STATES = [
  STATES.PENDING_CALL,
  STATES.AGENT_CALLING,
  STATES.AGENT_PENDING,
];

export const isLockedState = (state, currentState) =>
  state === STATES.ROUTABLE && LOCKED_STATES.includes(currentState);

export const METRICS = Object.freeze({
  ONLINE: 'agentsOnline',
  STAFFED: 'agentsStaffed',
  CONTACTS_QUEUED: 'contactsInQueue',
  CALLBACKS_QUEUED: 'contactsInQueueOutbound',
  AGENTS_ON_CONTACT: 'agentsOnContact',
  AVAILABLE: 'agentsAvailable',
  AGENTS_ON_CALL: 'agentsOnCall',
  NEEDED: 'agentsNeeded',
  TOTAL_WAITING: 'totalWaiting',
});

export const getAgent = () => new connect.Agent();

export const setAgentState = async (state) => {
  Log.info('setting upstream agent state -> connect', state);
  const agent = getAgent();
  const stateDef = agent.getAgentStates().find((s) => s.type === state);
  await agent.setState(stateDef);
  return state;
};

export const parseAgentState = (stateEvent) => {
  const state = Object.values(STATES).filter((val) => {
    let stateType = stateEvent;
    if (typeof stateEvent === 'object') {
      stateType = stateEvent.type;
      if (['system', 'not_routable'].includes(stateType.toLowerCase())) {
        stateType = stateEvent.name;
      }
    }
    if (val) {
      return val.toLowerCase() === stateType.toLowerCase();
    }
    return false;
  });
  return state.length >= 1 ? state[0] : null;
};

export const bindAgentEvents = (handler) => {
  Object.keys(handler).forEach((key) => {
    connect.agent((agent) => {
      agent[key](connect.hitch(handler, handler[key]));
    });
  });
};

export const bindContactEvents = (handler) => {
  Object.keys(handler).forEach((key) => {
    connect.contact((contact) => {
      contact[key](connect.hitch(handler, handler[key]));
    });
  });
};

export const getCurrentContact = () => {
  const agent = getAgent();
  const contacts = agent.getContacts();
  if (contacts.length >= 1) {
    return contacts[0];
  }
  return null;
};

export const endContactCall = (connectionId = null) => {
  const contact = getCurrentContact();
  let connection = contact
    .getConnections()
    .find((c) => c.connectionId === connectionId);
  if (!connection) {
    connection = contact.getInitialConnection();
  }
  Log.debug('destroying connection: ', connection);
  connection.destroy();
};

export const addContact = (number, handler) => {
  const endpoint = connect.Endpoint.byPhoneNumber(number);
  const contact = getCurrentContact();
  contact.addConnection(endpoint, handler);
};
