import React from 'react';
import { BundleOption, Currency } from '../types';
import { X, Trash2, ShoppingBag, Zap, Truck, Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { bundle: BundleOption; quantity: number }[];
  onUpdateQuantity: (bundleId: string, delta: number) => void;
  onRemoveItem: (bundleId: string) => void;
  currency: Currency;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  currency,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => {
    const price = currency === 'INR' ? item.bundle.priceInr : item.bundle.priceUsd;
    return acc + price * item.quantity;
  }, 0);

  const freeShippingGoal = currency === 'INR' ? 299 : 9.99;
  const progressPercent = Math.min(100, Math.round((totalAmount / freeShippingGoal) * 100));
  const amountNeeded = Math.max(0, freeShippingGoal - totalAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-900" />
            <h2 className="font-serif font-bold text-base text-stone-900">Your Shopping Bag</h2>
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="bg-[#FAF8F5] p-3 border-b border-stone-200/60 text-xs">
          <div className="flex items-center justify-between mb-1.5 font-medium text-stone-700">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-stone-900" />
              {amountNeeded === 0 ? (
                <span className="text-emerald-700 font-bold">You unlocked FREE Express Delivery!</span>
              ) : (
                <span>
                  Add{' '}
                  <strong>
                    {currency === 'INR' ? `₹${amountNeeded}` : `$${amountNeeded.toFixed(2)}`}
                  </strong>{' '}
                  more for FREE Shipping
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] text-stone-500">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-stone-300" />
              <p className="font-medium text-stone-600 text-sm">Your shopping bag is empty</p>
              <p className="text-xs text-stone-400 mt-1">Select a bundle to get started</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const itemPrice = currency === 'INR' ? item.bundle.priceInr : item.bundle.priceUsd;
              return (
                <div
                  key={item.bundle.id}
                  className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                      <img
                        src={item.bundle.imageUrl || (item.bundle.packCount === 3 ? '/media/slide1.webp' : '/media/hero-product.webp')}
                        alt={item.bundle.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-stone-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-1 py-0.5 rounded-tl-md">
                        {item.bundle.packCount}P
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-stone-900 truncate max-w-[150px]">{item.bundle.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        {currency === 'INR' ? `₹${itemPrice}` : `$${itemPrice.toFixed(2)}`} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-stone-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.bundle.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 text-xs font-semibold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.bundle.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 text-xs font-semibold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.bundle.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Drawer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-stone-200 space-y-3 bg-white">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-bold text-stone-950 text-base tabular-nums">
                {currency === 'INR' ? `₹${totalAmount}` : `$${totalAmount.toFixed(2)}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-stone-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
