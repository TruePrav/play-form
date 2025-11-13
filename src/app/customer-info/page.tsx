'use client';

import { useEffect } from 'react';
import { CustomerInfoForm } from '@/components/customer-info/CustomerInfoForm';

export default function CustomerInfoPage() {
  useEffect(() => {
    // Handle hash navigation on page load
    if (typeof window !== 'undefined' && window.location.hash === '#entry-form') {
      setTimeout(() => {
        const entryForm = document.getElementById('entry-form');
        if (entryForm) {
          entryForm.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return <CustomerInfoForm />;
}
