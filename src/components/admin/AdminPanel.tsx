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
  full_name: string;
  date_of_birth: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  custom_country_code?: string;
  created_at: string;
  is_minor: boolean;
  guardian_full_name?: string;
  guardian_date_of_birth?: string;
}

interface CustomerGiftCard {
  id: string;
  customer_id: string;
  gift_card_type: string;
  username: string;
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

export default function AdminPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [giftCards, setGiftCards] = useState<CustomerGiftCard[]>([]);
  const [consoles, setConsoles] = useState<CustomerConsole[]>([]);
  const [shoppingCategories, setShoppingCategories] = useState<CustomerShoppingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGiftCard, setFilterGiftCard] = useState<string>('all');
  const [filterConsole, setFilterConsole] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data (this will work before RLS is enabled)
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const { data: giftCardsData, error: giftCardsError } = await supabase
        .from('customer_gift_cards')
        .select('*');

      if (giftCardsError) throw giftCardsError;

      const { data: consolesData, error: consolesError } = await supabase
        .from('customer_consoles')
        .select('*');

      if (consolesError) throw consolesError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('customer_shopping_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      setCustomers(customersData || []);
      setGiftCards(giftCardsData || []);
      setConsoles(consolesData || []);
      setShoppingCategories(categoriesData || []);

    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.whatsapp_number.includes(searchTerm);
    
    // If no filters are applied, just return search results
    if (filterCategory === 'all' && filterGiftCard === 'all' && filterConsole === 'all') {
      return matchesSearch;
    }
    
    // Get customer's related data
    const customerCategories = shoppingCategories
      .filter(cat => cat.customer_id === customer.id)
      .map(cat => cat.category);
    
    const customerGiftCards = giftCards
      .filter(gc => gc.customer_id === customer.id)
      .map(gc => gc.gift_card_type);
    
    const customerConsoles = consoles
      .filter(c => c.customer_id === customer.id)
      .map(c => c.console_type);
    
    // Debug logging
    logger.debug(`Customer ${customer.full_name}:`, {
      categories: customerCategories,
      giftCards: customerGiftCards,
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
      const hasGiftCard = customerGiftCards.includes(filterGiftCard);
      matchesFilters = matchesFilters && hasGiftCard;
      logger.debug(`Gift card filter ${filterGiftCard}: ${hasGiftCard}`);
    }
    
    // Console filter - check if customer has the selected console
    if (filterConsole !== 'all') {
      const hasConsole = customerConsoles.includes(filterConsole);
      matchesFilters = matchesFilters && hasConsole;
      logger.debug(`Console filter ${filterConsole}: ${hasConsole}`);
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

  const exportToCSV = () => {
    // Use filteredCustomers instead of customers to respect current filters
    const csvData = filteredCustomers.map(customer => {
      const giftCards = getCustomerGiftCards(customer.id);
      const consoles = getCustomerConsoles(customer.id);
      const categories = getCustomerCategories(customer.id);
      
      return {
        'Full Name': customer.full_name,
        'Date of Birth': customer.date_of_birth,
        'WhatsApp': `${customer.whatsapp_country_code}${customer.whatsapp_number}`,
        'Is Minor': customer.is_minor,
        'Guardian Name': customer.guardian_full_name || '',
        'Shopping Categories': categories.map(c => c.category).join(', '),
        'Gift Cards': giftCards.map(gc => `${gc.gift_card_type}: ${gc.username}`).join('; '),
        'Consoles': consoles.map(c => c.console_type).join(', '),
        'Created': customer.created_at
      };
    });

    const csv = convertToCSV(csvData);
    
    // Create filename with filter info
    let filename = 'play-barbados-customers';
    if (filterCategory !== 'all' || filterGiftCard !== 'all' || filterConsole !== 'all' || searchTerm) {
      filename += '-filtered';
      if (filterCategory !== 'all') filename += `-${filterCategory}`;
      if (filterGiftCard !== 'all') filename += `-${filterGiftCard}`;
      if (filterConsole !== 'all') filename += `-${filterConsole}`;
      if (searchTerm) filename += `-search-${searchTerm}`;
    }
    filename += '.csv';
    
    downloadCSV(csv, filename);
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value}"`;
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
                <SelectItem value="xboxone">Xbox One</SelectItem>
                <SelectItem value="xbox360">Xbox 360</SelectItem>
                <SelectItem value="ps4">PlayStation 4</SelectItem>
                <SelectItem value="ps5">PlayStation 5</SelectItem>
                <SelectItem value="nintendoswitch">Nintendo Switch</SelectItem>
                <SelectItem value="nintendoswitch2">Nintendo Switch 2</SelectItem>
                <SelectItem value="pc">PC</SelectItem>
                <SelectItem value="retro">Retro</SelectItem>
                <SelectItem value="ps1">PS1</SelectItem>
                <SelectItem value="ps2">PS2</SelectItem>
                <SelectItem value="xbox">Xbox</SelectItem>
                <SelectItem value="psp">PSP</SelectItem>
                <SelectItem value="nintendo64-snes">Nintendo 64/SNES</SelectItem>
                <SelectItem value="nintendo3ds-ds-wii">Nintendo 3DS/DS/WII</SelectItem>
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
                {filterCategory === 'all' && filterGiftCard === 'all' && filterConsole === 'all' && 'None'}
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
                <div key={customer.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
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
                          <h3 className="text-xl font-semibold text-white">{customer.full_name}</h3>
                          <p className="text-slate-300">
                             {customer.whatsapp_country_code}{customer.whatsapp_number}
                          </p>
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
                          <span className="text-emerald-400 font-semibold">Gift Cards:</span>
                          <div className="text-slate-300">
                            {getCustomerGiftCards(customer.id).map(gc => (
                              <div key={gc.id} className="text-xs">
                                {gc.gift_card_type}: {gc.username}
                              </div>
                            ))}
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
