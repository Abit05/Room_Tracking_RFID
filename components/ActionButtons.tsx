import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ActionButtonsProps {
  isLoading: boolean;
  onRefresh: () => void;
  onRegisterTest: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isLoading,
  onRefresh,
  onRegisterTest,
}) => {
  const buttons = [
    { text: 'Refresh Status', onPress: onRefresh, color: '#34C759' },
    { text: 'Register Employee', onPress: onRegisterTest, color: '#FF9500' },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.button, { backgroundColor: button.color }]}
          onPress={button.onPress}
          disabled={isLoading}
        >
          <Text style={styles.text}>{button.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    gap: 8,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});