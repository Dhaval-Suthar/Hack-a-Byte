"use server";

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface DeviceSessionData {
  userId: string;
  username: string;
  deviceId: string;
  deviceType: string;
  playspaceId: string;
  iat: number;
  exp: number;
}

/**
 * Creates a secure JWT token for device user authentication
 */
export async function createDeviceSession(
  userId: string,
  username: string,
  deviceId: string,
  deviceType: string,
  playspaceId: string
): Promise<string> {
  const payload = {
    userId,
    username,
    deviceId,
    deviceType,
    playspaceId,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'hackabyte',
    audience: 'device-user'
  });

  // Set secure httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(`device_session_${deviceId}_${deviceType}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return token;
}

/**
 * Validates and decodes a device session token
 */
export async function validateDeviceSession(
  deviceId: string,
  deviceType: string
): Promise<DeviceSessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(`device_session_${deviceId}_${deviceType}`)?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'hackabyte',
      audience: 'device-user'
    }) as DeviceSessionData;

    // Verify that the token matches the expected device
    if (decoded.deviceId !== deviceId || decoded.deviceType !== deviceType) {
      throw new Error('Token device mismatch');
    }

    return decoded;
  } catch (error) {
    console.error('Session validation error:', error);
    // Clear invalid token
    await clearDeviceSession(deviceId, deviceType);
    return null;
  }
}

/**
 * Clears a device session
 */
export async function clearDeviceSession(
  deviceId: string,
  deviceType: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`device_session_${deviceId}_${deviceType}`);
}

/**
 * Refreshes a device session token
 */
export async function refreshDeviceSession(
  deviceId: string,
  deviceType: string
): Promise<boolean> {
  const sessionData = await validateDeviceSession(deviceId, deviceType);
  
  if (!sessionData) {
    return false;
  }

  // Create new token with same data but extended expiry
  await createDeviceSession(
    sessionData.userId,
    sessionData.username,
    sessionData.deviceId,
    sessionData.deviceType,
    sessionData.playspaceId
  );

  return true;
}

/**
 * Gets session data for client-side use (without sensitive info)
 */
export async function getClientSessionData(
  deviceId: string,
  deviceType: string
): Promise<{
  isAuthenticated: boolean;
  username?: string;
  deviceId?: string;
  playspaceId?: string;
} | null> {
  const sessionData = await validateDeviceSession(deviceId, deviceType);
  
  if (!sessionData) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    username: sessionData.username,
    deviceId: sessionData.deviceId,
    playspaceId: sessionData.playspaceId,
  };
}
