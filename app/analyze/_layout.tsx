import { Stack } from 'expo-router';

export default function AnalyzeLayout() {
  return (
    <Stack>
      <Stack.Screen name="day-detail" options={{ title: 'Day detail' }} />
    </Stack>
  );
}
