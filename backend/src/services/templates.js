const ALLOWED_VARIABLES = ['name', 'location'];

export function normalizeTemplate(rawBody) {
  if (!rawBody?.trim()) {
    throw new Error('Template message is required');
  }

  const variables = [];
  let body = rawBody.trim();

  for (const variable of ALLOWED_VARIABLES) {
    const pattern = new RegExp(`\\{\\{${variable}\\}\\}`, 'gi');
    if (pattern.test(rawBody.trim())) {
      variables.push(variable);
      const index = variables.length;
      body = body.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'gi'), `{{${index}}}`);
    }
  }

  return { body, variables };
}

export function slugifyTemplateName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
