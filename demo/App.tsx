import React, { createRef, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareView,
  KeyboardDismissButton,
  KeyboardProvider,
  KeyboardToolbar,
  useFocusedInput,
  useKeyboard,
  useKeyboardAnimation,
  useKeyboardState,
  focusInput,
  getFocusedInput,
  isAndroid,
  isIOS,
  measureFocusedInput,
  type TextInputRef,
  type FocusedInputLayout,
} from '../src';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const fields = [
  { label: 'Full name', placeholder: 'e.g. Alex Morgan' },
  {
    label: 'Email address',
    placeholder: 'alex@example.com',
    keyboardType: 'email-address' as const,
  },
  {
    label: 'Phone number',
    placeholder: '+1 (555) 000-0000',
    keyboardType: 'phone-pad' as const,
  },
  { label: 'Company', placeholder: 'Your organization' },
  { label: 'Role', placeholder: 'What do you do?' },
  { label: 'City', placeholder: 'City' },
  { label: 'Country', placeholder: 'Country' },
  {
    label: 'Website',
    placeholder: 'https://example.com',
    keyboardType: 'url' as const,
  },
  ...Array.from({ length: 7 }, (_, index) => ({
    label: `Additional detail ${index + 1}`,
    placeholder: 'Enter a value',
  })),
];

const behaviors = ['smart', 'scroll', 'resize', 'padding', 'none'] as const;
type DemoMode = 'scroll' | 'view';

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function KeyboardStatus({
  focusedIndex,
  firstInputRef,
}: {
  focusedIndex: number;
  firstInputRef: React.RefObject<TextInputRef | null>;
}): React.JSX.Element {
  const keyboard = useKeyboard();
  const keyboardState = useKeyboardState();
  const { progress, animationDuration } = useKeyboardAnimation();
  const { focusedInput } = useFocusedInput();
  const [animationProgress, setAnimationProgress] = useState<number>(
    keyboard.progress,
  );

  useEffect(() => {
    const subscription = progress.addListener(({ value }) => {
      setAnimationProgress(value);
    });
    return () => progress.removeListener(subscription);
  }, [progress]);

  const statusText = keyboard.isVisible ? 'Keyboard open' : 'Ready to test';
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHeading}>
        <View
          style={[
            styles.statusDot,
            keyboard.isVisible && styles.statusDotVisible,
          ]}
        />
        <Text style={styles.statusTitle}>{statusText}</Text>
        <Text style={styles.sharedState}>
          {keyboardState === keyboard ? 'Shared state' : 'State mismatch'}
        </Text>
      </View>
      <View style={styles.metrics}>
        <Metric label="Keyboard" value={`${Math.round(keyboard.height)} pt`} />
        <Metric
          label="Top edge"
          value={
            keyboard.screenY === undefined
              ? '—'
              : `${Math.round(keyboard.screenY)} pt`
          }
        />
        <Metric label="Animation" value={`${animationDuration} ms`} />
        <Metric
          label="Progress"
          value={`${Math.round(animationProgress * 100)}%`}
        />
      </View>
      <Text style={styles.focusInfo}>
        Focused ref: {focusedIndex < 0 ? 'none' : `#${focusedIndex + 1}`}
        {'  ·  '}
        {focusedInput
          ? `field ${Math.round(focusedInput.y)} × ${Math.round(
              focusedInput.height,
            )} pt`
          : 'no measured field'}
      </Text>
      <UtilityActions firstInputRef={firstInputRef} />
    </View>
  );
}

function UtilityActions({
  firstInputRef,
}: {
  firstInputRef: React.RefObject<TextInputRef | null>;
}): React.JSX.Element {
  const [measuredInput, setMeasuredInput] = useState<FocusedInputLayout | null>(
    null,
  );
  const platform = isAndroid ? 'Android' : isIOS ? 'iOS' : 'Other';

  const refreshMeasurement = async () => {
    setMeasuredInput(await measureFocusedInput(getFocusedInput()));
  };

  return (
    <View style={styles.utilityRow}>
      <Text style={styles.utilityPlatform}>{platform} utilities</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => focusInput(firstInputRef)}
        style={styles.utilityButton}
      >
        <Text style={styles.utilityButtonText}>Focus first</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={refreshMeasurement}
        style={styles.utilityButton}
      >
        <Text style={styles.utilityButtonText}>Measure focus</Text>
      </Pressable>
      {measuredInput && (
        <Text style={styles.utilityMeasurement}>
          {Math.round(measuredInput.y)} × {Math.round(measuredInput.height)} pt
        </Text>
      )}
    </View>
  );
}

