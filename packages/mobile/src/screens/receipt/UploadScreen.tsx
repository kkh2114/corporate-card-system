import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Checkbox,
  Icon,
  Snackbar,
} from 'react-native-paper';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptsApi } from '../../api/receipts.api';
import { colors } from '../../constants/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReceiptStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<ReceiptStackParamList, 'Upload'>;

export const UploadScreen: React.FC<Props> = ({ navigation }) => {
  const { image, error: cameraError, takePhoto, pickFromGallery, clearImage } =
    useCamera();
  const {
    location,
    error: locationError,
    loading: locationLoading,
    accuracyLevel,
    getCurrentLocation,
  } = useLocation();

  const [note, setNote] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  const setStoreImage = useReceiptStore((s) => s.setImage);
  const setStoreLocation = useReceiptStore((s) => s.setLocation);
  const reset = useReceiptStore((s) => s.reset);

  useEffect(() => {
    reset();
    getCurrentLocation();
  }, [getCurrentLocation, reset]);

  useEffect(() => {
    if (image) setStoreImage(image);
  }, [image, setStoreImage]);

  useEffect(() => {
    if (location) setStoreLocation(location);
  }, [location, setStoreLocation]);

  const accuracyLabel =
    accuracyLevel === 'good'
      ? '좋음'
      : accuracyLevel === 'moderate'
        ? '보통'
        : '나쁨';

  const accuracyColor =
    accuracyLevel === 'good'
      ? colors.success
      : accuracyLevel === 'moderate'
        ? colors.warning
        : colors.error;

  const canUpload = image && location && !uploading;

  const handleUpload = async () => {
    if (!image || !location) return;

    setUploading(true);
    try {
      const result = await receiptsApi.scan({
        imageUri: image.uri,
        fileName: image.fileName,
        fileType: image.type,
        gps: location,
        note: note || undefined,
        isDelivery,
        isOnline,
      });

      navigation.replace('Confirm', {
        receiptId: result.receiptId,
        scanResult: result.ocrResult,
      });
    } catch {
      setSnackMessage('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Image Section */}
      <View style={styles.imageSection}>
        {image ? (
          <View>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <Button
              mode="text"
              onPress={clearImage}
              style={styles.retakeButton}
            >
              다시 선택
            </Button>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Icon source="camera" size={48} color={colors.disabled} />
            <Text style={styles.placeholderText}>
              영수증을 촬영하거나 갤러리에서 선택하세요
            </Text>
          </View>
        )}

        {cameraError && <Text style={styles.errorText}>{cameraError}</Text>}

        <View style={styles.imageButtons}>
          <Button
            mode="contained"
            icon="camera"
            onPress={takePhoto}
            style={styles.halfButton}
          >
            촬영
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={pickFromGallery}
            style={styles.halfButton}
          >
            갤러리
          </Button>
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <View style={styles.locationCard}>
          {locationLoading ? (
            <Text style={styles.locationText}>위치 수집 중...</Text>
          ) : location ? (
            <>
              <View style={styles.locationRow}>
                <Icon source="map-marker" size={20} color={colors.primary} />
                <Text style={styles.locationText}>
                  {location.address ??
                    `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                </Text>
              </View>
              <Text style={[styles.accuracyText, { color: accuracyColor }]}>
                정확도: {Math.round(location.accuracy)}m ({accuracyLabel})
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.errorText}>
                {locationError ?? 'GPS 위치를 가져올 수 없습니다.'}
              </Text>
              <Button mode="text" onPress={getCurrentLocation}>
                다시 시도
              </Button>
            </>
          )}
        </View>
      </View>

      {/* Note */}
      <View style={styles.section}>
        <TextInput
          label="메모 (선택)"
          value={note}
          onChangeText={setNote}
          mode="outlined"
          multiline
          maxLength={500}
          style={styles.noteInput}
        />
      </View>

      {/* Checkboxes */}
      <View style={styles.checkboxRow}>
        <Checkbox.Item
          label="배달 주문입니다"
          status={isDelivery ? 'checked' : 'unchecked'}
          onPress={() => setIsDelivery(!isDelivery)}
          position="leading"
          style={styles.checkbox}
        />
        <Checkbox.Item
          label="온라인 결제입니다"
          status={isOnline ? 'checked' : 'unchecked'}
          onPress={() => setIsOnline(!isOnline)}
          position="leading"
          style={styles.checkbox}
        />
      </View>

      {/* Upload Button */}
      <Button
        mode="contained"
        onPress={handleUpload}
        loading={uploading}
        disabled={!canUpload}
        style={styles.uploadButton}
        contentStyle={styles.uploadButtonContent}
      >
        업로드하기
      </Button>

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage('')}
        duration={3000}
        action={{ label: '확인', onPress: () => setSnackMessage('') }}
      >
        {snackMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageSection: {
    padding: 16,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  retakeButton: {
    marginTop: 4,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  placeholderText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  halfButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  accuracyText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 28,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  noteInput: {
    backgroundColor: colors.surface,
  },
  checkboxRow: {
    paddingHorizontal: 8,
  },
  checkbox: {
    paddingVertical: 2,
  },
  uploadButton: {
    margin: 16,
    marginBottom: 32,
    borderRadius: 8,
  },
  uploadButtonContent: {
    paddingVertical: 6,
  },
});
