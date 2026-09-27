/**
 * AMUL KOOL EXOTIC ROSE — Centralized Product Catalog
 * Single source of truth for product IDs, names, prices, and metadata.
 * Both the frontend cart and the backend order validation import from here.
 */

export const PRODUCTS = [
  {
    id: 'single',
    name: 'On-the-Go Single',
    subtitle: '180ml Bottle',
    price: 30,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMeuGI9H9e6W_x0K5rY6oqgEOUZX7lYYT8XpLIUyFsZsYX-YcUwGZbbc1yXT_0JIug1nn3UL2rDohGoLW4A2DLsWaS1ptuWaKE3LkPWIFZVZ63gA9Hq2L6cuzKg0uwrp7qDyJS56d8YIM_eXAvL-NWkEb7l-KBZbxqNr1dHiLmnIDHQhNQk5WW48l3y7dY3UTglwSv3pV9ASLLqkmEMz3N0jfn7Sd-cATb2HN8gjmXZWnZW2_k50K75EkhxVHVyJqHQg',
    badge: 'Single Sip',
  },
  {
    id: 'family-pack',
    name: 'Family Chill 6-Pack',
    subtitle: '6 x 180ml Bottles',
    price: 170,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhfIXQK9EYqIO5qGQKsd5PrtWBUksFziZJRH04SbPfBLvP1WwjglPqOnnWQCobzyb1BfyINIkefN0E9sSUu2nUgaq2-mES6xuEzfrPXvtQ-jakzarwTRVeo-0Mr3UqSSbOE4EQHIQNVVL9nvqXCnZ6CfPO7LtUCR2h5gizR-HzvkIkcQl-4wr771auZc69Zz00U2OK3dG_gmJ-mPk1noTZjJFmQ0Xq7kG8o6fsBiifigEjUr0mhIPX3hnueRcyAiekbQ',
    badge: 'Save ₹10',
  },
  {
    id: 'party-crate',
    name: 'Party & Festive Crate',
    subtitle: '24 x 180ml Crate',
    price: 650,
    image: '',
    badge: 'Bulk Savings',
  },
];

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function getProduct(id) {
  return PRODUCT_MAP[id] || null;
}
