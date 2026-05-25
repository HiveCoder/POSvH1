import React, { useEffect, useMemo, useRef } from 'react';
import { Clock, User, UserCheck, Receipt, Printer, Pencil, X, Download, FileSpreadsheet } from 'lucide-react';
import { Badge, Button, Card, CardContent } from '../components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { showToast } from '../components/ui/toast';
import OrderStatusSidebar from '../components/OrderStatusSidebar';
import { useRootStore } from '../store/root-store';
import { formatCurrency } from '../lib/utils';
import { Spinner } from '../components/ui/spinner';
import { Textarea } from '../components/ui/textarea';
import { usePOSStore } from '../store/pos-store';
import { useNavigate } from 'react-router-dom';
import PaymentDialog from '../components/PaymentDialog';
import { printOrder } from '../lib/print';
import { call } from '../lib/frappe-sdk';
import { t } from '../i18n';
import { IS_WEBSITE_MODE } from '../lib/platform';
import { getWebsiteOrders, resetWebsiteOrders, updateWebsiteOrder } from '../lib/website-mock';
import { splitVatInclusive } from '../lib/tax';
import { downloadOwnerDailyReportCsv, downloadOwnerDailyReportXls } from '../lib/report-export';

export default function Orders() {
  const { 
    orders,
    orderLoading,
    error,
    selectedStatus,
    pagination,
    selectedOrder,
    selectedOrderItems,
    selectedOrderTaxes,
    selectedOrderLoading,
    selectedOrderError,
    fetchOrders,
    setSelectedStatus,
    goToNextPage,
    goToPreviousPage,
    selectOrder,
    clearSelectedOrder,
    orderSearchQuery
  } = useRootStore();

  const posStore = usePOSStore();
  const navigate = useNavigate();
  const mounted = useRef(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);

  const historyStats = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrderRows = orders.filter((order) => order.status === 'Paid' || order.status === 'Recently Paid');
    const paidOrders = paidOrderRows.length;
    const cancelledOrders = orders.filter((order) => order.status === 'Return').length;
    const totalGrossRevenue = paidOrderRows.reduce((sum, order) => sum + (order.rounded_total || order.grand_total || 0), 0);
    const totalVatCollected = paidOrderRows.reduce((sum, order) => {
      const explicitVat = Number(order.total_taxes_and_charges || 0);
      if (explicitVat > 0) return sum + explicitVat;
      return sum + splitVatInclusive(order.rounded_total || order.grand_total || 0).vatAmount;
    }, 0);
    const totalNetRevenue = paidOrderRows.reduce((sum, order) => {
      const explicitNet = Number(order.net_total || 0);
      if (explicitNet > 0) return sum + explicitNet;
      return sum + splitVatInclusive(order.rounded_total || order.grand_total || 0).vatableSales;
    }, 0);

    return { totalOrders, paidOrders, cancelledOrders, totalGrossRevenue, totalNetRevenue, totalVatCollected };
  }, [orders]);

  const selectedOrderVat = useMemo(() => {
    if (!selectedOrder) return 0;
    const explicitVat = Number(selectedOrder.total_taxes_and_charges || 0);
    if (explicitVat > 0) return explicitVat;
    return splitVatInclusive(selectedOrder.rounded_total || selectedOrder.grand_total || 0).vatAmount;
  }, [selectedOrder]);

  const selectedOrderNet = useMemo(() => {
    if (!selectedOrder) return 0;
    const explicitNet = Number(selectedOrder.net_total || 0);
    if (explicitNet > 0) return explicitNet;
    return splitVatInclusive(selectedOrder.rounded_total || selectedOrder.grand_total || 0).vatableSales;
  }, [selectedOrder]);

  const handleDownloadOwnerReport = () => {
    const reportRows = IS_WEBSITE_MODE ? (getWebsiteOrders() as any[]) : orders;
    const reportDate = new Date().toISOString().slice(0, 10);
    downloadOwnerDailyReportCsv(reportRows, reportDate);
    showToast.success('Owner daily report downloaded');
  };

  const handleDownloadOwnerReportXls = () => {
    const reportRows = IS_WEBSITE_MODE ? (getWebsiteOrders() as any[]) : orders;
    const reportDate = new Date().toISOString().slice(0, 10);
    downloadOwnerDailyReportXls(reportRows, reportDate);
    showToast.success('Owner XLS report downloaded');
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return; // Skip the first run
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSearchQuery]);


  // Function to format the date and time
  const formatDateTime = (date: string, time: string) => {
    const formattedDate = new Date(date + ' ' + time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    return formattedDate;
  };

  const handleOrderClick = (order: any) => {
    selectOrder(order);
  };

  // Helper function to get badge variant based on order status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Unbilled':
        return 'secondary';
      case 'Recently Paid':
      case 'Paid':
      case 'Consolidated':
        return 'default';
      case 'Return':
        return 'destructive';
      default:
        return 'default';
    }
  };

  async function handleCancelOrder() {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      showToast.error(t('errors.enter_cancel_reason'));
      return;
    }
    setCancelLoading(true);
    try {
      if (IS_WEBSITE_MODE) {
        updateWebsiteOrder(selectedOrder.name, {
          status: 'Return',
          cancel_reason: cancelReason,
        });
      } else {
        await call.post('ury.ury.doctype.ury_order.ury_order.cancel_order', {
          invoice_id: selectedOrder.name,
          reason: cancelReason
        });
      }

      showToast.success(t('success.order_cancelled'));
      setCancelDialogOpen(false);
      setCancelReason('');
      clearSelectedOrder();
      fetchOrders();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : t('errors.failed_cancel_order'));
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleEditOrder() {
    if (!selectedOrder) return;
    setEditLoading(true);
    try {
      let order: any;

      if (IS_WEBSITE_MODE) {
        order = (getWebsiteOrders() as any[]).find((item) => item.name === selectedOrder.name);
        if (!order) {
          throw new Error('Failed to fetch order details');
        }
      } else {
        const res = await fetch(`/api/method/frappe.client.get?doctype=POS+Invoice&name=${selectedOrder.name}`);
        if (!res.ok) throw new Error('Failed to fetch order details');
        const data = await res.json();
        order = data.message;
      }

      // Fill POS store
      posStore.resetOrderState();
      posStore.setSelectedOrderType(order.order_type);
      posStore.setOrderForUpdate(order.name);
      if (order.restaurant_table) {
        posStore.setSelectedTable(order.restaurant_table, order.custom_restaurant_room || null,true);
      }
      posStore.setSelectedCustomer({ id: order.customer, name: order.customer_name, phone: order.mobile_number });
      // Fill cart
      const items = (order.items || []).map((item: any) => ({
        id: item.item_code,
        name: item.item_name,
        price: item.rate,
        quantity: item.qty,
        amount: item.amount,
        image: item.image || null,
        uniqueId: item.name,
        item: item.item_code,
        item_name: item.item_name,
        item_image: null,
        course: '',
        description: item.description || '',
        special_dish: 0,
        tax_rate: 0,
      }));
      for (const cartItem of items) {
        await posStore.addToOrder(cartItem);
      }
      // Redirect to POS page
      navigate('/');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : t('errors.failed_edit_order'));
    } finally {
      setEditLoading(false);
    }
  }

  async function handlePrintOrder() {
    if (!selectedOrder || !posStore.posProfile) return;
    setIsPrinting(true);
    try {
      await printOrder({
        orderId: selectedOrder.name,
        posProfile: posStore.posProfile
      });
      showToast.success(t('success.printed'));
      // Locally update selectedOrder.invoice_printed to 1
      if (selectedOrder && typeof selectedOrder === 'object') {
        selectOrder({ ...selectedOrder, invoice_printed: 1 });
      }
      // If order was Unbilled, set to Draft and reload draft orders
      if (selectedStatus === 'Unbilled') {
        showToast.info(t('success.order_moved_to_draft'));
        setSelectedStatus('Draft');
        fetchOrders();
      }
    } catch (err: any) {
      showToast.error(t('errors.print_failed', { reason: err?.message || String(err) }));
    } finally {
      setIsPrinting(false);
    }
  }

  async function handleResetOrders() {
    if (!IS_WEBSITE_MODE) {
      showToast.info('Reset is available in website mode only');
      return;
    }

    setResetLoading(true);
    try {
      resetWebsiteOrders();
      clearSelectedOrder();
      await fetchOrders();
      setSelectedStatus('Draft');
      setResetDialogOpen(false);
      showToast.success('Orders reset to zero');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to reset orders');
    } finally {
      setResetLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600 mb-2">Failed to load orders</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Order Types */}
      <OrderStatusSidebar
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* Middle Section - Order Cards */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pe-0 xl:pe-96">
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 p-4 pb-40">
          <div className="max-w-screen-xl mx-auto mb-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-teal-800 text-white px-4 py-4 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[1.5px] text-teal-100">Financial Control Panel</p>
                <h2 className="text-lg md:text-xl font-semibold">Owner Sales and VAT Reporting</h2>
                <p className="text-xs text-teal-100 mt-1">Export daily reports and monitor gross, net, and VAT performance.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="destructive" className="flex items-center gap-2" onClick={() => setResetDialogOpen(true)}>
                  <X className="w-4 h-4" />
                  Reset Orders
                </Button>
                <Button variant="outline" className="flex items-center gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={handleDownloadOwnerReport}>
                  <Download className="w-4 h-4" />
                  CSV Report
                </Button>
                <Button variant="outline" className="flex items-center gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={handleDownloadOwnerReportXls}>
                  <FileSpreadsheet className="w-4 h-4" />
                  XLS Report
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 max-w-screen-xl mx-auto mb-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Purchase Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{historyStats.totalOrders}</p>
            </div>
            <div className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Completed Payments</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{historyStats.paidOrders}</p>
            </div>
            <div className="rounded-xl bg-white border border-rose-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Returns</p>
              <p className="text-2xl font-bold text-rose-600 mt-2">{historyStats.cancelledOrders}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Gross Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(historyStats.totalGrossRevenue)}</p>
            </div>
            <div className="rounded-xl bg-white border border-blue-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Net Revenue (Owner)</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(historyStats.totalNetRevenue)}</p>
              <p className="text-[11px] text-gray-500 mt-1">Excluding VAT</p>
            </div>
            <div className="rounded-xl bg-white border border-amber-200 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">VAT Collected</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(historyStats.totalVatCollected)}</p>
            </div>
          </div>

          {orderLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-500">{t('orders.no_orders_found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-screen-xl mx-auto">
              {orders.map((order) => (
                <Card 
                  key={order.name} 
                  className={`p-0 bg-white/95 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer border border-slate-200 ${
                    selectedOrder?.name === order.name ? 'ring-2 ring-teal-500 shadow-lg -translate-y-0.5' : ''
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-900 text-sm truncate" title={order.name}>
                      {order.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">
                          {order.restaurant_table ? `Table ${order.restaurant_table} • ` : ''}{t(`order_types.${order.order_type.toLowerCase().replace(/ /g, '_')}`)}
                        </p>
                      </div>
                      <Badge variant={getBadgeVariant(order.status)} className="ms-2">
                        {t(`order_status_types.${order.status.toLowerCase().replace(/ /g, '_')}`)}
                      </Badge>
                    </div>
                    </div>

                    {/* Content section - matches MenuCard padding and structure */}
                    <div className="flex-1 p-3 flex flex-col">
                      <div className="">
                        <p className="text-sm text-gray-900">{order.customer}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(order.posting_date, order.posting_time)}</span>
                      </div>

                      {/* Total - pushed to bottom like MenuCard */}
                      <div className="mt-auto pt-2">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(order.rounded_total)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Pagination Controls */}
          {!orderLoading && (
            <div className="py-4">
              <div className="flex justify-center items-center gap-x-4 max-w-screen-xl mx-auto">
                <Button
                  onClick={goToPreviousPage}
                  disabled={pagination.currentPage === 1}
                  variant="outline"
                  className='w-20'
                  size="xs"
                >
                  {t('orders.pagination.previous')}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('orders.pagination.page', { number: pagination.currentPage.toString() })}
                  </span>
                </div>
                <Button
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage}
                  variant="outline"
                  className='w-20'
                  size="xs"
                >
                  {t('orders.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Order Details */}
      <div className="w-full xl:w-96 bg-white border-s border-gray-200 flex flex-col h-auto xl:h-[calc(100vh-4rem)] static xl:fixed end-0 z-10">

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset orders data?</DialogTitle>
            <DialogDescription>
              This will clear the local orders list and set the orders screen back to zero. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetOrders} disabled={resetLoading}>
              {resetLoading ? 'Resetting...' : 'Yes, reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        {!selectedOrder ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-gray-500 p-6">
            <p className="text-lg font-medium mb-2">{t('order.select_to_view')}</p>
            <p className="text-sm">{t('orders.click_to_view')}</p>
          </div>
        ) : selectedOrderLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : selectedOrderError ? (
          <div className="text-center h-full flex flex-col items-center justify-center text-red-500 p-6">
            <p className="text-lg font-medium mb-2">Failed to load order details</p>
            <p className="text-sm">{selectedOrderError}</p>
          </div>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="sticky top-0 start-0 end-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between min-h-[64px]">
              <h2 className="text-xl font-semibold text-gray-900 truncate max-w-[10rem]">{selectedOrder.name}</h2>
              <div className="flex items-center gap-2">
                {/* Only show edit and cancel buttons for Draft, Unbilled, and Recently Paid orders */}
                {(selectedOrder.status === 'Draft' || selectedOrder.status === 'Unbilled' || selectedOrder.status === 'Recently Paid') && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Edit order"
                      onClick={handleEditOrder}
                      disabled={editLoading}
                    >
                      <Pencil className="w-4 h-4" />
                      {editLoading && <span className="ms-2 text-xs">{t('common.loading')}</span>}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md p-2 bg-gray-100 hover:bg-gray-200 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Cancel order"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <Badge variant={getBadgeVariant(selectedOrder.status)}>
                  {t(`order_status_types.${selectedOrder.status.toLowerCase().replace(/ /g, '_')}`)}
                </Badge>
              </div>
            </div>
            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('order.cancel_order')}</DialogTitle>
                  <DialogDescription>
                    {t('errors.enter_cancel_reason')}
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 mb-3">
                <Textarea
                  placeholder={t('order.enter_cancel_reason')}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  disabled={cancelLoading}
                  autoFocus
                />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="danger" onClick={handleCancelOrder} disabled={cancelLoading}>
                    {cancelLoading ? t('common.cancelling') : t('common.confirm_cancel')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pb-40">
              {/* Order Header (now only info, not name/buttons) */}
              <div className="mb-6">
                {/* Two-column Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* First column: customer and time */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 font-medium">{selectedOrder.customer}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{formatDateTime(selectedOrder.posting_date, selectedOrder.posting_time)}</span>
                    </div>
                  </div>
                  {/* Second column: waiter and table */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <UserCheck className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{selectedOrder.waiter}</span>
                    </div>
                    {selectedOrder.restaurant_table && (
                      <div className="flex items-center gap-3 text-sm">
                        <Receipt className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{selectedOrder.restaurant_table}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('order.items_title')}</h3>
                <div className="space-y-3">
                  {selectedOrderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-start py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxes */}
              {selectedOrderTaxes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('order.taxes_charges')}</h3>
                  <div className="space-y-2">
                    {selectedOrderTaxes.map((tax, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">{tax.description}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(tax.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedOrder as any)?.payment_breakup?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
                  <div className="space-y-2">
                    {(selectedOrder as any).payment_breakup.map((payment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-1 text-sm">
                        <span className="text-gray-600">{payment.mode_of_payment}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(Number(payment.amount) || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">VAT Summary (PH 12%)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">VATable Sales</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedOrderNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT Amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedOrderVat)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-700 font-semibold">Gross Total</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.rounded_total || selectedOrder.grand_total || 0)}</span>
                  </div>
                </div>
              </div>

              {(selectedOrder as any)?.cancel_reason && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation Note</h3>
                  <p className="text-sm text-gray-600 bg-gray-100 rounded-md p-3">{(selectedOrder as any).cancel_reason}</p>
                </div>
              )}
            </div>

            {/* Sticky Bottom Section - Single Row: Print | Payment | Total */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 sticky bottom-0 start-0 end-0 z-10">
              <div className="flex items-center gap-3 w-full">
                {/* Print Icon Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={handlePrintOrder}
                  aria-label="Print"
                  disabled={isPrinting}
                >
                  {isPrinting ? <Spinner className="w-5 h-5" hideMessage /> : <Printer className="w-5 h-5" />}
                </Button>
                {/* Payment Button - Only show for Draft, Unbilled, and Recently Paid orders */}
                {(selectedOrder.status === 'Draft' || selectedOrder.status === 'Unbilled' || selectedOrder.status === 'Recently Paid') && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (String(selectedOrder.invoice_printed) === '0') {
                        showToast.error(t('errors.please_print_first'));
                        return;
                      }
                      setShowPaymentDialog(true);
                    }}
                  >
                    {t('order.payment')}
                  </Button>
                )}
                {/* Total */}
                <span className="ms-auto text-xl font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(selectedOrder.rounded_total)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      {showPaymentDialog && selectedOrder && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          grandTotal={selectedOrder.grand_total}
          roundedTotal={selectedOrder.rounded_total}
          invoice={selectedOrder.name}
          customer={selectedOrder.customer}
          posProfile={posStore.posProfile?.name || ''}
          table={selectedOrder.restaurant_table || null}
          cashier={posStore.posProfile?.cashier || ''}
          owner={posStore.posProfile?.cashier || ''}
          fetchOrders={fetchOrders}
          clearSelectedOrder={clearSelectedOrder}
        />
      )}
    </div>
  );
};
