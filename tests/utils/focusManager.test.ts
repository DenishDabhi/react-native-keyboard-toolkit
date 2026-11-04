import { TextInput } from 'react-native';
import {
  focusInput,
  getFocusedInput,
  measureFocusedInput,
} from '../../src/utils/focusManager';
import type { TextInputRef } from '../../src/types';

describe('measureFocusedInput', () => {
  it('returns measured window coordinates', async () => {
    const result = await measureFocusedInput({
      measureInWindow: callback => callback(10, 20, 200, 48),
    });

    expect(result).toEqual({ x: 10, y: 20, width: 200, height: 48 });
  });

  it('returns null when the native input cannot be measured', async () => {
    await expect(measureFocusedInput(null)).resolves.toBeNull();
  });

  it('uses React Native state to find the focused native input', () => {
    const input = {
      measureInWindow: jest.fn(),
    } as unknown as ReturnType<typeof TextInput.State.currentlyFocusedInput>;
    const focusedInput = jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue(input);

    expect(getFocusedInput()).toBe(input);
    focusedInput.mockRestore();
  });
});

describe('focusInput', () => {
  it('focuses a mounted input and reports whether a ref is available', () => {
    const focus = jest.fn();
    const input = { focus } as unknown as TextInputRef;

    expect(focusInput({ current: input })).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focusInput({ current: null })).toBe(false);
  });
});
