// List, detail and creation endpoints live in the host's endpoints so the shared createStore can find them

export const claimDraw = (id, data) => ({
  endpoint: `santa/${id}/claims`,
  method: 'POST',
  data,
});

export const revealTarget = (id, data) => ({
  endpoint: `santa/${id}/reveal`,
  method: 'POST',
  data,
});

export const resetClaim = (id, participant) => ({
  endpoint: `santa/${id}/claims/${participant}`,
  method: 'DELETE',
});

export const deleteDraw = (id) => ({
  endpoint: `santa/${id}`,
  method: 'DELETE',
});
