import { useState, useCallback, useEffect } from 'react';

export interface OnboardingStatus {
    needsOnboarding: boolean;
    dismissOnboarding: () => void;
}

/**
 * Hook to check if onboarding is needed.
 * Shows onboarding when:
 * - No walletBackup exists in localStorage (no cipher wallet created)
 * - AND onboarding hasn't been dismissed this session
 */
export const useOnboardingStatus = (): OnboardingStatus => {
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

    useEffect(() => {
        const hasWallet = !!localStorage.getItem('walletBackup');
        const isDismissed = !!sessionStorage.getItem('onboardingDismissed');
        setNeedsOnboarding(!hasWallet && !isDismissed);
    }, []);

    const dismissOnboarding = useCallback(() => {
        sessionStorage.setItem('onboardingDismissed', 'true');
        setNeedsOnboarding(false);
    }, []);

    return {
        needsOnboarding,
        dismissOnboarding
    };
};
