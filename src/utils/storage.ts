const KEY = "workHoursData";

import browser from "webextension-polyfill";

export async function saveData(data: any) {
  await browser.storage.local.set({ [KEY]: data });
}

export async function loadData<T>(): Promise<T | null> {
  const result = await browser.storage.local.get(KEY);
  return result[KEY] ?? null;
}

export async function clearData() {
  await browser.storage.local.remove(KEY);
}
