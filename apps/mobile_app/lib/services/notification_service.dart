import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'navigation_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin
      flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    const InitializationSettings settings =
        InitializationSettings(
      android: androidSettings,
    );

    await flutterLocalNotificationsPlugin.initialize(
      settings,
      onDidReceiveNotificationResponse:
          (NotificationResponse response) {
        final String? payload = response.payload;

        if (payload == null || payload.isEmpty) {
          return;
        }

        try {
          final Map<String, dynamic> data =
              jsonDecode(payload) as Map<String, dynamic>;

          final String? type = data['type']?.toString();

          if (type == 'prescription_response') {
            final String? prescriptionId =
                data['prescriptionId']?.toString();

            NavigationService.navigatorKey.currentState
                ?.pushNamed(
              '/prescription_history',
              arguments: prescriptionId,
            );
          }

          if (type == 'reservation_completed') {
            final int? reservationId = int.tryParse(
              data['reservationId']?.toString() ?? '',
            );

            final int? pharmacyId = int.tryParse(
              data['pharmacyId']?.toString() ?? '',
            );

            final String pharmacyName =
                data['pharmacyName']?.toString() ??
                    'Pharmacy';

            NavigationService.navigatorKey.currentState
                ?.pushNamed(
              '/rating_review',
              arguments: {
                'reservationId': reservationId,
                'pharmacyId': pharmacyId,
                'pharmacyName': pharmacyName,
              },
            );
          }
        } catch (error) {
          debugPrint(
            'Notification payload error: $error',
          );
        }
      },
    );
  }

  static Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'medspot_channel',
      'MedSpot Notifications',
      channelDescription:
          'Notifications for prescriptions and reservations',
      importance: Importance.max,
      priority: Priority.high,
    );

    const NotificationDetails details =
        NotificationDetails(
      android: androidDetails,
    );

    await flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch
          .remainder(100000),
      title,
      body,
      details,
      payload: payload,
    );
  }
}