function DemoContent(): React.JSX.Element {
  const [mode, setMode] = useState<DemoMode>('scroll');
  const [behavior, setBehavior] = useState<(typeof behaviors)[number]>('smart');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [submitted, setSubmitted] = useState(false);
  const inputRefs = useRef(
    Array.from({ length: fields.length + 1 }, () => createRef<TextInputRef>()),
  );
  const allInputRefs = inputRefs.current;

  const renderField = (field: (typeof fields)[number], index: number) => (
    <View key={field.label} style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        ref={allInputRefs[index]}
        accessibilityLabel={field.label}
        autoCapitalize={
          field.keyboardType === 'email-address' || field.keyboardType === 'url'
            ? 'none'
            : 'words'
        }
        keyboardType={field.keyboardType ?? 'default'}
        onSubmitEditing={() => allInputRefs[index + 1]?.current?.focus()}
        placeholder={field.placeholder}
        placeholderTextColor="#98A2B3"
        returnKeyType={index === fields.length - 1 ? 'done' : 'next'}
        style={styles.input}
      />
    </View>
  );

  const submit = () => {
    setSubmitted(true);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandGlyph}>K</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>KEYBOARD SHEPHERD</Text>
          <Text style={styles.title}>Stay in the flow.</Text>
        </View>
      </View>

      <View style={styles.fixedContent}>
        <KeyboardStatus
          focusedIndex={focusedIndex}
          firstInputRef={allInputRefs[0]}
        />
        <View style={styles.modePicker}>
          {(['scroll', 'view'] as const).map(item => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setMode(item)}
              style={[
                styles.modeButton,
                mode === item && styles.modeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.modeLabel,
                  mode === item && styles.modeLabelActive,
                ]}
              >
                {item === 'scroll' ? 'Aware scroll' : 'Aware view'}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          horizontal
          contentContainerStyle={styles.behaviorPicker}
          showsHorizontalScrollIndicator={false}
        >
          {behaviors.map(item => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: behavior === item }}
              onPress={() => setBehavior(item)}
              style={[
                styles.behaviorButton,
                behavior === item && styles.behaviorButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.behaviorLabel,
                  behavior === item && styles.behaviorLabelActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {mode === 'scroll' ? (
        <KeyboardAwareScrollView
          behavior={behavior}
          contentContainerStyle={styles.formContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          // keyboardSpacing={130}
        >
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Create your profile</Text>
            <Text style={styles.formDescription}>
              Long-form fields, multiline input, and a bottom action.
            </Text>
          </View>
          {fields.map(renderField)}
          <View style={styles.field}>
            <Text style={styles.label}>A little about you</Text>
            <TextInput
              ref={allInputRefs[fields.length]}
              accessibilityLabel="A little about you"
              multiline
              numberOfLines={4}
              onSubmitEditing={submit}
              placeholder="Write a short introduction..."
              placeholderTextColor="#98A2B3"
              style={[styles.input, styles.multiline]}
              textAlignVertical="top"
            />
          </View>
        </KeyboardAwareScrollView>
      ) : (
        <KeyboardAwareView
          behavior={behavior}
          keyboardSpacing={20}
          style={styles.viewDemo}
        >
          <View>
            <Text style={styles.formTitle}>Compact layout</Text>
            <Text style={styles.formDescription}>
              This view adds keyboard space without automatic scrolling.
            </Text>
            {fields.slice(0, 2).map(renderField)}
            <KeyboardDismissButton style={styles.dismissButton}>
              <Text style={styles.dismissText}>Dismiss keyboard</Text>
            </KeyboardDismissButton>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={submit}
            style={styles.submit}
          >
            <Text style={styles.submitText}>
              {submitted ? 'Saved' : 'Continue'}
            </Text>
          </Pressable>
        </KeyboardAwareView>
      )}
      <KeyboardToolbar
        inputRefs={allInputRefs}
        onFocusedInputChange={setFocusedIndex}
        doneText="Done"
        onDone={() => setFocusedIndex(-1)}
        style={styles.toolbar}
      />
      <KeyboardAwareView
        behavior="smart"
        keyboardSpacing={12}
        style={
          mode === 'scroll' ? styles.stickyFooter : styles.toolbarContainer
        }
      >
        {mode === 'scroll' && (
          <Pressable
            accessibilityRole="button"
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
            ]}
          >
            <Text style={styles.submitText}>
              {submitted ? 'Profile saved' : 'Save profile'}
            </Text>
            <Text style={styles.submitArrow}>→</Text>
          </Pressable>
        )}
      </KeyboardAwareView>
    </SafeAreaView>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <KeyboardProvider debug>
        <DemoContent />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8FC', flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 13,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandGlyph: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  headerCopy: { gap: 2 },
  eyebrow: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: { color: '#101828', fontSize: 20, fontWeight: '700' },
  fixedContent: { paddingHorizontal: 18 },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
  },
  statusHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusDot: {
    backgroundColor: '#98A2B3',
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  statusDotVisible: { backgroundColor: '#12B76A' },
  statusTitle: { color: '#344054', fontSize: 13, fontWeight: '600' },
  sharedState: {
    color: '#667085',
    fontSize: 10,
    marginLeft: 'auto',
  },
  metrics: {
    borderTopColor: '#F2F4F7',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
    paddingTop: 10,
  },
  metric: { gap: 3 },
  metricValue: { color: '#101828', fontSize: 12, fontWeight: '700' },
  metricLabel: { color: '#667085', fontSize: 9 },
  focusInfo: { color: '#667085', fontSize: 10, marginTop: 9 },
  utilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  utilityPlatform: { color: '#667085', fontSize: 10, fontWeight: '600' },
  utilityButton: {
    backgroundColor: '#F2F4F7',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  utilityButtonText: { color: '#344054', fontSize: 10, fontWeight: '600' },
  utilityMeasurement: { color: '#667085', fontSize: 10 },
  modePicker: {
    backgroundColor: '#EAECF0',
    borderRadius: 11,
    flexDirection: 'row',
    marginTop: 12,
    padding: 3,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  modeButtonActive: { backgroundColor: '#FFFFFF' },
  modeLabel: { color: '#667085', fontSize: 12, fontWeight: '600' },
  modeLabelActive: { color: '#155EEF' },
  behaviorPicker: { gap: 8, paddingVertical: 9 },
  behaviorButton: {
    borderColor: '#D0D5DD',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  behaviorButtonActive: { backgroundColor: '#EAF0FF', borderColor: '#A6BCFF' },
  behaviorLabel: { color: '#475467', fontSize: 11, fontWeight: '600' },
  behaviorLabelActive: { color: '#155EEF' },
  formContent: { paddingHorizontal: 20, paddingTop: 9, paddingBottom: 150 },
  formHeader: { marginBottom: 17 },
  formTitle: { color: '#101828', fontSize: 21, fontWeight: '700' },
  formDescription: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 13,
  },
  field: { marginBottom: 13 },
  label: { color: '#344054', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 10,
    borderWidth: 1,
    color: '#101828',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: { minHeight: 100, paddingTop: 12 },
  submit: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    // minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    // paddingBottom: 14,
    // marginTop: 4,
  },
  submitPressed: { backgroundColor: '#1849A9' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  submitArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 9,
  },
  dismissButton: { alignItems: 'center', paddingVertical: 14 },
  dismissText: { color: '#475467', fontSize: 12, fontWeight: '600' },
  stickyFooter: {
    backgroundColor: '#F6F8FC',
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    // position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  viewDemo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  toolbarContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F6F8FC',
  },
  toolbar: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderRadius: 12,
    borderWidth: 1,
  },
});
