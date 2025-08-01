/**
 * Utility to verify fingerprint image paths and provide fallbacks
 */

export const FINGERPRINT_IMAGES = {
  main: [
    '/hackbook-W95/fingerprints/main1.png',
    '/hackbook-W95/fingerprints/main2.png', 
    '/hackbook-W95/fingerprints/main3.png',
    '/hackbook-W95/fingerprints/main4.png'
  ],
  right: {
    1: [
      '/hackbook-W95/fingerprints/right1_1.png',
      '/hackbook-W95/fingerprints/right1_2.png',
      '/hackbook-W95/fingerprints/right1_3.png',
      '/hackbook-W95/fingerprints/right1_4.png'
    ],
    2: [
      '/hackbook-W95/fingerprints/right2_1.png',
      '/hackbook-W95/fingerprints/right2_2.png',
      '/hackbook-W95/fingerprints/right2_3.png',
      '/hackbook-W95/fingerprints/right2_4.png'
    ],
    3: [
      '/hackbook-W95/fingerprints/right3_1.png',
      '/hackbook-W95/fingerprints/right3_2.png',
      '/hackbook-W95/fingerprints/right3_3.png',
      '/hackbook-W95/fingerprints/right3_4.png'
    ],
    4: [
      '/hackbook-W95/fingerprints/right4_1.png',
      '/hackbook-W95/fingerprints/right4_2.png',
      '/hackbook-W95/fingerprints/right4_3.png',
      '/hackbook-W95/fingerprints/right4_4.png'
    ]
  },
  wrong: {
    1: [
      '/hackbook-W95/fingerprints/wrong1_1.png',
      '/hackbook-W95/fingerprints/wrong1_2.png',
      '/hackbook-W95/fingerprints/wrong1_3.png',
      '/hackbook-W95/fingerprints/wrong1_4.png'
    ],
    2: [
      '/hackbook-W95/fingerprints/wrong2_1.png',
      '/hackbook-W95/fingerprints/wrong2_2.png',
      '/hackbook-W95/fingerprints/wrong2_3.png',
      '/hackbook-W95/fingerprints/wrong2_4.png'
    ],
    3: [
      '/hackbook-W95/fingerprints/wrong3_1.png',
      '/hackbook-W95/fingerprints/wrong3_2.png',
      '/hackbook-W95/fingerprints/wrong3_3.png',
      '/hackbook-W95/fingerprints/wrong3_4.png'
    ],
    4: [
      '/hackbook-W95/fingerprints/wrong4_1.png',
      '/hackbook-W95/fingerprints/wrong4_2.png',
      '/hackbook-W95/fingerprints/wrong4_3.png',
      '/hackbook-W95/fingerprints/wrong4_4.png'
    ]
  }
};

/**
 * Verify if an image path exists in our predefined list
 */
export const verifyImagePath = (path: string): boolean => {
  const allPaths = [
    ...FINGERPRINT_IMAGES.main,
    ...Object.values(FINGERPRINT_IMAGES.right).flat(),
    ...Object.values(FINGERPRINT_IMAGES.wrong).flat()
  ];
  
  return allPaths.includes(path);
};

/**
 * Get main image path with validation
 */
export const getMainImagePath = (segmentNumber: number): string => {
  const index = Math.max(0, Math.min(3, segmentNumber - 1));
  return FINGERPRINT_IMAGES.main[index];
};

/**
 * Get right pattern path with validation
 */
export const getRightPatternPath = (segmentNumber: number, patternIndex: number): string => {
  const segment = Math.max(1, Math.min(4, segmentNumber)) as keyof typeof FINGERPRINT_IMAGES.right;
  const index = Math.max(0, Math.min(3, patternIndex - 1));
  return FINGERPRINT_IMAGES.right[segment][index];
};

/**
 * Get wrong pattern path with validation
 */
export const getWrongPatternPath = (segmentNumber: number, patternIndex: number): string => {
  const segment = Math.max(1, Math.min(4, segmentNumber)) as keyof typeof FINGERPRINT_IMAGES.wrong;
  const index = Math.max(0, Math.min(3, patternIndex - 1));
  return FINGERPRINT_IMAGES.wrong[segment][index];
};

/**
 * Test image loading
 */
export const testImageLoad = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      // Server-side rendering - assume images exist
      resolve(true);
      return;
    }
    
    const img = document.createElement('img');
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};
