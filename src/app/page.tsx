'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { trackCTAClick, trackSubmitSuccess } from '@/lib/analytics';

export default function HomePage() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    // Countdown timer to Dec 24, 2025 23:59:59 America/Barbados
    const targetDate = new Date('2025-12-24T23:59:59-04:00'); // America/Barbados is UTC-4
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Expose global tracking function for form integration
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gwTrackSubmitSuccess = function() {
        trackSubmitSuccess();
      };
    }
  }, []);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isImageModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen]);

  useEffect(() => {
    // Close modal on ESC key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    };
    
    if (isImageModalOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isImageModalOpen]);

  const handleCTAClick = () => {
    // Track the click
    trackCTAClick();
    
    // Scroll to entry form
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
      entryForm.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If form is on different page, navigate first
      window.location.href = '/customer-info#entry-form';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto pt-2 pb-4 px-4">
          {/* Hero Stack: Logo + Countdown */}
          <section className="flex flex-col items-center pt-2 gap-3">
            {/* PLAY Logo */}
            <div className="flex justify-center mb-1 mt-0">
              <Image 
                src="/play-black.png" 
                alt="PLAY Logo" 
                width={280}
                height={84}
                className="h-auto w-auto object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Countdown */}
            <div id="countdown-wrapper" className="m-0 p-0">
              <div className="gw-countdown" role="timer" aria-live="polite" aria-label="Countdown to giveaway deadline">
                <div className="gw-countdown-item">
                  <span className="gw-countdown-value">{String(countdown.days).padStart(2, '0')}</span>
                  <span className="gw-countdown-label">Days</span>
                </div>
                <span className="gw-countdown-separator">:</span>
                <div className="gw-countdown-item">
                  <span className="gw-countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
                  <span className="gw-countdown-label">Hours</span>
                </div>
                <span className="gw-countdown-separator">:</span>
                <div className="gw-countdown-item">
                  <span className="gw-countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className="gw-countdown-label">Minutes</span>
                </div>
                <span className="gw-countdown-separator">:</span>
                <div className="gw-countdown-item">
                  <span className="gw-countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className="gw-countdown-label">Seconds</span>
                </div>
              </div>
            </div>
          </section>
          
          <div className="text-center space-y-3">
            {/* Giveaway Hero Block */}
            <div className="gw-hero-block">
              <div className="gw-image-container">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="gw-image-button"
                  aria-label="View giveaway image in full size"
                >
                  <Image 
                    src="/switch_giveaway.png" 
                    alt="Christmas at PLAY Giveaway — Win a Nintendo Switch 2"
                    width={550}
                    height={400}
                    className="gw-image"
                    priority
                  />
                </button>
              </div>
              
              <div className="gw-button-container">
                <Button 
                  size="lg" 
                  onClick={handleCTAClick}
                  className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 shadow-lg hover:shadow-emerald-400/25 transition-all duration-300 transform hover:scale-105"
                >
                  Enter the Giveaway
                </Button>
              </div>
              
              <p className="gw-fine-print">
                There will be weekly winners of various prizes.
              </p>
              <p className="gw-fine-print">
                <strong>LIVE drawings</strong> for weekly winners - <strong>6 PM on December 4th, 11th, 18th.</strong>
              </p>
              <p className="gw-fine-print">
                <strong>LIVE drawing</strong> for grand prize will be <strong>December 25th, 12 PM.</strong>
              </p>
              <p className="gw-fine-print">
                Follow our instagram{' '}
                <a 
                  href="https://www.instagram.com/playbarbados.bb/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gw-instagram-link"
                >
                  @playbarbados.bb
                </a>
                {' '}for updates and to view LIVE drawing.
              </p>
              <p className="gw-fine-print">
                Entries close December 24th, 6 PM.
              </p>
            </div>
            
            {/* PLAY Barbados Section - Moved to bottom */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <h1 className="text-3xl font-bold text-emerald-400 mb-3">PLAY Barbados</h1>
              <p className="text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Your premier destination for gaming and entertainment in Barbados. 
                From gift cards to video games, we&apos;ve got everything you need for the ultimate gaming experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Modal/Lightbox */}
      {isImageModalOpen && (
        <div 
          className="gw-image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Giveaway image viewer"
        >
          <button
            type="button"
            className="gw-image-modal-backdrop"
            onClick={() => setIsImageModalOpen(false)}
            aria-label="Close image viewer"
          />
          <button
            type="button"
            className="gw-image-modal-close"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageModalOpen(false);
            }}
            aria-label="Close image"
          >
            ×
          </button>
          <div 
            className="gw-image-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="none"
          >
            <Image 
              src="/switch_giveaway.png" 
              alt="Christmas at PLAY Giveaway — Win a Nintendo Switch 2"
              width={1200}
              height={900}
              className="gw-image-modal-img"
              quality={95}
            />
          </div>
        </div>
      )}
      
      {/* Sticky Mobile Footer CTA */}
      <div className="gw-sticky-footer">
        <div className="gw-sticky-footer-content">
          <span className="gw-sticky-footer-text">Win a Nintendo Switch 2</span>
          <button 
            className="gw-sticky-footer-button"
            onClick={handleCTAClick}
            aria-label="Enter the giveaway"
          >
            Enter Now
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .gw-hero-block {
            margin: 0;
            padding: 1rem;
            text-align: center;
          }
          
          .gw-headline {
            font-size: 2.5rem;
            font-weight: bold;
            color: #34d399;
            margin-bottom: 0.25rem;
          }
          
          .gw-subheadline {
            font-size: 1.25rem;
            color: #cbd5e1;
            margin-bottom: 0.75rem;
          }
          
          .gw-image-container {
            margin: 0.75rem 0;
            display: flex;
            justify-content: center;
          }
          
          .gw-image-button {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            display: inline-block;
            transition: transform 0.2s ease;
          }
          
          .gw-image-button:hover {
            transform: scale(1.02);
          }
          
          .gw-image-button:focus {
            outline: 2px solid #34d399;
            outline-offset: 4px;
            border-radius: 0.5rem;
          }
          
          .gw-image {
            max-width: 550px;
            width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            display: block;
            object-fit: contain;
          }
          
          .gw-button-container {
            margin: 1.5rem 0;
            display: flex;
            justify-content: center;
          }
          
          .gw-image-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 2rem;
          }
          
          .gw-image-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            border: none;
            padding: 0;
            cursor: pointer;
            z-index: 1;
          }
          
          .gw-image-modal-content {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: default;
            z-index: 2;
          }
          
          .gw-image-modal-img {
            max-width: 100%;
            max-height: 90vh;
            width: auto;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            object-fit: contain;
          }
          
          .gw-image-modal-close {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 2.5rem;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10001;
            line-height: 1;
            padding: 0;
          }
          
          .gw-image-modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
            transform: scale(1.1);
          }
          
          .gw-image-modal-close:active {
            transform: scale(0.95);
          }
          
          .gw-countdown {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin: 0;
            flex-wrap: wrap;
          }
          
          .gw-entries-close {
            font-size: 0.875rem;
            color: #94a3b8;
            margin-bottom: 1rem;
            text-align: center;
          }
          
          .gw-fine-print {
            font-size: 0.875rem;
            color: #cbd5e1;
            margin-top: 0.75rem;
            text-align: center;
            line-height: 1.5;
          }
          
          .gw-instagram-link {
            color: #34d399;
            text-decoration: underline;
            transition: color 0.2s ease;
          }
          
          .gw-instagram-link:hover {
            color: #10b981;
          }
          
          .gw-countdown-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 60px;
            gap: 0;
          }
          
          .gw-countdown-value {
            font-size: 1.75rem;
            font-weight: bold;
            color: #34d399;
            font-variant-numeric: tabular-nums;
          }
          
          .gw-countdown-label {
            font-size: 0.7rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0;
            line-height: 1;
          }
          
          .gw-countdown-separator {
            font-size: 1.75rem;
            font-weight: bold;
            color: #34d399;
            margin: 0 0.25rem;
          }
          
          .gw-sticky-footer {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-top: 1px solid #334155;
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom));
            z-index: 9999;
            box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.3);
          }
          
          .gw-sticky-footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }
          
          .gw-sticky-footer-text {
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            flex: 1;
          }
          
          .gw-sticky-footer-button {
            background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
          }
          
          .gw-sticky-footer-button:hover {
            background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
          }
          
          .gw-sticky-footer-button:active {
            transform: translateY(0);
          }
          
          @media (max-width: 767px) {
            .gw-sticky-footer {
              display: block;
            }
            
            .gw-headline {
              font-size: 1.75rem;
            }
            
            .gw-subheadline {
              font-size: 0.9rem;
            }
            
            .gw-image {
              max-width: 400px;
            }
            
            .gw-image-modal {
              padding: 1rem;
            }
            
            .gw-image-modal-close {
              top: 0.5rem;
              right: 0.5rem;
              width: 2.5rem;
              height: 2.5rem;
              font-size: 2rem;
            }
            
            .gw-countdown-value {
              font-size: 1.25rem;
            }
            
            .gw-countdown-separator {
              font-size: 1.25rem;
            }
          }
        `
      }} />
    </>
  );
}
