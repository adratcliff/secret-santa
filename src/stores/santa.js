import { callApi, createStore } from 'shared/utils';

import {
  claimDraw,
  deleteDraw,
  resetClaim,
  revealTarget,
} from '../endpoints';

const setClaimed = (store, id, participant, claimed) => {
  const found = store.resources[id]?.participants?.find(({ id: participantId }) => participantId === participant);
  if (found) found.claimed = claimed;
};

// Claim and reveal errors are thrown rather than logged so the views can explain them by status
export const useSantaStore = createStore('santa', {}, {
  async claim(id, participant, pin) {
    const { data } = await callApi(claimDraw(id, { participant, pin }));
    setClaimed(this, id, participant, true);
    return data.target;
  },
  async reveal(id, participant, pin) {
    const { data } = await callApi(revealTarget(id, { participant, pin }));
    return data.target;
  },
  async resetClaim(id, participant) {
    await callApi(resetClaim(id, participant));
    setClaimed(this, id, participant, false);
  },
  async deleteDraw(id) {
    await callApi(deleteDraw(id));
    delete this.resources[id];
  },
});
