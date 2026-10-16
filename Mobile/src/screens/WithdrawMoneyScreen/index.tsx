import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { showMessage } from 'react-native-flash-message';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  createUpiAccount,
  deleteUpiAccount,
  fetchUpiAccounts,
  submitWithdrawal,
  updateUpiAccount,
  type UpiAccount,
} from '../../api/withdrawalApi';
import { fetchWallet } from '../../api/rechargeApi';
import { NavHeader, NoticeBanner, StackedActions } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { colors } from '../../theme';
import { styles } from './styles';

interface WithdrawMoneyScreenProps {
  onBack: () => void;
}

function bankName(upiId: string): string {
  const handle = upiId.split('@')[1]?.replace(/[^a-z0-9]/gi, ' ').trim();
  return handle ? handle.replace(/\b\w/g, letter => letter.toUpperCase()) : 'UPI';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function formatBalance(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)
    : '0';
}

export const WithdrawMoneyScreen: React.FC<WithdrawMoneyScreenProps> = ({
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const upiInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [amountFocused, setAmountFocused] = useState(false);
  const [upiFocused, setUpiFocused] = useState(false);
  const [accounts, setAccounts] = useState<UpiAccount[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draftUpi, setDraftUpi] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUpiEditorVisible, setIsUpiEditorVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([fetchWallet(), fetchUpiAccounts()])
      .then(([wallet, savedAccounts]) => {
        if (!active) {
          return;
        }
        setBalance(wallet.balance);
        setAccounts(savedAccounts);
        setSelectedId(savedAccounts[0]?.id ?? '');
      })
      .catch(error => {
        if (active) {
          showMessage({
            message: getErrorMessage(error, 'Could not load your withdrawal details.'),
            type: 'danger',
          });
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const focusUpiEditor = (account?: UpiAccount) => {
    setEditingId(account?.id ?? null);
    setDraftUpi(account?.upiId ?? '');
    setIsUpiEditorVisible(true);
    requestAnimationFrame(() => upiInputRef.current?.focus());
  };

  const closeUpiEditor = () => {
    setIsUpiEditorVisible(false);
    setEditingId(null);
    setDraftUpi('');
  };

  const saveUpi = async () => {
    const upiId = draftUpi.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9][A-Za-z0-9.-]*$/.test(upiId)) {
      showMessage({ message: 'Enter a valid UPI ID, such as name@bank.', type: 'danger' });
      return;
    }

    setIsSavingUpi(true);
    try {
      if (editingId) {
        const updated = await updateUpiAccount(editingId, upiId);
        setAccounts(current =>
          current.map(account => (account.id === updated.id ? updated : account)),
        );
        showMessage({ message: 'UPI ID updated.', type: 'success' });
      } else {
        const created = await createUpiAccount(upiId);
        setAccounts(current => [...current, created]);
        setSelectedId(created.id);
        showMessage({ message: 'UPI ID added.', type: 'success' });
      }
      closeUpiEditor();
    } catch (error) {
      showMessage({
        message: getErrorMessage(error, 'Could not save this UPI ID.'),
        type: 'danger',
      });
    } finally {
      setIsSavingUpi(false);
    }
  };

  const deleteUpi = async (account: UpiAccount) => {
    setDeletingId(account.id);
    try {
      await deleteUpiAccount(account.id);
      const nextAccounts = accounts.filter(item => item.id !== account.id);
      setAccounts(nextAccounts);
      if (selectedId === account.id) {
        setSelectedId(nextAccounts[0]?.id ?? '');
      }
      if (editingId === account.id) {
        closeUpiEditor();
      }
      showMessage({ message: 'UPI ID deleted.', type: 'success' });
    } catch (error) {
      showMessage({
        message: getErrorMessage(error, 'Could not delete this UPI ID.'),
        type: 'danger',
      });
    } finally {
      setDeletingId('');
    }
  };

  const removeUpi = (account: UpiAccount) => {
    Alert.alert('Delete UPI ID', `Remove ${account.upiId} from your saved UPI IDs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteUpi(account);
        },
      },
    ]);
  };

  const withdraw = async () => {
    const requestedAmount = Number(amount);
    const availableBalance = Number(balance);
    if (!Number.isInteger(requestedAmount) || requestedAmount < 100) {
      showMessage({ message: 'Minimum withdrawal is ₹100.', type: 'danger' });
      return;
    }
    if (requestedAmount > availableBalance) {
      showMessage({ message: 'Withdrawal amount exceeds your available balance.', type: 'danger' });
      return;
    }
    if (!selectedId) {
      showMessage({ message: 'Select a UPI ID for this withdrawal.', type: 'danger' });
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await submitWithdrawal({
        amount: requestedAmount,
        upiAccountId: selectedId,
      });
      setBalance(String(availableBalance - requestedAmount));
      showMessage({ message, type: 'success' });
      onBack();
    } catch (error) {
      showMessage({
        message: getErrorMessage(error, 'Could not submit the withdrawal.'),
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestedAmount = Number(amount);
  const canWithdraw =
    !isLoading &&
    !isSubmitting &&
    selectedId.length > 0 &&
    Number.isInteger(requestedAmount) &&
    requestedAmount >= 100 &&
    requestedAmount <= Number(balance);

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Withdraw Money" onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          <LinearGradient
            colors={[colors.primary, '#5190EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>₹{formatBalance(balance)}</Text>
            <Text style={styles.balanceHint}>
              You can withdraw up to ₹{formatBalance(balance)}
            </Text>
          </LinearGradient>

          <View style={styles.block}>
            <Text style={[styles.label, styles.fieldLabel]}>Withdrawal Amount</Text>
            <View style={[styles.inputShell, amountFocused && styles.inputFocused]}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={value => setAmount(value.replace(/[^\d]/g, ''))}
                placeholder="Enter amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
              />
            </View>
            <Text style={styles.helper}>Minimum withdrawal: ₹100</Text>
          </View>

          <View style={styles.block}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Select UPI ID</Text>
              <Pressable
                style={styles.addLink}
                onPress={() => focusUpiEditor()}
                disabled={isSavingUpi || Boolean(deletingId)}
                accessibilityRole="button"
                accessibilityLabel="Add UPI">
                <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                <Text style={styles.addLinkText}>Add UPI</Text>
              </Pressable>
            </View>
            {accounts.length ? (
              <View style={styles.upiList}>
                {accounts.map((account, index) => (
                  <Pressable
                    key={account.id}
                    style={[
                      styles.upiRow,
                      index < accounts.length - 1 && styles.upiRowBorder,
                    ]}
                    onPress={() => setSelectedId(account.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedId === account.id }}>
                    <View style={styles.upiLeft}>
                      <View style={styles.radio}>
                        {selectedId === account.id ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.upiCopy}>
                        <Text style={styles.upiId} numberOfLines={1}>
                          {account.upiId}
                        </Text>
                        <Text style={styles.upiBank}>{bankName(account.upiId)}</Text>
                      </View>
                    </View>
                    <View style={styles.upiRight}>
                      <View style={styles.iconActions}>
                        <Pressable
                          style={styles.iconButton}
                          hitSlop={6}
                          accessibilityLabel={`Edit ${account.upiId}`}
                          disabled={isSavingUpi || Boolean(deletingId)}
                          onPress={() => focusUpiEditor(account)}>
                          <MaterialCommunityIcons
                            name="pencil-outline"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.iconButton}
                          hitSlop={6}
                          accessibilityLabel={`Delete ${account.upiId}`}
                          disabled={isSavingUpi || Boolean(deletingId)}
                          onPress={() => removeUpi(account)}>
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.helper}>Add a UPI ID to receive your withdrawal.</Text>
            )}
          </View>

          {isUpiEditorVisible ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>
                {editingId ? 'Update UPI ID' : 'Add New UPI ID'}
              </Text>
              <View style={styles.addCard}>
                <TextInput
                  ref={upiInputRef}
                  value={draftUpi}
                  onChangeText={setDraftUpi}
                  placeholder="Enter UPI ID (e.g., name@bank)"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.upiInput, upiFocused && styles.inputFocused]}
                  onFocus={() => setUpiFocused(true)}
                  onBlur={() => setUpiFocused(false)}
                />
                <Pressable
                  style={[styles.addButton, isSavingUpi && styles.disabledButton]}
                  onPress={saveUpi}
                  disabled={isSavingUpi}
                  accessibilityRole="button"
                  accessibilityLabel={editingId ? 'Update UPI ID' : 'Add UPI ID'}>
                  <Text style={styles.addButtonLabel}>
                    {isSavingUpi ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={closeUpiEditor}
                  disabled={isSavingUpi}>
                  <Text style={styles.cancelButtonLabel}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.notice}>
            <NoticeBanner
              compact
              icon="check-circle-outline"
              title="Fast & Secure"
              message="Withdrawals process within 1-2 hours"
              color={colors.secondary}
              backgroundColor={colors.greenSoft}
            />
          </View>

          <View style={styles.spacer} />
          <StackedActions
            primaryLabel={isSubmitting ? 'Submitting...' : 'Withdraw Now'}
            secondaryLabel="Cancel"
            onPrimary={withdraw}
            onSecondary={onBack}
            primaryDisabled={!canWithdraw}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};
