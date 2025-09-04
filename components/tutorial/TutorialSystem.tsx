"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'wait' | 'manual';
  duration?: number;
}

interface TutorialSequence {
  id: string;
  title: string;
  description: string;
  deviceType: 'hackbook-w95' | 'hackbook-e95' | 'hackphone';
  steps: TutorialStep[];
}

// Tutorial sequences for different devices
export const TUTORIAL_SEQUENCES: Record<string, TutorialSequence> = {
  'hackphone-intro': {
    id: 'hackphone-intro',
    title: 'Welcome to HackPhone',
    description: 'Learn the basics of mobile hacking',
    deviceType: 'hackphone',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to HackPhone! 📱',
        content: 'This is your mobile hacking device. Let\'s learn how to use it effectively.',
        position: 'center',
        action: 'manual'
      },
      {
        id: 'home-button',
        title: 'Home Button 🏠',
        content: 'Tap this button anytime to return to the home screen.',
        targetElement: 'home-button',
        position: 'top',
        action: 'click'
      },
      {
        id: 'app-grid',
        title: 'App Grid 📱',
        content: 'These are your hacking tools. Each app serves a different purpose in cybersecurity.',
        targetElement: 'app-grid',
        position: 'bottom',
        action: 'manual'
      },
      {
        id: 'security-apps',
        title: 'Security Tools 🔒',
        content: 'Start with the Security Center app to learn about system protection.',
        targetElement: 'security-app',
        position: 'top',
        action: 'click'
      },
      {
        id: 'navigation',
        title: 'Navigation 🧭',
        content: 'Swipe between screens, tap apps to open them, and use the home button to navigate.',
        position: 'center',
        action: 'manual'
      }
    ]
  },
  'hackbook-intro': {
    id: 'hackbook-intro',
    title: 'Welcome to HackBook',
    description: 'Master desktop cybersecurity',
    deviceType: 'hackbook-w95',
    steps: [
      {
        id: 'desktop',
        title: 'Welcome to HackBook! 💻',
        content: 'This retro computer environment simulates classic hacking scenarios.',
        position: 'center',
        action: 'manual'
      },
      {
        id: 'start-menu',
        title: 'Start Menu 🖱️',
        content: 'Click the Start button to access your hacking tools.',
        targetElement: 'start-button',
        position: 'top',
        action: 'click'
      },
      {
        id: 'taskbar',
        title: 'Taskbar 📊',
        content: 'Your active applications appear here. You can switch between them easily.',
        targetElement: 'taskbar',
        position: 'top',
        action: 'manual'
      },
      {
        id: 'mini-games',
        title: 'Mini-Games 🎮',
        content: 'Complete challenges to improve your cybersecurity skills.',
        targetElement: 'games-folder',
        position: 'left',
        action: 'click'
      }
    ]
  },
  'cryptoheist-intro': {
    id: 'cryptoheist-intro',
    title: 'CryptoHeist Tutorial',
    description: 'Learn team-based cryptocurrency hacking',
    deviceType: 'hackbook-e95',
    steps: [
      {
        id: 'team-setup',
        title: 'Team Coordination 👥',
        content: 'You\'re part of a heist team. Each role has specific responsibilities.',
        position: 'center',
        action: 'manual'
      },
      {
        id: 'wallet',
        title: 'Bitcoin Wallet ₿',
        content: 'This is your team\'s shared cryptocurrency wallet. Protect it!',
        targetElement: 'wallet-app',
        position: 'right',
        action: 'click'
      },
      {
        id: 'malware-store',
        title: 'Malware Arsenal 🦠',
        content: 'Purchase and deploy various attack tools against other teams.',
        targetElement: 'malware-store',
        position: 'left',
        action: 'click'
      },
      {
        id: 'defense',
        title: 'Defense Systems 🛡️',
        content: 'Configure your security settings to protect against attacks.',
        targetElement: 'security-center',
        position: 'bottom',
        action: 'click'
      }
    ]
  }
};

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
  onPrevious?: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  onNext,
  onSkip,
  onPrevious,
  currentStepIndex,
  totalSteps
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step.targetElement) {
      const element = document.querySelector(`[data-tutorial-target="${step.targetElement}"]`);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    }
  }, [step.targetElement]);

  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const spacing = 20;
    switch (step.position) {
      case 'top':
        return {
          top: targetRect.top - spacing,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: targetRect.bottom + spacing,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - spacing,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + spacing,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[1000]" onClick={onSkip} />
      
      {/* Highlight target element */}
      {targetRect && (
        <div
          className="fixed border-4 border-blue-400 rounded-lg shadow-2xl z-[1001] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)'
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-[1002] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-sm"
        style={getTooltipPosition()}
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i <= currentStepIndex ? 'bg-blue-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
        <p className="text-gray-300 mb-4">{step.content}</p>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {onPrevious && currentStepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={onPrevious}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip Tutorial
            </Button>
            <Button variant="primary" size="sm" onClick={onNext}>
              {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

interface TutorialSystemProps {
  sequenceId: string;
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialSystem: React.FC<TutorialSystemProps> = ({
  sequenceId,
  isActive,
  onComplete,
  onSkip
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const sequence = TUTORIAL_SEQUENCES[sequenceId];

  useEffect(() => {
    if (isActive && sequence) {
      setIsVisible(true);
      setCurrentStepIndex(0);
    } else {
      setIsVisible(false);
    }
  }, [isActive, sequence]);

  if (!sequence || !isVisible) return null;

  const currentStep = sequence.steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < sequence.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <TutorialOverlay
          step={currentStep}
          onNext={handleNext}
          onSkip={handleSkip}
          onPrevious={currentStepIndex > 0 ? handlePrevious : undefined}
          currentStepIndex={currentStepIndex}
          totalSteps={sequence.steps.length}
        />
      )}
    </AnimatePresence>
  );
};

// Hook for managing tutorial state
export const useTutorial = () => {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  const startTutorial = (sequenceId: string) => {
    // Check if tutorial was already completed
    const completedTutorials = JSON.parse(
      localStorage.getItem('completedTutorials') || '[]'
    );
    
    if (!completedTutorials.includes(sequenceId)) {
      setActiveTutorial(sequenceId);
    }
  };

  const completeTutorial = (sequenceId: string) => {
    const completedTutorials = JSON.parse(
      localStorage.getItem('completedTutorials') || '[]'
    );
    
    if (!completedTutorials.includes(sequenceId)) {
      completedTutorials.push(sequenceId);
      localStorage.setItem('completedTutorials', JSON.stringify(completedTutorials));
    }
    
    setActiveTutorial(null);
  };

  const skipTutorial = () => {
    setActiveTutorial(null);
  };

  return {
    activeTutorial,
    startTutorial,
    completeTutorial,
    skipTutorial
  };
};

export default TutorialSystem;
