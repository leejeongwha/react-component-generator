import { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  deserialize?: (raw: string) => T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return deserialize ? deserialize(item) : (JSON.parse(item) as T);
    } catch {
      return initialValue;
    }
  });

  // key가 변경되면 새 key의 저장값으로 동기화한다
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(
        item !== null
          ? deserialize
            ? deserialize(item)
            : (JSON.parse(item) as T)
          : initialValue,
      );
    } catch {
      setStoredValue(initialValue);
    }
    // initialValue·deserialize는 호출부에서 안정적인 참조를 전달해야 한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // localStorage 동기화를 state updater 바깥 effect에서 수행한다
  // updater 내부 side effect는 React Strict Mode에서 두 번 실행되어 stale 값을 쓸 수 있다
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage 사용 불가(시크릿 모드 등)일 때 무시
    }
  }, [key, storedValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) =>
        // instanceof Function 대신 typeof를 사용한다:
        // T가 함수 타입일 때 instanceof가 updater로 잘못 처리되는 것을 방지한다
        typeof value === 'function' ? (value as (prev: T) => T)(prev) : value,
      );
    },
    [],
  );

  return [storedValue, setValue];
}
