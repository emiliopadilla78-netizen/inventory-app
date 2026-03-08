import { z } from 'zod';
import { insertProductSchema, insertSaleSchema, products, sales, saleItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Define product response schema
const productResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  quantity: z.number(),
  category: z.string(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

const saleItemResponseSchema = z.object({
  id: z.number(),
  saleId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  unitPrice: z.string(),
  subtotal: z.string(),
  product: productResponseSchema.optional(),
});

const saleResponseSchema = z.object({
  id: z.number(),
  totalAmount: z.string(),
  paymentMethod: z.string(),
  date: z.date(),
  createdAt: z.date().nullable(),
  items: z.array(saleItemResponseSchema).optional(),
});

const createSaleRequestSchema = z.object({
  totalAmount: z.union([z.string(), z.number()]),
  paymentMethod: z.string(),
  date: z.string().or(z.date()).optional(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
    unitPrice: z.union([z.string(), z.number()]),
    subtotal: z.union([z.string(), z.number()]),
  })),
});

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(productResponseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: productResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: productResponseSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
      responses: {
        200: productResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  sales: {
    list: {
      method: 'GET' as const,
      path: '/api/sales' as const,
      responses: {
        200: z.array(saleResponseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sales/:id' as const,
      responses: {
        200: saleResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sales' as const,
      input: createSaleRequestSchema,
      responses: {
        201: saleResponseSchema,
        400: errorSchemas.validation,
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: z.object({
          totalProducts: z.number(),
          lowStockProducts: z.number(),
          totalSalesToday: z.number(),
          revenueToday: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProductInput = z.infer<typeof api.products.create.input>;
export type SaleInput = z.infer<typeof api.sales.create.input>;
