import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* PLAY Logo */}
        <div className="text-center mb-8">
          <img 
            src="/play-black.png" 
            alt="PLAY Logo" 
            className="h-64 w-auto mx-auto drop-shadow-2xl"
          />
        </div>
        
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-emerald-400 mb-6">PLAY Barbados</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Your premier destination for gaming and entertainment in Barbados. 
              From gift cards to video games, we've got everything you need for the ultimate gaming experience.
            </p>
          </div>
          
          <div className="space-y-6">
            <Link href="/customer-info">
              <Button 
                size="lg" 
                className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 shadow-lg hover:shadow-emerald-400/25 transition-all duration-300 transform hover:scale-105"
              >
                Get Started - Customer Information
              </Button>
            </Link>
            
            <p className="text-slate-400 text-base">
              Complete our customer information form to get started with PLAY Barbados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
