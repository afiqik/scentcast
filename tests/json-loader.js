// tests/json-loader.js
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    return nextLoad(url, {
      ...context,
      importAttributes: { type: 'json' }
    });
  }
  return nextLoad(url, context);
}
