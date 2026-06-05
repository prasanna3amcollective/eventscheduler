import { Prisma } from './src/generated/prisma/client/index.js';
console.log(Prisma.dmmf.datamodel.models.map((m: any) => m.name));
