// The tab key keeps two simultaneous reports independent. User IDs isolate accounts on shared devices.
let tabKey;
export function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
export function draftId(userId) {
  if (!tabKey) {
    try {
      tabKey = sessionStorage.getItem("itt:tab") || newKey();
      sessionStorage.setItem("itt:tab", tabKey);
    } catch {
      tabKey = newKey();
    }
  }
  return userId + "/" + tabKey;
}
let connection;
function database() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const open = indexedDB.open("itt-borradores", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("drafts");
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
  return connection;
}
// Retain an in-memory copy if this browser temporarily refuses local storage.
const memory = new Map();
const savedPhotos = new Map();
const pendingWrites = new Map();
export async function readDraft(id) {
  if (memory.has(id)) return memory.get(id);
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts"),
      store = tx.objectStore("drafts");
    const fields = store.get(id),
      photos = store.get(id + "/photos");
    tx.oncomplete = () => {
      const value = fields.result && { ...fields.result, photos: photos.result || [] };
      if (value) savedPhotos.set(id, value.photos);
      resolve(value);
    };
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}
async function writeDraft(id, value) {
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    const store = tx.objectStore("drafts");
    if (!value) {
      store.delete(id);
      store.delete(id + "/photos");
    } else {
      const { photos, ...fields } = value;
      store.put(fields, id);
      if (savedPhotos.get(id) !== photos) store.put(photos, id + "/photos");
    }
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
  if (value) savedPhotos.set(id, value.photos);
  else savedPhotos.delete(id);
}

export async function saveDraft(id, value) {
  memory.set(id, value);
  // Serialize writes so the date and photographs describe the same saved draft.
  const previous = pendingWrites.get(id) || Promise.resolve();
  const write = previous.catch(() => {}).then(() => writeDraft(id, value));
  pendingWrites.set(id, write);
  try {
    await write;
  } catch (error) {
    if (value && memory.get(id) === value)
      memory.set(id, { ...value, savedAt: null });
    throw error;
  } finally {
    if (pendingWrites.get(id) === write) pendingWrites.delete(id);
  }
}
