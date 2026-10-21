export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {};'
    };
  }
  if (url.endsWith('.json')) {
    return nextLoad(url, {
      ...context,
      importAttributes: { type: 'json' }
    });
  }
  return nextLoad(url, context);
}
