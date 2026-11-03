import { TextInput } from 'react-native';
import { measureFocusedInput } from '../../src/utils/focusManager';
import { getFocusedInput } from '../../src/utils/focusManager';

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
