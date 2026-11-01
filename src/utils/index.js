export const PIN_LENGTH = 4;

const claimKey = (drawId) => `secret-santa-${drawId}`;

// Remembers which name this device claimed so returning visitors don't have to re-enter their PIN.
// The server still checks the PIN on every reveal, so clearing this only means typing it again.
export const getSavedClaim = (drawId) => {
  try {
    return JSON.parse(localStorage.getItem(claimKey(drawId)));
  } catch {
    return null;
  }
};

export const saveClaim = (drawId, claim) => localStorage.setItem(claimKey(drawId), JSON.stringify(claim));

export const forgetClaim = (drawId) => localStorage.removeItem(claimKey(drawId));
