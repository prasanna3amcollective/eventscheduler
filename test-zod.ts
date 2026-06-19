import { z } from 'zod';
const schema1 = z.string().datetime().optional();
const schema2 = z.iso.datetime().optional();
console.log(schema1.parse("2025-01-01T00:00:00Z"));
console.log(schema2.parse("2025-01-01T00:00:00Z"));
