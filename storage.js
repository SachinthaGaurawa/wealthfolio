export const save = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

export const load = (key, fallback) =>
  JSON.parse(localStorage.getItem(key)) || fallback;
