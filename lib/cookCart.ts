// Cook Booking Cart — coox.in style add-to-cart
export interface CartItem {
  id: string;
  chefId: string;
  chefName: string;
  serviceType: 'DAILY' | 'MONTHLY' | 'EVENT';
  mealType?: string;
  serviceDate: string;
  serviceTime: string;
  guestsCount: number;
  numberOfMeals: number;
  menuId?: string;
  menuName?: string;
  specialRequests?: string;
  address?: string;
  city?: string;
  locality?: string;
  pincode?: string;
  estimatedPricePaise: number;
  addedAt: string;
  // Monthly-specific
  plan?: string;
  mealsPerDay?: number;
  mealTypes?: string;
  schedule?: string;
  dietaryPreferences?: string;
  // Event-specific
  eventType?: string;
  durationHours?: number;
  venueAddress?: string;
  menuDescription?: string;
  cuisinePreferences?: string;
  decorationRequired?: boolean;
  cakeRequired?: boolean;
  staffRequired?: boolean;
  staffCount?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

const CART_KEY = 'safar_cook_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

export function addToCart(item: Omit<CartItem, 'id' | 'addedAt'>): CartItem[] {
  const cart = getCart();
  const newItem: CartItem = {
    ...item,
    id: 'ci-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    addedAt: new Date().toISOString(),
  };
  cart.push(newItem);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
  return cart;
}

export function removeFromCart(itemId: string): CartItem[] {
  const cart = getCart().filter(i => i.id !== itemId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.estimatedPricePaise, 0);
}

export function getCartCount(): number {
  return getCart().length;
}
