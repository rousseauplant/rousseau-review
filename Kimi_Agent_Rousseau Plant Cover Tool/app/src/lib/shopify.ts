import type { ShopifyCustomer } from '@/types';

const SHOPIFY_DOMAIN = 'rousseauplant.care';

// Check if user is logged into Shopify
export async function checkShopifyLogin(): Promise<ShopifyCustomer | null> {
  try {
    // Try to get customer info from Shopify's customer API
    // This requires the user to be logged into the Shopify store
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/account`, {
      credentials: 'include',
      headers: {
        'Accept': 'text/html',
      }
    });
    
    // If we get a redirect to login, user is not logged in
    if (response.redirected && response.url.includes('/login')) {
      return null;
    }
    
    // For now, return null - we'll implement proper OAuth flow
    return null;
  } catch (error) {
    console.error('Error checking Shopify login:', error);
    return null;
  }
}

// Get Shopify login URL
export function getShopifyLoginUrl(returnUrl: string): string {
  return `https://${SHOPIFY_DOMAIN}/account/login?return_url=${encodeURIComponent(returnUrl)}`;
}

// Store customer ID in localStorage for anonymous users
export function storeAnonymousId(): string {
  let anonymousId = localStorage.getItem('rousseau_anonymous_id');
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('rousseau_anonymous_id', anonymousId);
  }
  return anonymousId;
}

export function getAnonymousId(): string | null {
  return localStorage.getItem('rousseau_anonymous_id');
}