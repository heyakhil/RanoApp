import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GenderChips } from '../../components/molecules/GenderChips';
import { AuthShell } from '../../components/organisms/AuthShell';
import { useAuth } from '../../context/AuthContext';
import type { Gender } from '../../types/auth';
import { colors } from '../../theme';
import { styles } from './styles';

interface FormState {
  name: string;
  mobile: string;
  dob: string;
  gender: Gender | '';
}

interface FormErrors {
  name?: string;
  mobile?: string;
  dob?: string;
  gender?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Enter your full name';
  }

  if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
    errors.mobile = 'Enter a valid 10-digit mobile number';
  }

  const dobDate = new Date(form.dob);
  if (!form.dob || Number.isNaN(dobDate.getTime()) || dobDate >= new Date()) {
    errors.dob = 'Use a valid past date (YYYY-MM-DD)';
  }

  if (!form.gender) {
    errors.gender = 'Select a gender option';
  }

  return errors;
}

export const CompleteProfileScreen: React.FC = () => {
  const { user, completeProfile, isSubmitting, error } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '',
    mobile: '',
    dob: '',
    gender: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const canSubmit = useMemo(
    () => Object.keys(validateForm(form)).length === 0,
    [form],
  );

  const onSubmit = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !form.gender) {
      return;
    }

    await completeProfile({
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      dob: form.dob.trim(),
      gender: form.gender,
    });
  };

  return (
    <AuthShell scrollable>
      <View style={styles.stepPill}>
        <Text style={styles.stepText}>ALMOST THERE</Text>
      </View>

      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        Add a few details so we can personalize your Rano experience.
      </Text>

      {user?.email ? (
        <View style={styles.emailChip}>
          <MaterialCommunityIcons
            name="email-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.emailText}>{user.email}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <TextInput
          label="Full name"
          mode="outlined"
          value={form.name}
          onChangeText={name => setForm(prev => ({ ...prev, name }))}
          autoCapitalize="words"
          style={styles.input}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
        />
        {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}
      </View>

      <View style={styles.field}>
        <TextInput
          label="Mobile number"
          mode="outlined"
          value={form.mobile}
          onChangeText={mobile => setForm(prev => ({ ...prev, mobile }))}
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Affix text="+91 " />}
        />
        {errors.mobile ? (
          <HelperText type="error">{errors.mobile}</HelperText>
        ) : null}
      </View>

      <View style={styles.field}>
        <TextInput
          label="Date of birth"
          mode="outlined"
          value={form.dob}
          onChangeText={dob => setForm(prev => ({ ...prev, dob }))}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="calendar-outline" />}
        />
        {errors.dob ? <HelperText type="error">{errors.dob}</HelperText> : null}
      </View>

      <View style={styles.genderBlock}>
        <GenderChips
          value={form.gender}
          onChange={gender => setForm(prev => ({ ...prev, gender }))}
          error={errors.gender}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Button
        mode="contained"
        loading={isSubmitting}
        disabled={isSubmitting || !canSubmit}
        onPress={() => {
          void onSubmit();
        }}
        style={styles.submit}
        contentStyle={styles.submitContent}
        labelStyle={styles.submitLabel}
        buttonColor={colors.navy}
        textColor={colors.white}>
        Save and continue
      </Button>
    </AuthShell>
  );
};
