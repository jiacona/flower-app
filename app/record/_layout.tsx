import { Stack } from 'expo-router';

export default function RecordLayout() {
  return (
    <Stack>
      <Stack.Screen name="stem-entry" options={{ title: 'Record harvest' }} />
    </Stack>
  );
}
