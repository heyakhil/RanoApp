/**
 * Validates request body/query/params with a Zod schema.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    req[source] = schema.parse(req[source]);
    next();
  };
}
