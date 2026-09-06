// Shared by asset generation and the player: punctuation does not duplicate clips.
export const audioKey = text => String(text || "").normalize("NFKC").replace(/[\s。、！？!?.,・]/g, "").trim();
