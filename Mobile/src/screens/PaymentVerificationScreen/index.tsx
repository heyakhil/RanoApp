import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Clipboard, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchPaymentDestination,
  submitRecharge,
  type PaymentProof,
} from '../../api/rechargeApi';
import { NavHeader, NoticeBanner, StackedActions } from '../../components/molecules';
import { ScreenLayout } from '../../components/templates';
import { colors } from '../../theme';
import { styles } from './styles';

interface PaymentVerificationScreenProps {
  amount: string;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const STEPS = [
  { number: '1', label: 'Amount Selected', color: colors.primary },
  { number: '2', label: 'Upload Proof', color: colors.secondary },
] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export const PaymentVerificationScreen: React.FC<
  PaymentVerificationScreenProps
> = ({ amount, onBack, onCancel, onSubmit }) => {
  const insets = useSafeAreaInsets();
  const [referenceId, setReferenceId] = useState('');
  const [focused, setFocused] = useState(false);
  const [screenshot, setScreenshot] = useState<PaymentProof | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [isLoadingDestination, setIsLoadingDestination] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchPaymentDestination()
      .then(destination => {
        if (!active) {
          return;
        }
        setUpiId(destination.upiId);
        setQrImageUrl(destination.qrImageUrl);
      })
      .catch(loadError => {
        if (active) {
          showMessage({
            message: getErrorMessage(loadError, 'Could not load payment details.'),
            type: 'danger',
          });
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingDestination(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const copyUpiId = () => {
    if (!upiId) {
      return;
    }

    Clipboard.setString(upiId);
    showMessage({ message: 'UPI ID copied.', type: 'success' });
  };

  const pickScreenshot = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showMessage({
          message: result.errorMessage || 'Could not open the photo library.',
          type: 'danger',
        });
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        showMessage({
          message: 'Could not select the payment screenshot. Please try again.',
          type: 'danger',
        });
        return;
      }

      setScreenshot({
        uri: asset.uri,
        name: asset.fileName ?? 'payment.jpg',
        type: asset.type ?? 'image/jpeg',
      });
      setError('');
    } catch (pickerError) {
      showMessage({
        message: getErrorMessage(
          pickerError,
          'Could not select the payment screenshot. Please try again.',
        ),
        type: 'danger',
      });
    }
  };

  const submit = async () => {
    const reference = referenceId.trim();

    if (!screenshot) {
      setError('Upload the payment screenshot');
      return;
    }

    if (reference.length < 4) {
      setError('Enter the transaction reference ID');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const message = await submitRecharge({
        amount,
        referenceId: reference,
        screenshot,
      });
      showMessage({ message, type: 'success' });
      onSubmit();
    } catch (submitError) {
      showMessage({
        message: getErrorMessage(
          submitError,
          'Could not submit the recharge. Please try again.',
        ),
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout showHeader={false}>
      <NavHeader title="Payment Verification" onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          <View style={styles.progress}>
            {STEPS.map(step => (
              <View key={step.number} style={styles.step}>
                <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                <Text style={[styles.stepLabel, { color: step.color }]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.payCard}>
            <Text style={styles.payTitle}>Send Payment To</Text>
            {isLoadingDestination ? (
              <ActivityIndicator color={colors.primary} />
            ) : upiId ? (
              <>
                <Text style={styles.payLabel}>UPI ID</Text>
                <View style={styles.upiRow}>
                  <Text style={styles.upiValue} selectable>
                    {upiId}
                  </Text>
                  <Pressable
                    onPress={copyUpiId}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Copy UPI ID"
                  >
                    <MaterialCommunityIcons
                      name="content-copy"
                      size={18}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
                {qrImageUrl ? (
                  <View style={styles.qrBox}>
                    <Text style={styles.payLabel}>Scan to Pay</Text>
                    <Image
                      source={{ uri: qrImageUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                      accessibilityLabel="Payment QR code"
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.payEmpty}>
                Payment details are not available yet. Please try again later.
              </Text>
            )}
          </View>

          <View style={styles.notice}>
            <NoticeBanner
              icon="alert-circle-outline"
              title="Upload Payment Proof"
              message={`Submit proof for ₹${amount}. The amount is added to your wallet after admin approval.`}
              color={colors.amber}
              backgroundColor={colors.amberSoft}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Payment Screenshot</Text>
            <Pressable
              style={styles.upload}
              onPress={() => {
                void pickScreenshot();
              }}
              accessibilityRole="button"
              accessibilityLabel="Upload payment screenshot">
              {screenshot ? (
                <Image source={{ uri: screenshot.uri }} style={styles.preview} />
              ) : (
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={32}
                  color={colors.textSecondary}
                  style={styles.uploadIcon}
                />
              )}
              <Text style={styles.uploadTitle}>
                {screenshot ? 'Tap to change screenshot' : 'Click to upload or drag & drop'}
              </Text>
              <Text style={styles.uploadHint}>PNG, JPG up to 5MB</Text>
            </Pressable>
          </View>

          <View style={styles.fieldLast}>
            <Text style={styles.label}>Transaction Reference ID</Text>
            <View style={[styles.inputShell, focused && styles.inputFocused]}>
              <TextInput
                value={referenceId}
                onChangeText={value => {
                  setError('');
                  setReferenceId(value);
                }}
                placeholder="Enter reference ID or UTR number"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                autoCapitalize="characters"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            <Text style={styles.helper}>
              You can find this in your bank statement
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.spacer} />
          <StackedActions
            primaryLabel={isSubmitting ? 'Submitting' : 'Submit'}
            secondaryLabel="Cancel"
            primaryDisabled={isSubmitting}
            onPrimary={() => {
              void submit();
            }}
            onSecondary={onCancel}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};
