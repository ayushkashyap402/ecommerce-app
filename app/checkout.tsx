import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { fetchAddresses } from '../src/store/slices/userSlice';
import { removeFromCart } from '../src/store/slices/cartSlice';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../src/utils/helpers';
import { API_CONFIG } from '../src/constants/config';
import { authStorage } from '../src/utils/storage';
import { useTheme } from '../src/context/ThemeContext';

type CheckoutStep = 'address' | 'summary' | 'payment';

export default function CheckoutScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const theme = useTheme();
  
  const { user } = useAppSelector(state => state.auth);
  const { addresses, isLoading: addressLoading } = useAppSelector(state => state.user);
  const { items: cartItems } = useAppSelector(state => state.cart);

  // Get product IDs from params (comma-separated for multiple products)
  const productIds = params.productIds 
    ? (typeof params.productIds === 'string' ? params.productIds.split(',') : params.productIds)
    : [];

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'card' | 'upi'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter cart items based on productIds
  const checkoutItems = cartItems.filter(item => 
    productIds.includes(item.product?._id || (item.product as any)?.id || '')
  );

  useEffect(() => {
    dispatch(fetchAddresses());
  }, []);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(addr => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      } else {
        setSelectedAddressId(addresses[0]._id);
      }
    }
  }, [addresses]);

  const selectedAddress = addresses?.find(addr => addr._id === selectedAddressId);

  // Calculate totals
  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discount = 0; // Can add discount logic later
  const deliveryCharge = subtotal >= 1000 ? 0 : 50;
  const total = subtotal - discount + deliveryCharge;

  const handleContinue = () => {
    if (currentStep === 'address') {
      if (!selectedAddressId) {
        Alert.alert('Error', 'Please select a delivery address');
        return;
      }
      setCurrentStep('summary');
    } else if (currentStep === 'summary') {
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);
    
    try {
      const userId = (user as any)?.id || user?._id;
      
      if (!selectedAddress) {
        Alert.alert('Error', 'Please select a delivery address');
        return;
      }
      
      // Prepare order data
      const orderData = {
        userId,
        items: checkoutItems.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          image: item.product.image || item.product.thumbnailUrl,
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          productCreatedBy: item.product.createdBy // Admin who created the product
        })),
        deliveryAddress: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || '',
          landmark: selectedAddress.landmark || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country || 'India'
        },
        payment: {
          method: selectedPaymentMethod,
          status: 'pending'
        },
        pricing: {
          subtotal: subtotal,
          discount: discount,
          deliveryCharge: deliveryCharge,
          total: total
        }
      };

      console.log('📦 Order Data:', JSON.stringify(orderData, null, 2));

      // Create order via API
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await authStorage.getToken()}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Order creation failed:', result);
        throw new Error(result.message || 'Failed to place order');
      }

      console.log('✅ Order created:', result);
      
      const orderId = result.order?.orderId || result.orderId || result._id;

      // Process payment
      if (selectedPaymentMethod === 'cod') {
        // Process COD payment
        const paymentResponse = await fetch(`${API_CONFIG.BASE_URL}/orders/payments/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await authStorage.getToken()}`
          },
          body: JSON.stringify({
            orderId,
            userId,
            amount: total,
            method: 'cod'
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentResult.message || 'Payment processing failed');
        }

        // Clear cart items that were ordered
        for (const item of checkoutItems) {
          await dispatch(removeFromCart({ 
            userId, 
            productId: item.product._id 
          }));
        }

        setIsProcessing(false);
        
        // Navigate to order success page
        router.replace(`/order-success?orderId=${orderId}&transactionId=${paymentResult.transactionId}` as any);
      } else {
        // For card/UPI, show payment gateway (to be implemented)
        Alert.alert('Coming Soon', 'Online payment integration will be added soon');
        setIsProcessing(false);
      }
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Error', error.message || 'Failed to place order');
      console.error('Place Order Error:', error);
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: theme.colors.card }]}>
      {[
        { key: 'address', label: 'Address', icon: 'location' },
        { key: 'summary', label: 'Summary', icon: 'list' },
        { key: 'payment', label: 'Payment', icon: 'card' },
      ].map((step, index) => (
        <React.Fragment key={step.key}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: theme.colors.backgroundSecondary },
                currentStep === step.key && { backgroundColor: theme.colors.primary },
                (currentStep === 'summary' && step.key === 'address') && { backgroundColor: theme.colors.primaryLight },
                (currentStep === 'payment' && (step.key === 'address' || step.key === 'summary')) && { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Ionicons
                name={step.icon as any}
                size={18}
                color={
                  currentStep === step.key
                    ? '#FFFFFF'
                    : (currentStep === 'summary' && step.key === 'address') ||
                      (currentStep === 'payment' && (step.key === 'address' || step.key === 'summary'))
                    ? theme.colors.primary
                    : theme.colors.textTertiary
                }
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: theme.colors.textTertiary },
                currentStep === step.key && { color: theme.colors.primary },
              ]}
            >
              {step.label}
            </Text>
          </View>
          {index < 2 && <View style={[styles.stepLine, { backgroundColor: theme.colors.border }]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Delivery Address</Text>
        <TouchableOpacity onPress={() => router.push('/profile/address-form' as any)}>
          <Text style={styles.addNewText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {addressLoading ? (
        <LoadingSpinner />
      ) : addresses && addresses.length > 0 ? (
        <View style={styles.addressList}>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              style={[
                styles.addressCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                selectedAddressId === address._id && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => setSelectedAddressId(address._id)}
            >
              <View style={styles.addressHeader}>
                <View style={styles.addressTypeContainer}>
                  <Ionicons
                    name={
                      address.type === 'home'
                        ? 'home'
                        : address.type === 'work'
                        ? 'briefcase'
                        : 'location'
                    }
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.addressType, { color: theme.colors.primary }]}>{address.type.toUpperCase()}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.radioButton,
                    { borderColor: theme.colors.border },
                    selectedAddressId === address._id && { borderColor: theme.colors.primary },
                  ]}
                >
                  {selectedAddressId === address._id && (
                    <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>
              </View>

              <Text style={[styles.addressName, { color: theme.colors.text }]}>{address.name}</Text>
              <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </Text>
              <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
                {address.city}, {address.state} - {address.pincode}
              </Text>
              <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>Phone: {address.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No addresses found</Text>
          <TouchableOpacity
            style={[styles.addAddressButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/profile/address-form' as any)}
          >
            <Text style={styles.addAddressButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSummaryStep = () => (
    <View style={styles.stepContent}>
      {/* Delivery Address */}
      <View style={styles.summarySection}>
        <View style={styles.summarySectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery Address</Text>
          <TouchableOpacity onPress={() => setCurrentStep('address')}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
        {selectedAddress && (
          <View style={[styles.selectedAddressCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.addressTypeContainer}>
              <Ionicons
                name={
                  selectedAddress.type === 'home'
                    ? 'home'
                    : selectedAddress.type === 'work'
                    ? 'briefcase'
                    : 'location'
                }
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.addressType, { color: theme.colors.primary }]}>{selectedAddress.type.toUpperCase()}</Text>
            </View>
            <Text style={[styles.addressName, { color: theme.colors.text }]}>{selectedAddress.name}</Text>
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
              {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </Text>
          </View>
        )}
      </View>

      {/* Order Items */}
      <View style={styles.summarySection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Items ({checkoutItems.length})</Text>
        {checkoutItems.map((item) => (
          <View key={item.product._id} style={[styles.orderItem, { backgroundColor: theme.colors.card }]}>
            <Image
              source={{ uri: item.product.image || item.product.thumbnailUrl || 'https://via.placeholder.com/80' }}
              style={[styles.orderItemImage, { backgroundColor: theme.colors.backgroundSecondary }]}
            />
            <View style={styles.orderItemDetails}>
              <Text style={[styles.orderItemName, { color: theme.colors.text }]} numberOfLines={2}>
                {item.product.name}
              </Text>
              {item.size && (
                <Text style={[styles.orderItemSize, { color: theme.colors.textSecondary }]}>Size: {item.size}</Text>
              )}
              <Text style={[styles.orderItemPrice, { color: theme.colors.textSecondary }]}>
                {formatCurrency(item.product.price)} × {item.quantity}
              </Text>
            </View>
            <Text style={[styles.orderItemTotal, { color: theme.colors.primary }]}>
              {formatCurrency(item.product.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Price Details */}
      <View style={[styles.priceCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.priceTitle, { color: theme.colors.text }]}>Price Details</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Subtotal ({checkoutItems.length} items)</Text>
          <Text style={[styles.priceValue, { color: theme.colors.text }]}>{formatCurrency(subtotal)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Discount</Text>
            <Text style={styles.priceDiscount}>-{formatCurrency(discount)}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Delivery Charges</Text>
          {deliveryCharge === 0 ? (
            <Text style={styles.priceFree}>FREE</Text>
          ) : (
            <Text style={[styles.priceValue, { color: theme.colors.text }]}>{formatCurrency(deliveryCharge)}</Text>
          )}
        </View>
        {subtotal < 1000 && deliveryCharge > 0 && (
          <Text style={styles.deliveryHintText}>
            Add {formatCurrency(1000 - subtotal)} more for FREE delivery!
          </Text>
        )}
        <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.priceRow}>
          <Text style={[styles.priceTotalLabel, { color: theme.colors.text }]}>Total Amount</Text>
          <Text style={[styles.priceTotalValue, { color: theme.colors.primary }]}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Payment Method</Text>
      
      <View style={styles.paymentOptions}>
        <TouchableOpacity 
          style={[
            styles.paymentOption,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedPaymentMethod === 'cod' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setSelectedPaymentMethod('cod')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <View>
              <Text style={[styles.paymentText, { color: theme.colors.text }]}>Cash on Delivery</Text>
              <Text style={[styles.paymentSubtext, { color: theme.colors.textSecondary }]}>Pay when you receive</Text>
            </View>
          </View>
          <View
            style={[
              styles.radioButton,
              { borderColor: theme.colors.border },
              selectedPaymentMethod === 'cod' && { borderColor: theme.colors.primary },
            ]}
          >
            {selectedPaymentMethod === 'cod' && (
              <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.paymentOption,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedPaymentMethod === 'card' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setSelectedPaymentMethod('card')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons name="card-outline" size={24} color={theme.colors.textTertiary} />
            <View>
              <Text style={[styles.paymentText, { color: theme.colors.textTertiary }]}>Credit/Debit Card</Text>
              <Text style={[styles.paymentSubtext, { color: theme.colors.textSecondary }]}>Coming soon</Text>
            </View>
          </View>
          <View
            style={[
              styles.radioButton,
              { borderColor: theme.colors.border },
              selectedPaymentMethod === 'card' && { borderColor: theme.colors.primary },
            ]}
          >
            {selectedPaymentMethod === 'card' && (
              <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.paymentOption,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedPaymentMethod === 'upi' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setSelectedPaymentMethod('upi')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons name="wallet-outline" size={24} color={theme.colors.textTertiary} />
            <View>
              <Text style={[styles.paymentText, { color: theme.colors.textTertiary }]}>UPI</Text>
              <Text style={[styles.paymentSubtext, { color: theme.colors.textSecondary }]}>Coming soon</Text>
            </View>
          </View>
          <View
            style={[
              styles.radioButton,
              { borderColor: theme.colors.border },
              selectedPaymentMethod === 'upi' && { borderColor: theme.colors.primary },
            ]}
          >
            {selectedPaymentMethod === 'upi' && (
              <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentNote}>
        <Ionicons name="information-circle-outline" size={20} color="#92400E" />
        <Text style={styles.paymentNoteText}>
          Currently only Cash on Delivery is available. Online payment methods will be added soon.
        </Text>
      </View>
    </View>
  );

  if (checkoutItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={theme.colors.border} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No items to checkout</Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'address' && renderAddressStep()}
        {currentStep === 'summary' && renderSummaryStep()}
        {currentStep === 'payment' && renderPaymentStep()}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          <Text style={[styles.footerAmount, { color: theme.colors.text }]}>{formatCurrency(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
          onPress={currentStep === 'payment' ? handlePlaceOrder : handleContinue}
          disabled={isProcessing}
        >
          <Text style={styles.continueButtonText}>
            {isProcessing
              ? 'Processing...'
              : currentStep === 'payment'
              ? 'Place Order'
              : 'Continue'}
          </Text>
          {!isProcessing && (
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {isProcessing && <LoadingSpinner overlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#16A085',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#16A085',
  },
  stepCircleCompleted: {
    backgroundColor: '#D5F5E3',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#16A085',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    marginBottom: 32,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addNewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A085',
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addressCardSelected: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A085',
  },
  defaultBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#16A085',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A085',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  addAddressButton: {
    backgroundColor: '#16A085',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySection: {
    marginBottom: 24,
  },
  summarySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A085',
  },
  selectedAddressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  orderItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderItemSize: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  priceDiscount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  priceFree: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  deliveryHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
    marginBottom: 8,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A085',
  },
  paymentOptions: {
    gap: 12,
    marginTop: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  paymentOptionSelected: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  footerLeft: {},
  footerLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A085',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#16A085',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

