'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  date_of_birth: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  custom_country_code?: string;
  created_at: string;
  is_minor: boolean;
  guardian_first_name?: string;
  guardian_last_name?: string;
  guardian_full_name?: string;
  guardian_date_of_birth?: string;
  email?: string;
  parish?: string;
  gender?: string;
  phone_verified?: boolean;
  guardian_whatsapp_number?: string;
  source_channel?: string;
  marketing_consent?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}

interface CustomerGiftCard {
  id: string;
  customer_id: string;
  gift_card_type: string;
  username: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CustomerConsole {
  id: string;
  customer_id: string;
  console_type: string;
  is_retro: boolean;
}

interface CustomerShoppingCategory {
  id: string;
  customer_id: string;
  category: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_name: string;
  user_agent?: string;
  referrer?: string;
  page_url?: string;
  session_id?: string;
  created_at: string;
}

interface AnalyticsSummary {
  event_name: string;
  event_type: string;
  event_date: string;
  event_count: number;
  unique_sessions: number;
}

export default function AdminPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [giftCards, setGiftCards] = useState<CustomerGiftCard[]>([]);
  const [consoles, setConsoles] = useState<CustomerConsole[]>([]);
  const [shoppingCategories, setShoppingCategories] = useState<CustomerShoppingCategory[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGiftCard, setFilterGiftCard] = useState<string>('all');
  const [filterConsole, setFilterConsole] = useState<string>('all');
  const [filterParish, setFilterParish] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterPhoneVerified, setFilterPhoneVerified] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingGiftCard, setEditingGiftCard] = useState<CustomerGiftCard | null>(null);
  const [nullUsernamePage, setNullUsernamePage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when gift cards change (e.g., after updates)
  useEffect(() => {
    setNullUsernamePage(1);
  }, [giftCards.length]);

  // Helper function to fetch all records in batches (Supabase limit is 1000 per query)
  const fetchAllCustomers = async () => {
    const allCustomers: Customer[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allCustomers.push(...data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allCustomers;
  };

  const fetchAllGiftCards = async () => {
    const allGiftCards: CustomerGiftCard[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('customer_gift_cards')
        .select('*')
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allGiftCards.push(...data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allGiftCards;
  };

  const fetchAllConsoles = async () => {
    const allConsoles: CustomerConsole[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('customer_consoles')
        .select('*')
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allConsoles.push(...data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allConsoles;
  };

  const fetchAllCategories = async () => {
    const allCategories: CustomerShoppingCategory[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('customer_shopping_categories')
        .select('*')
        .range(from, from + batchSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allCategories.push(...data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allCategories;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in batches to handle > 1000 records
      const customersData = await fetchAllCustomers();
      const giftCardsData = await fetchAllGiftCards();
      const consolesData = await fetchAllConsoles();
      const categoriesData = await fetchAllCategories();

      // Fetch analytics events
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) {
        logger.warn('Analytics events not available:', analyticsError);
      }

      // Fetch analytics summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('analytics_summary')
        .select('*')
        .limit(50);

      if (summaryError) {
        logger.warn('Analytics summary not available:', summaryError);
      }

      setCustomers(customersData);
      setGiftCards(giftCardsData);
      setConsoles(consolesData);
      setShoppingCategories(categoriesData);
      setAnalyticsEvents(analyticsData || []);
      setAnalyticsSummary(summaryData || []);

    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.first_name && customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.last_name && customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         customer.whatsapp_number.includes(searchTerm);
    
    // If no filters are applied, just return search results
    if (filterCategory === 'all' && filterGiftCard === 'all' && filterConsole === 'all' && 
        filterParish === 'all' && filterGender === 'all' && filterPhoneVerified === 'all') {
      return matchesSearch;
    }
    
    // Get customer's related data
    const customerCategories = shoppingCategories
      .filter(cat => cat.customer_id === customer.id)
      .map(cat => cat.category);
    
    const customerGiftCardObjects = giftCards
      .filter(gc => gc.customer_id === customer.id);
    
    const customerGiftCardTypes = customerGiftCardObjects
      .map(gc => gc.gift_card_type);
    
    const customerConsoles = consoles
      .filter(c => c.customer_id === customer.id)
      .map(c => c.console_type);
    
    // Debug logging
    logger.debug(`Customer ${customer.full_name}:`, {
      categories: customerCategories,
      giftCards: customerGiftCardTypes,
      consoles: customerConsoles,
      filterCategory,
      filterGiftCard,
      filterConsole
    });
    
    let matchesFilters = true;
    
    // Category filter - check if customer has the selected category
    if (filterCategory !== 'all') {
      const hasCategory = customerCategories.includes(filterCategory);
      matchesFilters = matchesFilters && hasCategory;
      logger.debug(`Category filter ${filterCategory}: ${hasCategory}`);
    }
    
    // Gift card filter - check if customer has the selected gift card
    if (filterGiftCard !== 'all') {
      if (filterGiftCard === 'null_usernames') {
        // Special filter for NULL usernames
        // Check if customer has gift cards with null usernames
        const hasNullUsernameGiftCard = customerGiftCardObjects.some(gc => !gc.username);
        matchesFilters = matchesFilters && hasNullUsernameGiftCard;
        logger.debug(`NULL username gift card filter: ${hasNullUsernameGiftCard}`);
      } else {
        const hasGiftCard = customerGiftCardTypes.includes(filterGiftCard);
        matchesFilters = matchesFilters && hasGiftCard;
        logger.debug(`Gift card filter ${filterGiftCard}: ${hasGiftCard}`);
      }
    }
    
    // Console filter - check if customer has the selected console
    if (filterConsole !== 'all') {
      const hasConsole = customerConsoles.includes(filterConsole);
      matchesFilters = matchesFilters && hasConsole;
      logger.debug(`Console filter ${filterConsole}: ${hasConsole}`);
    }
    
    // Parish filter
    if (filterParish !== 'all') {
      const matchesParish = customer.parish === filterParish;
      matchesFilters = matchesFilters && matchesParish;
      logger.debug(`Parish filter ${filterParish}: ${matchesParish}`);
    }
    
    // Gender filter
    if (filterGender !== 'all') {
      const matchesGender = customer.gender === filterGender;
      matchesFilters = matchesFilters && matchesGender;
      logger.debug(`Gender filter ${filterGender}: ${matchesGender}`);
    }
    
    // Phone verified filter
    if (filterPhoneVerified !== 'all') {
      const isVerified = filterPhoneVerified === 'verified' ? customer.phone_verified === true : customer.phone_verified === false;
      matchesFilters = matchesFilters && isVerified;
      logger.debug(`Phone verified filter ${filterPhoneVerified}: ${isVerified}`);
    }
    
    const finalResult = matchesSearch && matchesFilters;
    logger.debug(`Final result for ${customer.full_name}: ${finalResult}`);
    
    return finalResult;
  });

  const getCustomerGiftCards = (customerId: string) => {
    return giftCards.filter(gc => gc.customer_id === customerId);
  };

  const getCustomerConsoles = (customerId: string) => {
    return consoles.filter(c => c.customer_id === customerId);
  };

  const getCustomerCategories = (customerId: string) => {
    return shoppingCategories.filter(cat => cat.customer_id === customerId);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleSaveCustomer = async (updatedCustomer: Customer) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: updatedCustomer.full_name,
          whatsapp_number: updatedCustomer.whatsapp_number,
          guardian_full_name: updatedCustomer.guardian_full_name
        })
        .eq('id', updatedCustomer.id);

      if (error) throw error;

      setCustomers(customers.map(c => 
        c.id === updatedCustomer.id ? updatedCustomer : c
      ));
      setEditingCustomer(null);
    } catch (error) {
      logger.error('Error updating customer:', error);
    }
  };

  const handleEditGiftCard = (giftCard: CustomerGiftCard) => {
    setEditingGiftCard(giftCard);
  };

  const handleSaveGiftCard = async (updatedGiftCard: CustomerGiftCard) => {
    try {
      // Save to customer_gift_cards table
      const { error } = await supabase
        .from('customer_gift_cards')
        .update({
          username: updatedGiftCard.username || null
        })
        .eq('id', updatedGiftCard.id);

      if (error) throw error;

      // Update local state
      setGiftCards(giftCards.map(gc => 
        gc.id === updatedGiftCard.id ? updatedGiftCard : gc
      ));
      
      setEditingGiftCard(null);
      
      logger.info('Gift card updated successfully:', updatedGiftCard);
    } catch (error) {
      logger.error('Error updating gift card:', error);
    }
  };

  const handleCancelGiftCardEdit = () => {
    setEditingGiftCard(null);
  };

  const scrollToCustomerAndEditGiftCard = (giftCard: CustomerGiftCard) => {
    // Find the customer
    const customer = customers.find(c => c.id === giftCard.customer_id);
    if (!customer) return;

    // Set the gift card to edit mode
    setEditingGiftCard(giftCard);

    // Find the customer element in the DOM and scroll to it
    const customerElement = document.querySelector(`[data-customer-id="${customer.id}"]`);
    if (customerElement) {
      customerElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add a subtle highlight effect
      customerElement.classList.add('ring-2', 'ring-amber-400', 'ring-opacity-50');
      setTimeout(() => {
        customerElement.classList.remove('ring-2', 'ring-amber-400', 'ring-opacity-50');
      }, 2000);
    }
  };

  const getGiftCardDisplayName = (giftCardType: string) => {
    const giftCardNames: { [key: string]: string } = {
      'amazon': 'Amazon',
      'itunes': 'Apple iTunes',
      'fortnite': 'Fortnite V-Bucks',
      'freefire': 'FreeFire Diamonds',
      'xbox': 'Microsoft XBOX',
      'nintendo': 'Nintendo eShop',
      'pubg': 'PUBG UC',
      'playstation': 'PlayStation Network',
      'riot': 'RIOT Points',
      'roblox': 'Roblox',
      'steam': 'Steam',
      'wizard101': 'Wizard 101'
    };
    return giftCardNames[giftCardType] || giftCardType;
  };

  const exportToCSV = async () => {
    try {
      // Show loading state
      setLoading(true);
      
      // Fetch ALL data from database for export (not just what's loaded in UI)
      const allCustomers = await fetchAllCustomers();
      const allGiftCards = await fetchAllGiftCards();
      const allConsoles = await fetchAllConsoles();
      const allCategories = await fetchAllCategories();

      // Apply filters if any are active
      let customersToExport = allCustomers;
      
      if (filterCategory !== 'all' || filterGiftCard !== 'all' || filterConsole !== 'all' || 
          filterParish !== 'all' || filterGender !== 'all' || filterPhoneVerified !== 'all' || searchTerm) {
        
        // Apply filters to all customers
        customersToExport = allCustomers.filter(customer => {
          const matchesSearch = !searchTerm || 
            customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.first_name && customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.last_name && customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            customer.whatsapp_number.includes(searchTerm);
          
          if (!matchesSearch) return false;
          
          const customerCategories = (allCategories || [])
            .filter(cat => cat.customer_id === customer.id)
            .map(cat => cat.category);
          
          const customerGiftCardObjects = (allGiftCards || [])
            .filter(gc => gc.customer_id === customer.id);
          
          const customerGiftCardTypes = customerGiftCardObjects.map(gc => gc.gift_card_type);
          
          const customerConsoles = (allConsoles || [])
            .filter(c => c.customer_id === customer.id)
            .map(c => c.console_type);
          
          let matchesFilters = true;
          
          if (filterCategory !== 'all') {
            matchesFilters = matchesFilters && customerCategories.includes(filterCategory);
          }
          
          if (filterGiftCard !== 'all') {
            if (filterGiftCard === 'null_usernames') {
              matchesFilters = matchesFilters && customerGiftCardObjects.some(gc => !gc.username);
            } else {
              matchesFilters = matchesFilters && customerGiftCardTypes.includes(filterGiftCard);
            }
          }
          
          if (filterConsole !== 'all') {
            matchesFilters = matchesFilters && customerConsoles.includes(filterConsole);
          }
          
          if (filterParish !== 'all') {
            matchesFilters = matchesFilters && customer.parish === filterParish;
          }
          
          if (filterGender !== 'all') {
            matchesFilters = matchesFilters && customer.gender === filterGender;
          }
          
          if (filterPhoneVerified !== 'all') {
            const isVerified = customer.phone_verified === true;
            matchesFilters = matchesFilters && (
              (filterPhoneVerified === 'verified' && isVerified) ||
              (filterPhoneVerified === 'not_verified' && !isVerified)
            );
          }
          
          return matchesFilters;
        });
      }
      
      // Helper functions using the fetched data
      const getCustomerGiftCardsForExport = (customerId: string) => {
        return (allGiftCards || []).filter(gc => gc.customer_id === customerId);
      };
      
      const getCustomerConsolesForExport = (customerId: string) => {
        return (allConsoles || []).filter(c => c.customer_id === customerId);
      };
      
      const getCustomerCategoriesForExport = (customerId: string) => {
        return (allCategories || []).filter(cat => cat.customer_id === customerId);
      };
      
      // Generate CSV data
      const csvData = customersToExport.map(customer => {
        const customerGiftCards = getCustomerGiftCardsForExport(customer.id);
        const consoles = getCustomerConsolesForExport(customer.id);
        const categories = getCustomerCategoriesForExport(customer.id);
        
        // Format WhatsApp number properly, handling undefined values
      // If country_code exists, combine it with number. Otherwise, use number as-is (it may contain full number)
      const whatsapp = customer.whatsapp_country_code 
        ? `${customer.whatsapp_country_code}${customer.whatsapp_number || ''}`
        : (customer.whatsapp_number || '');
      
      // Separate gift card types and accounts
      const giftCardTypes = customerGiftCards.map(gc => getGiftCardDisplayName(gc.gift_card_type));
      const giftCardAccounts = customerGiftCards
        .filter(gc => gc.username)
        .map(gc => `${getGiftCardDisplayName(gc.gift_card_type)}: ${gc.username}`)
        .join('; ');
      
      return {
        'First Name': customer.first_name || '',
        'Last Name': customer.last_name || '',
        'Full Name': customer.full_name,
        'Email': customer.email || '',
        'Date of Birth': customer.date_of_birth,
        'WhatsApp': whatsapp,
        'Parish': customer.parish || '',
        'Gender': customer.gender || '',
        'Phone Verified': customer.phone_verified ? 'Yes' : 'No',
        'Is Minor': customer.is_minor,
        'Guardian First Name': customer.guardian_first_name || '',
        'Guardian Last Name': customer.guardian_last_name || '',
        'Guardian Name': customer.guardian_full_name || '',
        'Guardian Date of Birth': customer.guardian_date_of_birth || '',
        'Guardian WhatsApp': customer.guardian_whatsapp_number || '',
        'Source Channel': customer.source_channel || '',
        'Marketing Consent': customer.marketing_consent ? 'Yes' : 'No',
        'Terms Accepted': customer.terms_accepted ? 'Yes' : 'No',
        'Terms Accepted At': customer.terms_accepted_at || '',
        'Shopping Categories': categories.map(c => c.category).join(', '),
        'Gift Card Types': giftCardTypes.join(', '),
        'Gift Card Accounts': giftCardAccounts || '',
        'Consoles': consoles.map(c => c.console_type).join(', '),
        'Created': customer.created_at
      };
    });

    const csv = convertToCSV(csvData);
    
    // Create filename with filter info
    let filename = 'play-barbados-customers';
    if (filterCategory !== 'all' || filterGiftCard !== 'all' || filterConsole !== 'all' || 
        filterParish !== 'all' || filterGender !== 'all' || filterPhoneVerified !== 'all' || searchTerm) {
      filename += '-filtered';
      if (filterCategory !== 'all') filename += `-${filterCategory}`;
      if (filterGiftCard !== 'all') filename += `-${filterGiftCard}`;
      if (filterConsole !== 'all') filename += `-${filterConsole}`;
      if (filterParish !== 'all') filename += `-${filterParish}`;
      if (filterGender !== 'all') filename += `-${filterGender}`;
      if (filterPhoneVerified !== 'all') filename += `-${filterPhoneVerified}`;
      if (searchTerm) filename += `-search-${searchTerm}`;
    }
    filename += '.csv';
    
    downloadCSV(csv, filename);
    
    setLoading(false);
    logger.info(`CSV exported with ${customersToExport.length} customers`);
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      setLoading(false);
    }
  };

  const convertToCSV = (data: Record<string, unknown>[]) => {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    // Fields that might contain phone numbers or formulas that need escaping
    const phoneFields = ['WhatsApp', 'Guardian WhatsApp'];
    
    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header];
        
        // Convert to string, handling null/undefined
        const stringValue = value == null ? '' : String(value);
        
        // Escape phone numbers to prevent Google Sheets from interpreting them as formulas
        // If the value starts with =, +, -, @, or a digit, prefix with a single quote
        if (phoneFields.includes(header) && stringValue) {
          const firstChar = stringValue.trim().charAt(0);
          if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || /^\d/.test(stringValue.trim())) {
            // Prefix with single quote to force Google Sheets to treat as text
            value = `'${stringValue}`;
          } else {
            value = stringValue;
          }
        } else {
          value = stringValue;
        }
        
        // Escape quotes and wrap in quotes
        const escapedValue = String(value).replace(/"/g, '""');
        return `"${escapedValue}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-400 mb-4">PLAY Barbados Admin Panel</h1>
          <p className="text-xl text-slate-300">Customer Database Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-600">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{customers.length}</div>
              <div className="text-slate-300">Total Customers</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-600">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{giftCards.length}</div>
              <div className="text-slate-300">Gift Card Entries</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-600">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{consoles.length}</div>
              <div className="text-slate-300">Console Entries</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-600">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400">{shoppingCategories.length}</div>
              <div className="text-slate-300">Category Entries</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-emerald-400">Giveaway Analytics</CardTitle>
                <CardDescription className="text-slate-300">
                  Track CTA clicks and form submissions
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600"
              >
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </Button>
            </div>
          </CardHeader>
          {showAnalytics && (
            <CardContent>
              {analyticsEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>No analytics data available yet.</p>
                  <p className="text-sm mt-2">Events will appear here once users start interacting with the giveaway.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-400">
                        {analyticsEvents.filter(e => e.event_name === 'giveaway_cta_click').length}
                      </div>
                      <div className="text-slate-300">CTA Clicks</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">
                        {analyticsEvents.filter(e => e.event_name === 'giveaway_submit_success').length}
                      </div>
                      <div className="text-slate-300">Form Submissions</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">
                        {new Set(analyticsEvents.map(e => e.session_id)).size}
                      </div>
                      <div className="text-slate-300">Unique Sessions</div>
                    </div>
                  </div>

                  {/* Summary Table */}
                  {analyticsSummary.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Daily Summary</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left p-2 text-slate-300">Date</th>
                              <th className="text-left p-2 text-slate-300">Event</th>
                              <th className="text-right p-2 text-slate-300">Count</th>
                              <th className="text-right p-2 text-slate-300">Sessions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsSummary.slice(0, 10).map((summary, idx) => (
                              <tr key={idx} className="border-b border-slate-700/50">
                                <td className="p-2 text-slate-300">{new Date(summary.event_date).toLocaleDateString()}</td>
                                <td className="p-2 text-white">{summary.event_name}</td>
                                <td className="p-2 text-right text-emerald-400">{summary.event_count}</td>
                                <td className="p-2 text-right text-blue-400">{summary.unique_sessions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Recent Events */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Recent Events (Last 20)</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {analyticsEvents.slice(0, 20).map((event) => (
                        <div key={event.id} className="bg-slate-700/30 rounded p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-emerald-400">{event.event_name}</span>
                              <span className="text-slate-400 ml-2">{event.event_type}</span>
                            </div>
                            <div className="text-slate-400">
                              {new Date(event.created_at).toLocaleString()}
                            </div>
                          </div>
                          {event.page_url && (
                            <div className="text-slate-500 text-xs mt-1 truncate">
                              {event.page_url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* NULL Username Gift Cards Alert */}
        {(() => {
          // Find gift cards with null usernames
          const nullUsernameGiftCards = giftCards.filter(gc => !gc.username);
          if (nullUsernameGiftCards.length === 0) return null;
          
          // Pagination logic
          const itemsPerPage = 5;
          const totalPages = Math.ceil(nullUsernameGiftCards.length / itemsPerPage);
          const startIndex = (nullUsernamePage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentPageItems = nullUsernameGiftCards.slice(startIndex, endIndex);
          
          // Reset to page 1 if current page is out of bounds
          if (nullUsernamePage > totalPages && totalPages > 0) {
            setNullUsernamePage(1);
          }
          
          return (
            <Card className="bg-amber-900/20 border-amber-400/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-amber-400 flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      Gift Cards Requiring Username Updates
                    </CardTitle>
                                         <CardDescription className="text-amber-200">
                       {nullUsernameGiftCards.length} gift card entries have NULL usernames that need to be updated
                       {totalPages > 1 && ` (Page ${nullUsernamePage} of ${totalPages})`}
                       {nullUsernameGiftCards.length > 5 && ` - Showing 5 per page`}
                     </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => setNullUsernamePage(Math.max(1, nullUsernamePage - 1))}
                          disabled={nullUsernamePage === 1}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ←
                        </Button>
                        <span className="text-amber-200 text-sm px-2">
                          {nullUsernamePage} / {totalPages}
                        </span>
                        <Button
                          onClick={() => setNullUsernamePage(Math.min(totalPages, nullUsernamePage + 1))}
                          disabled={nullUsernamePage === totalPages}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          →
                        </Button>
                      </div>
                    )}
                    {totalPages > 1 && (
                      <div className="text-amber-300 text-xs bg-amber-700/30 px-2 py-1 rounded">
                        📄 {totalPages} pages
                      </div>
                    )}
                    <Button
                      onClick={fetchData}
                      className="bg-amber-600 hover:bg-amber-500"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentPageItems.map(gc => {
                    const customer = customers.find(c => c.id === gc.customer_id);
                    return (
                                             <div key={gc.id} className="flex items-center justify-between p-3 bg-amber-900/30 border border-amber-400/30 rounded-lg">
                         <div className="flex items-center gap-4">
                           <span className="text-amber-300 font-medium">{getGiftCardDisplayName(gc.gift_card_type)}</span>
                           <span className="text-amber-200">
                             Customer: {customer?.full_name || 'Unknown'} ({customer?.whatsapp_number || 'No phone'})
                           </span>
                         </div>
                         <Button
                           onClick={() => scrollToCustomerAndEditGiftCard(gc)}
                           size="sm"
                           className="bg-amber-600 hover:bg-amber-500"
                         >
                           Update Username
                         </Button>
                       </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 pt-3 border-t border-amber-400/30">
                    <div className="flex items-center justify-between text-sm text-amber-200">
                      <span>
                        Showing {startIndex + 1}-{Math.min(endIndex, nullUsernameGiftCards.length)} of {nullUsernameGiftCards.length} entries
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setNullUsernamePage(1)}
                          disabled={nullUsernamePage === 1}
                          size="sm"
                          className="bg-amber-700/50 hover:bg-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          First
                        </Button>
                        <Button
                          onClick={() => setNullUsernamePage(Math.max(1, nullUsernamePage - 1))}
                          disabled={nullUsernamePage === 1}
                          size="sm"
                          className="bg-amber-700/50 hover:bg-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-1 bg-amber-700/30 rounded">
                          Page {nullUsernamePage} of {totalPages}
                        </span>
                        <Button
                          onClick={() => setNullUsernamePage(Math.min(totalPages, nullUsernamePage + 1))}
                          disabled={nullUsernamePage === totalPages}
                          size="sm"
                          className="bg-amber-700/50 hover:bg-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          Next
                        </Button>
                        <Button
                          onClick={() => setNullUsernamePage(totalPages)}
                          disabled={nullUsernamePage === totalPages}
                          size="sm"
                          className="bg-amber-700/50 hover:bg-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 bg-slate-700 border-slate-600 text-white"
            />
            
            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gift_cards">Gift Cards</SelectItem>
                <SelectItem value="video_games">Video Games</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Gift Card Type Filter */}
            <Select value={filterGiftCard} onValueChange={setFilterGiftCard}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by gift card" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Gift Cards</SelectItem>
                <SelectItem value="null_usernames">NULL Usernames</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="itunes">Apple iTunes</SelectItem>
                <SelectItem value="fortnite">Fortnite V-Bucks</SelectItem>
                <SelectItem value="freefire">FreeFire Diamonds</SelectItem>
                <SelectItem value="xbox">Microsoft XBOX</SelectItem>
                <SelectItem value="nintendo">Nintendo eShop</SelectItem>
                <SelectItem value="pubg">PUBG UC</SelectItem>
                <SelectItem value="playstation">PlayStation Network</SelectItem>
                <SelectItem value="riot">RIOT Points</SelectItem>
                <SelectItem value="roblox">Roblox</SelectItem>
                <SelectItem value="steam">Steam</SelectItem>
                <SelectItem value="wizard101">Wizard 101</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Console Type Filter */}
            <Select value={filterConsole} onValueChange={setFilterConsole}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by console" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Consoles</SelectItem>
                <SelectItem value="xboxone">Xbox One / Series S|X</SelectItem>
                <SelectItem value="xbox360">Xbox 360</SelectItem>
                <SelectItem value="ps4">PlayStation 4</SelectItem>
                <SelectItem value="ps5">PlayStation 5</SelectItem>
                <SelectItem value="nintendoswitch">Nintendo Switch / Switch OLED</SelectItem>
                <SelectItem value="nintendoswitch2">Nintendo Switch 2</SelectItem>
                <SelectItem value="pc">PC</SelectItem>
                <SelectItem value="retro">Retro</SelectItem>
                <SelectItem value="ps1">PS1/PS2</SelectItem>
                <SelectItem value="ps2">PS3</SelectItem>
                <SelectItem value="xbox">Xbox</SelectItem>
                <SelectItem value="psp">PSP/PS Vita</SelectItem>
                <SelectItem value="nintendo64-snes">Nintendo 64/SNES</SelectItem>
                <SelectItem value="nintendo3ds-ds-wii">Nintendo 3DS/DS/WII/Gamecube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* Parish Filter */}
            <Select value={filterParish} onValueChange={setFilterParish}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by parish" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Parishes</SelectItem>
                <SelectItem value="St. Lucy">St. Lucy</SelectItem>
                <SelectItem value="St. Peter">St. Peter</SelectItem>
                <SelectItem value="St. Andrew">St. Andrew</SelectItem>
                <SelectItem value="St. James">St. James</SelectItem>
                <SelectItem value="St. Joseph">St. Joseph</SelectItem>
                <SelectItem value="St. George">St. George</SelectItem>
                <SelectItem value="St. Thomas">St. Thomas</SelectItem>
                <SelectItem value="St. John">St. John</SelectItem>
                <SelectItem value="St. Michael">St. Michael</SelectItem>
                <SelectItem value="St. Phillip">St. Phillip</SelectItem>
                <SelectItem value="Christ Church">Christ Church</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Gender Filter */}
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Phone Verified Filter */}
            <Select value={filterPhoneVerified} onValueChange={setFilterPhoneVerified}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all">All Verification Status</SelectItem>
                <SelectItem value="verified">Phone Verified</SelectItem>
                <SelectItem value="unverified">Not Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            {/* Clear Filters Button */}
            <Button 
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterGiftCard('all');
                setFilterConsole('all');
                setFilterParish('all');
                setFilterGender('all');
                setFilterPhoneVerified('all');
              }}
              className="bg-slate-600 hover:bg-slate-500"
            >
              Clear Filters
            </Button>
            
            {/* Export Button */}
            <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500">
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">Debug Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-300">Total Customers:</span>
              <div className="text-white font-semibold">{customers.length}</div>
            </div>
            <div>
              <span className="text-slate-300">Filtered Results:</span>
              <div className="text-white font-semibold">{filteredCustomers.length}</div>
            </div>
            <div>
              <span className="text-slate-300">Active Filters:</span>
              <div className="text-white font-semibold">
                {filterCategory !== 'all' && `Category: ${filterCategory}`}
                {filterGiftCard !== 'all' && ` Gift Card: ${filterGiftCard}`}
                {filterConsole !== 'all' && ` Console: ${filterConsole}`}
                {filterParish !== 'all' && ` Parish: ${filterParish}`}
                {filterGender !== 'all' && ` Gender: ${filterGender}`}
                {filterPhoneVerified !== 'all' && ` Verification: ${filterPhoneVerified}`}
                {filterCategory === 'all' && filterGiftCard === 'all' && filterConsole === 'all' && 
                 filterParish === 'all' && filterGender === 'all' && filterPhoneVerified === 'all' && 'None'}
              </div>
            </div>
            <div>
              <span className="text-slate-300">Search Term:</span>
              <div className="text-white font-semibold">{searchTerm || 'None'}</div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-400">Customer Database</CardTitle>
            <CardDescription className="text-slate-300">
              {filteredCustomers.length} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600" data-customer-id={customer.id}>
                  {editingCustomer?.id === customer.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Editing: {customer.full_name}</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveCustomer(editingCustomer)}
                            className="bg-emerald-600 hover:bg-emerald-500"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingCustomer(null)}
                            className="bg-slate-600 hover:bg-slate-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="full-name" className="text-sm font-medium text-slate-200">Full Name</label>
                          <Input
                            id="full-name"
                            value={editingCustomer.full_name}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer,
                              full_name: e.target.value
                            })}
                            className="mt-1 bg-slate-600 border-slate-500 text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="whatsapp-number" className="text-sm font-medium text-slate-200">WhatsApp Number</label>
                          <Input
                            id="whatsapp-number"
                            value={editingCustomer.whatsapp_number}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer,
                              whatsapp_number: e.target.value
                            })}
                            className="mt-1 bg-slate-600 border-slate-500 text-white"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="guardian-name" className="text-sm font-medium text-slate-200">Guardian Name</label>
                          <Input
                            id="guardian-name"
                            value={editingCustomer.guardian_full_name || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer,
                              guardian_full_name: e.target.value
                            })}
                            className="mt-1 bg-slate-600 border-slate-500 text-white"
                            placeholder="Leave empty if not applicable"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="date-of-birth" className="text-sm font-medium text-slate-200">Date of Birth</label>
                          <Input
                            id="date-of-birth"
                            type="date"
                            value={editingCustomer.date_of_birth}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer,
                              date_of_birth: e.target.value
                            })}
                            className="mt-1 bg-slate-600 border-slate-500 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-white">
                              {customer.first_name && customer.last_name 
                                ? `${customer.first_name} ${customer.last_name}` 
                                : customer.full_name}
                            </h3>
                            {(() => {
                              const customerGiftCards = getCustomerGiftCards(customer.id);
                              const hasNullUsernameGiftCard = customerGiftCards.some(gc => !gc.username);
                              return hasNullUsernameGiftCard ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-400/50">
                                  ⚠️ NULL Username
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-slate-300">
                             {customer.whatsapp_country_code}{customer.whatsapp_number}
                          </p>
                          <div className="flex gap-4 text-sm text-slate-400">
                            {customer.email && <span>📧 {customer.email}</span>}
                            {customer.parish && <span>📍 {customer.parish}</span>}
                            {customer.gender && <span>👤 {customer.gender}</span>}
                            <span className={customer.phone_verified ? 'text-green-400' : 'text-red-400'}>
                              {customer.phone_verified ? '✅ Verified' : '❌ Not Verified'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">
                            Created: {new Date(customer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleEditCustomer(customer)}
                          className="bg-blue-600 hover:bg-blue-500"
                        >
                          Edit
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-emerald-400 font-semibold">Categories:</span>
                          <div className="text-slate-300">
                            {getCustomerCategories(customer.id).map(cat => (
                              <span key={cat.id} className="inline-block bg-slate-600 px-2 py-1 rounded mr-2 mb-1">
                                {cat.category === 'gift_cards' ? '🎁 Gift Cards' : '🎮 Video Games'}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-emerald-400 font-semibold">Gift Card Types:</span>
                          <div className="text-slate-300">
                            {getCustomerGiftCards(customer.id).length > 0 ? (
                              getCustomerGiftCards(customer.id).map(gc => (
                                <span key={gc.id} className="inline-block bg-slate-600 px-2 py-1 rounded mr-2 mb-1">
                                  {getGiftCardDisplayName(gc.gift_card_type)}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 italic text-xs">None</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-emerald-400 font-semibold">Gift Card Accounts:</span>
                          <div className="text-slate-300">
                            {getCustomerGiftCards(customer.id)
                              .filter(gc => gc.username) // Only show ones with usernames
                              .map(gc => (
                              <div key={gc.id} className="text-xs mb-2">
                                {editingGiftCard?.id === gc.id ? (
                                  // Edit Mode
                                  <div className="flex items-center gap-2 p-2 bg-amber-900/30 border border-amber-400/50 rounded">
                                    <span className="text-amber-300 font-medium text-xs">
                                      {getGiftCardDisplayName(gc.gift_card_type)}:
                                    </span>
                                    <Input
                                      value={editingGiftCard.username || ''}
                                      onChange={(e) => setEditingGiftCard({
                                        ...editingGiftCard,
                                        username: e.target.value
                                      })}
                                      placeholder="Enter username"
                                      className="h-6 text-xs bg-slate-600 border-amber-400 text-white"
                                    />
                                    <Button
                                      onClick={() => handleSaveGiftCard(editingGiftCard)}
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-500"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      onClick={handleCancelGiftCardEdit}
                                      size="sm"
                                      className="h-6 px-2 text-xs bg-slate-600 hover:bg-slate-500"
                                    >
                                      ✗
                                    </Button>
                                  </div>
                                ) : (
                                  // Display Mode
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {getGiftCardDisplayName(gc.gift_card_type)}: <span className="text-blue-300">{gc.username}</span>
                                    </span>
                                    <Button
                                      onClick={() => handleEditGiftCard(gc)}
                                      size="sm"
                                      className="h-5 px-2 text-xs bg-blue-600 hover:bg-blue-500"
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {getCustomerGiftCards(customer.id).filter(gc => gc.username).length === 0 && (
                              <span className="text-slate-500 italic text-xs">No accounts</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-emerald-400 font-semibold">Consoles:</span>
                          <div className="text-slate-300">
                            {getCustomerConsoles(customer.id).map(console => (
                              <span key={console.id} className="inline-block bg-slate-600 px-2 py-1 rounded mr-2 mb-1">
                                {console.console_type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
