import { Model } from '@vuex-orm/core';
import { isNil, omitBy } from 'lodash';

export default class PhoneOutbound extends Model {
  static entity = 'phone_outbound';

  static fields() {
    return {
      id: this.attr(),
      phone_number: this.attr(),
      vm_url: this.attr(),
      call_type: this.attr(),
      completion: this.attr(),
      incident_id: this.attr(),
      inbound_at: this.attr(),
      created_at: this.attr(),
      updated_at: this.attr(),
      locked_at: this.attr(),
      dnis1: this.attr(),
      dnis2: this.attr(),
      ani: this.attr(),
      worksite: this.attr(),
      pda: this.attr(),
      language: this.attr(),
      created_by: this.attr(),
      updated_by: this.attr(),
      latest_status: this.attr(),
    };
  }

  static apiConfig = {
    actions: {
      async getNextOutbound({ incidentId = 199, agentId = '' }) {
        let queryUrl = `/phone_outbound?next=${incidentId}`;
        if (agentId) {
          queryUrl = `${queryUrl}&agent=${agentId}`;
        }
        const phoneOutbound = await this.get(queryUrl);
        const {
          response: { data },
        } = phoneOutbound;
        return data;
      },
      async getRemainingCallbackCount(incidentId) {
        const phoneOutbound = await this.get(
          `/phone_outbound?incident_id=${incidentId}&&completion__lt=1&limit=1`,
        );
        const {
          response: { data },
        } = phoneOutbound;
        return data.count;
      },
      async getSingleOutbound(id) {
        const phoneOutbound = await this.get(`/phone_outbound/${id}`);
        const {
          response: { data },
        } = phoneOutbound;
        return data;
      },
      async callOutbound(id) {
        const result = this.post(`/phone_outbound/${id}/call`);
        return result;
      },
      async updateStatus(
        id,
        {
          statusId,
          worksiteId = null,
          notes = null,
          dnisMeta = null,
          agentId = null,
          cases = null,
        },
      ) {
        const body = omitBy(
          {
            status: statusId || null,
            dnis_meta: dnisMeta || {},
            agent: agentId,
            worksite: worksiteId,
            notes: notes || null,
            cases,
          },
          isNil,
        );
        await this.post(`/phone_outbound/${id}/update_status`, body, {
          save: false,
        });
      },
    },
  };
}
