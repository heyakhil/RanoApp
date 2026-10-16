import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavHeader, NoticeBanner, StackedActions } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { colors } from '../../theme';
import { styles } from './styles';

const QUICK_AMOUNTS = [
  { value: 100, label: '₹100' },
  { value: 200, label: '₹200' },
  { value: 500, label: '₹500' },
  { value: 1000, label: '₹1,000' },
  { value: 5000, label: '₹5,000' },
] as const;

interface AddMoneyScreenProps {
  amount: string;
  onChangeAmount: (amount: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const AddMoneyScreen: React.FC<AddMoneyScreenProps> = ({
  amount,
  onChangeAmount,
  onBack,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const selectedValue = Number(amount);

  const continueToPayment = () => {
    if (!Number.isInteger(selectedValue) || selectedValue < 100) {
      setError('Enter at least ₹100');
      return;
    }

    setError('');
    onContinue();
  };

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Add Money" onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          <View style={styles.info}>
            <NoticeBanner
              icon="information-outline"
              title="Secure Payment"
              message="Your payment is encrypted and secure. Funds will be added instantly."
              color={colors.primary}
              backgroundColor={colors.blueSoft}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Enter Amount</Text>
            <View style={[styles.inputShell, focused && styles.inputFocused]}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={value => {
                  setError('');
                  onChangeAmount(value.replace(/[^\d]/g, ''));
                }}
                placeholder="Amount in rupees"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.quickBlock}>
            <Text style={styles.quickTitle}>Quick Select</Text>
            <View style={styles.grid}>
              {QUICK_AMOUNTS.map(option => {
                const selected = selectedValue === option.value;
                return (
                  <View key={option.value} style={styles.chipSlot}>
                    <Pressable
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => onChangeAmount(String(option.value))}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}>
                      <Text
                        style={[
                          styles.chipLabel,
                          selected && styles.chipLabelSelected,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.spacer} />
          <StackedActions
            primaryLabel="Continue"
            secondaryLabel="Cancel"
            onPrimary={continueToPayment}
            onSecondary={onBack}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};
