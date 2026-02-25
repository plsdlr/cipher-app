import React, { useState } from 'react';
import DisclaimerStep from './steps/DisclaimerStep';
import CreateWalletStep from './steps/CreateWalletStep';
import BackupKeyStep from './steps/BackupKeyStep';
import RegisterOnChainStep from './steps/RegisterOnChainStep';

type OnboardingStep = 'disclaimer' | 'create-wallet' | 'backup-key' | 'register-onchain';

interface OnboardingModalProps {
    onComplete: () => void;
    onDismiss: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onDismiss }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('disclaimer');

    const stepOrder: OnboardingStep[] = ['disclaimer', 'create-wallet', 'backup-key', 'register-onchain'];
    const currentStepIndex = stepOrder.indexOf(currentStep);

    const goToStep = (step: OnboardingStep) => {
        setCurrentStep(step);
    };

    const handleDisclaimerAccept = () => {
        goToStep('create-wallet');
    };

    const handleWalletCreated = () => {
        goToStep('backup-key');
    };

    const handleBackupComplete = () => {
        goToStep('register-onchain');
    };

    const handleRegistrationComplete = () => {
        onComplete();
    };

    const handleSkipRegistration = () => {
        onComplete();
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(stepOrder[prevIndex]);
        }
    };

    const getStepLabel = (step: OnboardingStep): string => {
        switch (step) {
            case 'disclaimer':
                return 'Disclaimer';
            case 'create-wallet':
                return 'Create';
            case 'backup-key':
                return 'Backup';
            case 'register-onchain':
                return 'Register';
            default:
                return '';
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <fieldset className="terminal-fieldset">
                    <legend>Cipher Wallet Setup</legend>

                    {/* Step Indicator */}
                    <div className="onboarding-steps">
                        {stepOrder.map((step, index) => (
                            <div
                                key={step}
                                className={`onboarding-step-indicator ${index === currentStepIndex ? 'active' : ''
                                    } ${index < currentStepIndex ? 'completed' : ''}`}
                            >
                                <div className="step-circle">{index + 1}</div>
                                <div className="step-label">{getStepLabel(step)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="onboarding-content">
                        {currentStep === 'disclaimer' && (
                            <DisclaimerStep onAccept={handleDisclaimerAccept} />
                        )}
                        {currentStep === 'create-wallet' && (
                            <CreateWalletStep
                                onComplete={handleWalletCreated}
                                onBack={handleBack}
                            />
                        )}
                        {currentStep === 'backup-key' && (
                            <BackupKeyStep
                                onComplete={handleBackupComplete}
                                onBack={handleBack}
                            />
                        )}
                        {currentStep === 'register-onchain' && (
                            <RegisterOnChainStep
                                onComplete={handleRegistrationComplete}
                                onSkip={handleSkipRegistration}
                                onBack={handleBack}
                            />
                        )}
                    </div>

                    {/* Dismiss link for first step only */}
                    {currentStep === 'disclaimer' && (
                        <div className="onboarding-dismiss">
                            <button onClick={onDismiss} className="dismiss-link">
                                I already have a wallet - dismiss
                            </button>
                        </div>
                    )}
                </fieldset>
            </div>
        </div>
    );
};

export default OnboardingModal;
