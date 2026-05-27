import { z } from "zod";

// -------------------------------------------------------
// Auth
// -------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// -------------------------------------------------------
// Dirección
// -------------------------------------------------------
export const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(5, "Dirección muy corta"),
  line2: z.string().optional(),
  city: z.string().min(2, "Ciudad requerida"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Código postal inválido (5 dígitos)"),
  province: z.string().optional(),
  country: z.string().length(2, "Código de país ISO inválido").default("ES"),
  phone: z
    .string()
    .regex(/^(\+34|0034|34)?[6789]\d{8}$/, "Teléfono inválido"),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// -------------------------------------------------------
// Checkout
// -------------------------------------------------------
export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Selecciona una dirección de envío"),
  shippingRateId: z.string().min(1, "Selecciona un método de envío"),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL"]),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// -------------------------------------------------------
// Producto (Admin)
// -------------------------------------------------------
export const productSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .min(2),
  description: z.string().min(10, "Descripción muy corta"),
  categoryId: z.string().optional(),
  isArchived: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  earlyAccessTierLevel: z.number().int().min(1).max(5).nullable().optional(),
  isExclusive: z.boolean().default(false),
  probabilityData: z.record(z.string(), z.string()).optional(),
});

export const productVariantSchema = z.object({
  sku: z.string().min(2, "SKU requerido"),
  title: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  pricePro: z.number().positive().optional().nullable(),
  proExempt: z.boolean().default(false),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  weight: z.number().int().min(0, "El peso no puede ser negativo"),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

// -------------------------------------------------------
// Cupón (Admin)
// -------------------------------------------------------
export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Código muy corto")
    .max(20, "Código muy largo")
    .regex(/^[A-Z0-9_-]+$/, "Solo mayúsculas, números, _ y -"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive("El valor debe ser positivo"),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

// -------------------------------------------------------
// ProTier (Admin)
// -------------------------------------------------------
export const proTierSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  priceMonthly: z.number().positive("Precio mensual requerido"),
  monthlyAllowance: z.number().positive("Allowance mensual requerido"),
  stripePriceId: z.string().min(2, "ID de precio en Stripe requerido"),
  description: z.string().optional(),
  benefits: z
    .object({
      earlyAccessHours: z.number().int().min(0).default(0),
      freeShipping: z.boolean().default(false),
      exclusiveProducts: z.boolean().default(false),
      bonusAllowancePercent: z.number().min(0).max(100).default(0),
    })
    .optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// -------------------------------------------------------
// ShippingRate (Admin)
// -------------------------------------------------------
export const shippingRateSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  type: z.enum(["ORDINARIO", "CERTIFICADO"]),
  region: z.enum(["NATIONAL", "EUROPE"]),
  minWeight: z.number().int().min(0),
  maxWeight: z.number().int().min(-1), // -1 = sin límite
  price: z.number().min(0, "El precio no puede ser negativo"),
  active: z.boolean().default(true),
});

// -------------------------------------------------------
// Configuración de perfil
// -------------------------------------------------------
export const updateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });
