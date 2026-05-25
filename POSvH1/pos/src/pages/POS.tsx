import React, { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import { Star, TrendingUp, ShoppingCart, Wallet, Sparkles, CreditCard, Pencil } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import OrderPanel from '../components/OrderPanel';
import ProductDialog from '../components/ProductDialog';
import MenuList from '../components/MenuList';
import SearchBar from '../components/SearchBar';
import MenuItemEditDialog from '../components/MenuItemEditDialog';
import { usePOSStore } from '../store/pos-store';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';
import { Spinner } from '../components/ui/spinner';
import InitialLoader from '../components/InitialLoader';
import { showToast } from '../components/ui/toast';
import { IS_WEBSITE_MODE } from '../lib/platform';
import { updateWebsiteMenuItemOverride } from '../lib/website-mock';

export default function POS() {
  const {
    searchQuery,
    setSearchQuery,
    quickFilter,
    setQuickFilter,
    setSelectedItem,
    addToOrder,
    activeOrders,
    menuItems,
    selectedOrderType,
    paymentModes,
    fetchMenuItems,
    loading,
    error,
    isMenuInteractionDisabled,
    isInitializing,
  } = usePOSStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  useEffect(() => {
    if (showSearch) {
      // The searchInputRef.current.focus() line was removed as per the new_code,
      // as the SearchBar component now handles its own focus.
    }
  }, [showSearch]);

  const handleItemClick = (item: any) => {
    if (isMenuInteractionDisabled()) return;

    if (IS_WEBSITE_MODE && isEditMode) {
      setEditingMenuItem(item);
      return;
    }
    
    clickCountRef.current += 1;
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) {
        // Single click - add to cart
        addToOrder({ ...item, quantity: 1 });
      } else if (clickCountRef.current === 2) {
        // Double click - open dialog
        setSelectedItem(item);
        setIsDialogOpen(true);
      }
      clickCountRef.current = 0;
    }, 250); // 250ms threshold for double click
  };

  const handleItemEditClick = (item: any) => {
    if (!IS_WEBSITE_MODE || isMenuInteractionDisabled()) return;
    setEditingMenuItem(item);
  };

  const handleSaveMenuItem = async (
    itemCode: string,
    updates: {
      item_name: string;
      description: string;
      rate: number;
      course: string;
      course_label: string;
      item_image: string;
      special_dish: 0 | 1;
    }
  ) => {
    updateWebsiteMenuItemOverride(itemCode, updates);
    await fetchMenuItems();
    setEditingMenuItem(null);
    showToast.success('Item updated successfully');
  };

  const QuickFilterButton = ({ filter, icon: Icon, label }: { 
    filter: 'all' | 'special';
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setQuickFilter(filter)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        quickFilter === filter
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        isMenuInteractionDisabled() && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      disabled={isMenuInteractionDisabled()}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (isInitializing) {
    return <InitialLoader />;
  }

  const cartItemsCount = activeOrders.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = activeOrders.reduce((sum, item) => {
    const base = item.selectedVariant?.price || item.price;
    const addons = item.selectedAddons?.reduce((acc, addon) => acc + addon.price, 0) || 0;
    return sum + (base + addons) * item.quantity;
  }, 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600 mb-2">Failed to load POS</p>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner message={t('common.loading_menu_items')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">{t('common.error_loading_menu_items')}</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar disabled={isMenuInteractionDisabled()} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden pe-0 xl:pe-96">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="max-w-screen-xl mx-auto space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-blue-100">Cart Items</p>
                  <ShoppingCart className="w-4 h-4 text-blue-100" />
                </div>
                <p className="text-lg font-bold mt-1">{cartItemsCount}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Subtotal</p>
                  <Wallet className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(cartSubtotal)}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Order Mode</p>
                  <Sparkles className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedOrderType}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Payments</p>
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mt-1">{paymentModes.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onVisibilityChange={setShowSearch}
                isVisible={showSearch}
                disabled={isMenuInteractionDisabled()}
              />
              
              <QuickFilterButton filter="all" icon={Star} label={t('common.all')} />
              <QuickFilterButton filter="special" icon={TrendingUp} label={t('menu.special_items')} />

              {IS_WEBSITE_MODE && (
                <button
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                    isEditMode
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  )}
                  disabled={isMenuInteractionDisabled()}
                >
                  <Pencil className="w-4 h-4" />
                  {isEditMode ? 'Editing Items' : 'Edit Items'}
                </button>
              )}

              <span className="text-xs text-gray-500 ms-2">{menuItems.length} items loaded</span>
            </div>
          </div>
        </div>

        <MenuList
          onItemClick={handleItemClick}
          onItemEdit={handleItemEditClick}
          editable={IS_WEBSITE_MODE && isEditMode}
        />
      </div>
      <OrderPanel />
      {isDialogOpen && <ProductDialog onClose={() => setIsDialogOpen(false)} />}
      <MenuItemEditDialog
        open={Boolean(editingMenuItem)}
        item={editingMenuItem}
        onClose={() => setEditingMenuItem(null)}
        onSave={handleSaveMenuItem}
      />
    </div>
  );
}
