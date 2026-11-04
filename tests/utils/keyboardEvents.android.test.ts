const mockListeners = new Map<string, (event: unknown) => void>();
const mockRemove = jest.fn();
const mockAddListener = jest.fn(
  (eventName: string, listener: (event: unknown) => void) => {
    mockListeners.set(eventName, listener);
    return { remove: mockRemove };
  },
);

jest.doMock('react-native', () => ({
  Keyboard: {
    addListener: mockAddListener,
    isVisible: () => false,
    metrics: () => undefined,
  },
  Platform: { OS: 'android' },
}));

describe('Android keyboard events', () => {
  afterEach(() => {
    jest.dontMock('react-native');
    mockListeners.clear();
    mockAddListener.mockClear();
    mockRemove.mockClear();
  });

  it('subscribes to did-show and did-hide and normalizes both states', () => {
    jest.isolateModules(() => {
      const {
        getKeyboardState,
        resetKeyboardStateForTests,
        subscribeKeyboardState,
      } =
        require('../../src/utils/keyboardEvents') as typeof import('../../src/utils/keyboardEvents');
      const { getKeyboardEventNames, isAndroid, isIOS } =
        require('../../src/utils/platform') as typeof import('../../src/utils/platform');
      const notify = jest.fn();

      expect(getKeyboardEventNames()).toEqual({
        show: 'keyboardDidShow',
        hide: 'keyboardDidHide',
      });
      expect(isAndroid).toBe(true);
      expect(isIOS).toBe(false);

      const unsubscribe = subscribeKeyboardState(notify);
      expect(
        mockAddListener.mock.calls.map(([eventName]) => eventName),
      ).toEqual(['keyboardDidShow', 'keyboardDidHide']);

      mockListeners.get('keyboardDidShow')?.({
        duration: 0,
        endCoordinates: { height: 280, screenY: 500 },
      });
      expect(getKeyboardState()).toMatchObject({
        isVisible: true,
        height: 280,
        progress: 1,
        animationDuration: 0,
        screenY: 500,
      });

      mockListeners.get('keyboardDidHide')?.({
        duration: 0,
        endCoordinates: { height: 0, screenY: 800 },
      });
      expect(getKeyboardState()).toMatchObject({
        isVisible: false,
        height: 0,
        progress: 0,
      });
      expect(notify).toHaveBeenCalledTimes(2);

      unsubscribe();
      expect(mockRemove).toHaveBeenCalledTimes(2);
      resetKeyboardStateForTests();
    });
  });
});
