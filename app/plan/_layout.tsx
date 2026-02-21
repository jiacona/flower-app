import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack>
      <Stack.Screen name="crop-detail" options={{ title: 'Crop detail' }} />
    </Stack>
  );
}
