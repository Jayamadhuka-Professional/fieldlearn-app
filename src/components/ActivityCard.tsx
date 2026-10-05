import { Pressable, StyleSheet, Text, View } from 'react-native';

type ActivityCardProps = {
  category: string;
  title: string;
  description: string;
  requiresPhoto?: boolean;
  requiresLocation?: boolean;
  offlineSupported?: boolean;
  inProgress?: boolean;
  testID?: string;
  onPress: () => void;
};

export default function ActivityCard({
  category,
  title,
  description,
  requiresPhoto = false,
  requiresLocation = false,
  offlineSupported = false,
  inProgress = false,
  testID,
  onPress,
}: ActivityCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{category}</Text>

      {inProgress && (
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>IN PROGRESS</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.features}>
        {requiresPhoto && (
          <Text style={styles.featureText}>📷 Photo required</Text>
        )}

        {requiresLocation && (
          <Text style={styles.featureText}>📍 Location</Text>
        )}

        {offlineSupported && (
          <Text style={styles.featureText}>✓ Offline supported</Text>
        )}
      </View>

      <Pressable
        testID={testID}
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>
          {inProgress ? 'Continue Activity' : 'View Activity'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },

  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginBottom: 16,
  },

  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },

  featureText: {
    fontSize: 13,
    color: '#374151',
  },

  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  progressBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },

  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
});