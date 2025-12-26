const KEY = "workHoursData";

export async function saveData(data: any) {
  await chrome.storage.local.set({ [KEY]: data });
}

export async function loadData<T>(): Promise<T | null> {
  const result = await chrome.storage.local.get(KEY);
  return result[KEY] ?? null;
}

export async function clearData() {
  await chrome.storage.local.remove(KEY);
}
