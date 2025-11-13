'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface OTPVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onBack: () => void;
  isGuardian?: boolean;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  phoneNumber,
  onVerified,
  onBack,
  isGuardian = false
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds before resend allowed
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [maxResends] = useState(1); // Only allow 1 resend
  
  // Guard against React StrictMode double-effect
  const sentRef = useRef(false);

  // Send OTP when component mounts
  useEffect(() => {
    if (sentRef.current) return; // guard against StrictMode double-effect
    sentRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: { phoneNumber }
        });

        if (error) {
          setError(error.message || 'Failed to send OTP');
        } else if (!data?.success) {
          setError(data?.error || 'Failed to send OTP');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to send OTP');
      }
    })();
  }, [phoneNumber]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);


  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phoneNumber,
          otpCode: otp
        }
      });

      if (error) throw error;

      if (data.success) {
        setSuccess('Phone number verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to verify OTP');
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          phoneNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        setSuccess('New OTP sent successfully!');
        setTimeLeft(30); // Reset timer to 30 seconds
        setCanResend(false);
        setOtp(''); // Clear current OTP
        setResendCount(prev => prev + 1);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm hover:border-emerald-400/50 transition-all duration-300">
      <CardHeader className="border-b border-slate-600">
        <CardTitle className="text-2xl font-bold text-emerald-400 flex items-center gap-3">
          <span className="text-3xl">📱</span>
          {isGuardian ? 'Verify Guardian Phone Number' : 'Verify Your Phone Number'}
        </CardTitle>
        <CardDescription className="text-slate-400">
          We&apos;ve sent a 6-digit WhatsApp verification code to{' '}
          <span className="font-mono text-emerald-400">{phoneNumber}</span>
          {isGuardian && ' (Guardian)'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* OTP Input */}
        <div className="space-y-2">
          <label htmlFor="otp-input" className="text-sm font-medium text-slate-300">
            Verification Code
          </label>
          <Input
            id="otp-input"
            type="text"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter 6-digit code"
            className="text-center text-2xl font-mono tracking-widest bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
            maxLength={6}
            disabled={isLoading}
          />
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            {canResend ? (
              <span className="text-emerald-400">You can now resend the code</span>
            ) : (
              <>
                Resend available in: <span className="font-mono text-emerald-400">{timeLeft}s</span>
              </>
            )}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full px-8 py-3 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 shadow-lg hover:shadow-emerald-400/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold border-0 transition-all duration-200"
            >
              Back
            </Button>
            
            {resendCount < maxResends ? (
              <Button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold border-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800"
              >
                {isResending ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${timeLeft}s`}
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                className="flex-1 bg-slate-800 text-slate-400 font-bold border-0 cursor-not-allowed"
              >
                Resend Used
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Didn&apos;t receive the code? Check your WhatsApp messages or try resending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
