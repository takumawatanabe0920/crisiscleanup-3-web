// @flow

/**
 * Connection model.
 */

import { Model } from '@vuex-orm/core';
import type { ConnectionType } from '@/models/phone/types';

/**
 * Enum of states representing the current step or stage of a connection.
 * @type {{PAUSED: string, AGENT_PENDING: string, PENDING_CALL: string, BUSY: string, AGENT_CALLING: string} | any}
 */
export const ConnectionStates = Object.freeze({
  AGENT_CALLING: 'CallingCustomer', // Agent -> Outbound Call.
  AGENT_PENDING: 'pending', // Server -> Agent verification call.
  PENDING_CALL: 'PendingBusy', // Agent -> Customer post verification transfer.
  BUSY: 'Busy', // Agent has at least 1 connected contact.
  PAUSED: 'AfterCallWork', // Agent has closed all open contacts. Rest period.
});

export default class Connection extends Model {
  static entity = 'phone/connection';

  static primaryKey = ['connectionId', 'contactId'];

  static fields() {
    return ({
      connectionId: this.string(),
      contactId: this.string(),
      state: this.string(),
    }: ConnectionType);
  }
}
