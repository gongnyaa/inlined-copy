import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SingletonBase } from './SingletonBase';

// テスト用の具象クラスを作成
class TestSingleton extends SingletonBase<TestSingleton> {
  public value: string = '';

  public setValue(value: string): void {
    this.value = value;
  }

  public getValue(): string {
    return this.value;
  }
}

describe('SingletonBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestSingleton.SetInstance(null);
  });

  it('Instance_HappyPath_ReturnsSameInstance', () => {
    // Arrange

    // Act
    const instance1 = TestSingleton.Instance();
    const instance2 = TestSingleton.Instance();

    // Assert
    expect(instance1).toBe(instance2);
  });

  it('Instance_HappyPath_MaintainsState', () => {
    // Arrange
    const testValue = 'test value';

    // Act
    const instance1 = TestSingleton.Instance();
    instance1.setValue(testValue);
    const instance2 = TestSingleton.Instance();

    // Assert
    expect(instance2.getValue()).toBe(testValue);
  });

  it('SetInstance_HappyPath_SetsCustomInstance', () => {
    // Arrange
    const customInstance = new TestSingleton();
    const testValue = 'custom instance';
    customInstance.setValue(testValue);

    // Act
    TestSingleton.SetInstance(customInstance);
    const retrievedInstance = TestSingleton.Instance();

    // Assert
    expect(retrievedInstance).toBe(customInstance);
    expect(retrievedInstance.getValue()).toBe(testValue);
  });

  it('SetInstance_HappyPath_ClearsInstance', () => {
    // Arrange
    const instance1 = TestSingleton.Instance();

    // Act
    TestSingleton.SetInstance(null);
    const instance2 = TestSingleton.Instance();

    // Assert
    expect(instance1).not.toBe(instance2);
  });
});
